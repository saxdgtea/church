const express = require("express");
const router = express.Router();
const Sermon = require("../models/Sermon");
const SermonLike = require("../models/SermonLike");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const {
  sermonValidation,
  validateObjectId,
  validate,
} = require("../utils/validation");

// @route   GET /api/sermons
// @desc    Get all published sermons
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-date" } = req.query;

    const sermons = await Sermon.find({ isPublished: true })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const count = await Sermon.countDocuments({ isPublished: true });

    res.status(200).json({
      success: true,
      count: sermons.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: sermons,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/sermons/:id
// @desc    Get single sermon
// @access  Public
router.get("/:id", validateObjectId, validate, async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: "Sermon not found",
      });
    }

    res.status(200).json({
      success: true,
      data: sermon,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/sermons
// @desc    Create new sermon
// @access  Private (Admin/Editor)
router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  sermonValidation,
  validate,
  async (req, res, next) => {
    try {
      const { title, description, scripture, youtubeUrl, date, pastor } =
        req.body;

      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a sermon image",
        });
      }

      // Upload image to Cloudinary
      const imageResult = await uploadImage(
        req.file.buffer,
        "church-website/sermons"
      );

      // Extract YouTube video ID
      const extractYouTubeId = (url) => {
        const regex =
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
      };

      const youtubeVideoId = extractYouTubeId(youtubeUrl);

      if (!youtubeVideoId) {
        // Delete uploaded image if YouTube URL is invalid
        await deleteImage(imageResult.publicId);
        return res.status(400).json({
          success: false,
          message: "Invalid YouTube URL",
        });
      }

      // Create sermon
      const sermon = await Sermon.create({
        title,
        description,
        scripture,
        imageUrl: imageResult.url,
        imagePublicId: imageResult.publicId,
        youtubeUrl,
        youtubeVideoId,
        date: date || Date.now(),
        pastor: pastor || "Pastor",
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Sermon created successfully",
        data: sermon,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/sermons/:id
// @desc    Update sermon
// @access  Private (Admin/Editor)
router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  uploadSingle,
  handleUploadError,
  sermonValidation,
  validate,
  async (req, res, next) => {
    try {
      let sermon = await Sermon.findById(req.params.id);

      if (!sermon) {
        return res.status(404).json({
          success: false,
          message: "Sermon not found",
        });
      }

      const updateData = { ...req.body };

      // If new image uploaded, upload to Cloudinary and delete old one
      if (req.file) {
        const imageResult = await uploadImage(
          req.file.buffer,
          "church-website/sermons"
        );

        // Delete old image
        if (sermon.imagePublicId) {
          await deleteImage(sermon.imagePublicId);
        }

        updateData.imageUrl = imageResult.url;
        updateData.imagePublicId = imageResult.publicId;
      }

      // Extract YouTube video ID if URL changed
      if (req.body.youtubeUrl && req.body.youtubeUrl !== sermon.youtubeUrl) {
        const extractYouTubeId = (url) => {
          const regex =
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const match = url.match(regex);
          return match ? match[1] : null;
        };

        const youtubeVideoId = extractYouTubeId(req.body.youtubeUrl);
        if (youtubeVideoId) {
          updateData.youtubeVideoId = youtubeVideoId;
        }
      }

      sermon = await Sermon.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: "Sermon updated successfully",
        data: sermon,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/sermons/:id
// @desc    Delete sermon
// @access  Private (Admin)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const sermon = await Sermon.findById(req.params.id);

      if (!sermon) {
        return res.status(404).json({
          success: false,
          message: "Sermon not found",
        });
      }

      // Delete image from Cloudinary
      if (sermon.imagePublicId) {
        await deleteImage(sermon.imagePublicId);
      }

      // Delete all likes for this sermon
      await SermonLike.deleteMany({ sermon: req.params.id });

      await sermon.deleteOne();

      res.status(200).json({
        success: true,
        message: "Sermon deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/sermons/:id/like
// @desc    Like/Unlike sermon
// @access  Public
router.post("/:id/like", validateObjectId, validate, async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: "Sermon not found",
      });
    }

    // Get user identifier (IP address or session ID from request)
    const userIdentifier = req.headers["x-user-id"] || req.ip || "anonymous";
    const ipAddress = req.ip;

    // Check if user already liked this sermon
    const existingLike = await SermonLike.findOne({
      sermon: req.params.id,
      userIdentifier,
    });

    if (existingLike) {
      // Unlike - remove like
      await existingLike.deleteOne();
      sermon.likes = Math.max(0, sermon.likes - 1);
      await sermon.save();

      return res.status(200).json({
        success: true,
        message: "Sermon unliked",
        data: {
          liked: false,
          likes: sermon.likes,
        },
      });
    } else {
      // Like - add like
      await SermonLike.create({
        sermon: req.params.id,
        userIdentifier,
        ipAddress,
      });

      sermon.likes += 1;
      await sermon.save();

      return res.status(200).json({
        success: true,
        message: "Sermon liked",
        data: {
          liked: true,
          likes: sermon.likes,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/sermons/:id/like-status
// @desc    Check if user liked sermon
// @access  Public
router.get(
  "/:id/like-status",
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const userIdentifier = req.headers["x-user-id"] || req.ip || "anonymous";

      const existingLike = await SermonLike.findOne({
        sermon: req.params.id,
        userIdentifier,
      });

      res.status(200).json({
        success: true,
        data: {
          liked: !!existingLike,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

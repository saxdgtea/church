const express = require("express");
const router = express.Router();
const About = require("../models/About");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// @route   GET /api/about
// @desc    Get about page content
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    let about = await About.findOne();

    // If no about page exists, create default
    if (!about) {
      about = await About.create({
        welcomeMessage: "Welcome to our church family",
        sections: [],
        leadership: [],
        missionStatement: "",
        visionStatement: "",
        coreValues: [],
      });
    }

    res.status(200).json({
      success: true,
      data: about,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/about
// @desc    Update about page content
// @access  Private (Admin/Editor)
router.put(
  "/",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  async (req, res, next) => {
    try {
      let about = await About.findOne();

      if (!about) {
        about = new About();
      }

      const updateData = { ...req.body };

      // Parse JSON strings if sent as form data
      if (typeof updateData.sections === "string") {
        updateData.sections = JSON.parse(updateData.sections);
      }
      if (typeof updateData.leadership === "string") {
        updateData.leadership = JSON.parse(updateData.leadership);
      }
      if (typeof updateData.coreValues === "string") {
        updateData.coreValues = JSON.parse(updateData.coreValues);
      }

      // If new welcome image uploaded
      if (req.file) {
        const imageResult = await uploadImage(
          req.file.buffer,
          "church-website/about"
        );

        // Delete old welcome image if exists
        if (about.welcomeImagePublicId) {
          await deleteImage(about.welcomeImagePublicId);
        }

        updateData.welcomeImageUrl = imageResult.url;
        updateData.welcomeImagePublicId = imageResult.publicId;
      }

      updateData.lastUpdated = Date.now();
      updateData.updatedBy = req.user._id;

      Object.assign(about, updateData);
      await about.save();

      res.status(200).json({
        success: true,
        message: "About page updated successfully",
        data: about,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/about/section-image
// @desc    Upload image for a section
// @access  Private (Admin/Editor)
router.post(
  "/section-image",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image",
        });
      }

      const imageResult = await uploadImage(
        req.file.buffer,
        "church-website/about"
      );

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: imageResult.url,
          publicId: imageResult.publicId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/about/leader-image
// @desc    Upload image for a leader
// @access  Private (Admin/Editor)
router.post(
  "/leader-image",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image",
        });
      }

      const imageResult = await uploadImage(
        req.file.buffer,
        "church-website/about/leaders"
      );

      res.status(200).json({
        success: true,
        message: "Leader image uploaded successfully",
        data: {
          url: imageResult.url,
          publicId: imageResult.publicId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/about/image/:publicId
// @desc    Delete image from about page
// @access  Private (Admin/Editor)
router.delete(
  "/image/:publicId",
  protect,
  authorize("admin", "editor"),
  async (req, res, next) => {
    try {
      // Replace URL-encoded slashes
      const publicId = req.params.publicId.replace(/%2F/g, "/");

      await deleteImage(publicId);

      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

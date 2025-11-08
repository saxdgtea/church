const express = require("express");
const router = express.Router();
const Ministry = require("../models/Ministry");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const {
  ministryValidation,
  validateObjectId,
  validate,
} = require("../utils/validation");

// @route   GET /api/ministries
// @desc    Get all active ministries
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const ministries = await Ministry.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: ministries.length,
      data: ministries,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ministries/:id
// @desc    Get single ministry
// @access  Public
router.get("/:id", validateObjectId, validate, async (req, res, next) => {
  try {
    const ministry = await Ministry.findById(req.params.id);

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ministry,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/ministries
// @desc    Create new ministry
// @access  Private (Admin/Editor)
router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  ministryValidation,
  validate,
  async (req, res, next) => {
    try {
      const {
        name,
        description,
        contactPerson,
        contactEmail,
        contactPhone,
        schedule,
        order,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a ministry image",
        });
      }

      // Upload image to Cloudinary
      const imageResult = await uploadImage(
        req.file.buffer,
        "church-website/ministries"
      );

      // Create ministry
      const ministry = await Ministry.create({
        name,
        description,
        imageUrl: imageResult.url,
        imagePublicId: imageResult.publicId,
        contactPerson,
        contactEmail,
        contactPhone,
        schedule,
        order: order || 0,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Ministry created successfully",
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/ministries/:id
// @desc    Update ministry
// @access  Private (Admin/Editor)
router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  uploadSingle,
  handleUploadError,
  ministryValidation,
  validate,
  async (req, res, next) => {
    try {
      let ministry = await Ministry.findById(req.params.id);

      if (!ministry) {
        return res.status(404).json({
          success: false,
          message: "Ministry not found",
        });
      }

      const updateData = { ...req.body };

      // If new image uploaded, upload to Cloudinary and delete old one
      if (req.file) {
        const imageResult = await uploadImage(
          req.file.buffer,
          "church-website/ministries"
        );

        // Delete old image
        if (ministry.imagePublicId) {
          await deleteImage(ministry.imagePublicId);
        }

        updateData.imageUrl = imageResult.url;
        updateData.imagePublicId = imageResult.publicId;
      }

      ministry = await Ministry.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: "Ministry updated successfully",
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/ministries/:id
// @desc    Delete ministry
// @access  Private (Admin)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const ministry = await Ministry.findById(req.params.id);

      if (!ministry) {
        return res.status(404).json({
          success: false,
          message: "Ministry not found",
        });
      }

      // Delete image from Cloudinary
      if (ministry.imagePublicId) {
        await deleteImage(ministry.imagePublicId);
      }

      await ministry.deleteOne();

      res.status(200).json({
        success: true,
        message: "Ministry deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const HeroSettings = require("../models/HeroSettings");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// @route   GET /api/hero-settings/:page
// @desc    Get hero settings for a specific page
// @access  Public
router.get("/:page", async (req, res, next) => {
  try {
    let heroSettings = await HeroSettings.findOne({ page: req.params.page });

    // Create default if doesn't exist
    if (!heroSettings) {
      const defaultTitles = {
        home: "Welcome to Our Church",
        sermons: "Sermons",
        ministries: "Our Ministries",
        events: "Events",
        gallery: "Photo Gallery",
        about: "About Us",
        contact: "Contact Us",
      };

      heroSettings = await HeroSettings.create({
        page: req.params.page,
        title: defaultTitles[req.params.page] || "Welcome",
        subtitle: "Join us in worship and fellowship",
      });
    }

    res.status(200).json({
      success: true,
      data: heroSettings,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/hero-settings/:page
// @desc    Update hero settings
// @access  Private (Admin/Editor)
router.put(
  "/:page",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  async (req, res, next) => {
    try {
      let heroSettings = await HeroSettings.findOne({ page: req.params.page });

      if (!heroSettings) {
        return res.status(404).json({
          success: false,
          message: "Hero settings not found",
        });
      }

      const updateData = { ...req.body };

      // Upload new background image if provided
      if (req.file) {
        const imageResult = await uploadImage(
          req.file.buffer,
          "church-website/hero-backgrounds"
        );

        // Delete old image if exists
        if (heroSettings.backgroundImagePublicId) {
          await deleteImage(heroSettings.backgroundImagePublicId);
        }

        updateData.backgroundImageUrl = imageResult.url;
        updateData.backgroundImagePublicId = imageResult.publicId;
      }

      updateData.updatedBy = req.user._id;

      heroSettings = await HeroSettings.findOneAndUpdate(
        { page: req.params.page },
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Hero settings updated successfully",
        data: heroSettings,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

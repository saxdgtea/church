const express = require("express");
const router = express.Router();
const About = require("../models/About");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const mongoose = require("mongoose"); // Ensure mongoose is imported for validation

// @route   GET /api/about
// @desc    Get about page content
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    let about = await About.findOne();

    // If no about page exists, create default. This path is safe
    // because we are creating with empty, clean arrays.
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
// @desc    Update or Create about page content
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

      // This handles the CREATE case: if no document exists, create a new one.
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

      // --- FIX: Sanitize incoming data to remove temporary IDs ---
      // This is the first line of defense for the UPDATE case.
      const cleanArray = (arr) => {
        if (!arr || !Array.isArray(arr)) return arr;
        return arr.map((item) => {
          // If _id is not a valid ObjectId, create a new object without it.
          if (item._id && !mongoose.Types.ObjectId.isValid(item._id)) {
            const { _id, ...rest } = item;
            return rest;
          }
          return item;
        });
      };

      updateData.leadership = cleanArray(updateData.leadership);
      updateData.sections = cleanArray(updateData.sections);

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

      // Merge the cleaned data into the document
      Object.assign(about, updateData);

      // The save() operation will trigger the pre('save') hook in the schema,
      // which acts as the final safety net for both CREATE and UPDATE.
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

// ... (rest of the routes remain the same) ...

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

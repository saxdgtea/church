const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { protect, authorize } = require("../middleware/auth");
const { uploadSingle, handleUploadError } = require("../middleware/upload");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const {
  eventValidation,
  validateObjectId,
  validate,
} = require("../utils/validation");

// @route   GET /api/events
// @desc    Get all published events
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { upcoming, featured, category } = req.query;

    let query = { isPublished: true };

    // Filter for upcoming events
    if (upcoming === "true") {
      query.startDate = { $gte: new Date() };
    }

    // Filter for featured events
    if (featured === "true") {
      query.isFeatured = true;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get("/:id", validateObjectId, validate, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin/Editor)
router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  uploadSingle,
  handleUploadError,
  eventValidation,
  validate,
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        category,
        isFeatured,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an event image",
        });
      }

      // Upload image to Cloudinary
      const imageResult = await uploadImage(
        req.file.buffer,
        "church-website/events"
      );

      // Create event
      const event = await Event.create({
        title,
        description,
        imageUrl: imageResult.url,
        imagePublicId: imageResult.publicId,
        startDate,
        endDate,
        location,
        category: category || "other",
        isFeatured: isFeatured || false,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin/Editor)
router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  uploadSingle,
  handleUploadError,
  eventValidation,
  validate,
  async (req, res, next) => {
    try {
      let event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const updateData = { ...req.body };

      // If new image uploaded, upload to Cloudinary and delete old one
      if (req.file) {
        const imageResult = await uploadImage(
          req.file.buffer,
          "church-website/events"
        );

        // Delete old image
        if (event.imagePublicId) {
          await deleteImage(event.imagePublicId);
        }

        updateData.imageUrl = imageResult.url;
        updateData.imagePublicId = imageResult.publicId;
      }

      event = await Event.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: "Event updated successfully",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Delete image from Cloudinary
      if (event.imagePublicId) {
        await deleteImage(event.imagePublicId);
      }

      await event.deleteOne();

      res.status(200).json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

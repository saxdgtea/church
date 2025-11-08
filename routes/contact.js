const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { protect, authorize } = require("../middleware/auth");
const {
  contactValidation,
  validateObjectId,
  validate,
} = require("../utils/validation");

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post("/", contactValidation, validate, async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message:
        "Your message has been sent successfully. We will get back to you soon!",
      data: {
        id: contact._id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages
// @access  Private (Admin/Editor)
router.get(
  "/messages",
  protect,
  authorize("admin", "editor"),
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      let query = {};

      if (status) {
        query.status = status;
      }

      const messages = await Contact.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select("-__v");

      const count = await Contact.countDocuments(query);

      res.status(200).json({
        success: true,
        count: messages.length,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/contact/messages/:id
// @desc    Get single contact message
// @access  Private (Admin/Editor)
router.get(
  "/messages/:id",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const message = await Contact.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Mark as read if not already
      if (!message.isRead) {
        message.isRead = true;
        message.readAt = Date.now();
        message.status = "read";
        await message.save();
      }

      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/contact/messages/:id
// @desc    Update contact message status/notes
// @access  Private (Admin/Editor)
router.put(
  "/messages/:id",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;

      const message = await Contact.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      if (status) {
        message.status = status;
      }

      if (notes !== undefined) {
        message.notes = notes;
      }

      await message.save();

      res.status(200).json({
        success: true,
        message: "Message updated successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/contact/messages/:id
// @desc    Delete contact message
// @access  Private (Admin)
router.delete(
  "/messages/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const message = await Contact.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      await message.deleteOne();

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

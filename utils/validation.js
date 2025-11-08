const { body, param, query, validationResult } = require("express-validator");

// Validation middleware to check for errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Sermon validation rules
exports.sermonValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("scripture")
    .trim()
    .notEmpty()
    .withMessage("Scripture reference is required")
    .isLength({ max: 100 })
    .withMessage("Scripture reference cannot exceed 100 characters"),
  body("youtubeUrl")
    .trim()
    .notEmpty()
    .withMessage("YouTube URL is required")
    .matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
    .withMessage("Please provide a valid YouTube URL"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),
  body("pastor").optional().trim(),
];

// Ministry validation rules
exports.ministryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Ministry name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("contactEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("contactPhone").optional().trim(),
];

// Event validation rules
exports.eventValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Event title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Please provide a valid start date"),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Please provide a valid end date"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters"),
  body("category")
    .optional()
    .isIn([
      "worship",
      "bible-study",
      "youth",
      "outreach",
      "fellowship",
      "other",
    ])
    .withMessage("Invalid category"),
];

// Contact form validation rules
exports.contactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 2000 })
    .withMessage("Message cannot exceed 2000 characters"),
  body("subject")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject cannot exceed 200 characters"),
];

// Auth validation rules
exports.registerValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// MongoDB ObjectId validation
exports.validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

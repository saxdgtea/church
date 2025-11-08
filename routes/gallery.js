const express = require("express");
const router = express.Router();
const Gallery = require("../models/Gallery");
const { protect, authorize } = require("../middleware/auth");
const { uploadMultiple, handleUploadError } = require("../middleware/upload");
const { uploadMultipleImages, deleteImage } = require("../utils/cloudinary");
const { validateObjectId, validate } = require("../utils/validation");
const { body } = require("express-validator");

// Gallery album validation
const albumValidation = [
  body("albumName")
    .trim()
    .notEmpty()
    .withMessage("Album name is required")
    .isLength({ max: 100 })
    .withMessage("Album name cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
];

// @route   GET /api/gallery
// @desc    Get all published albums
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const albums = await Gallery.find({ isPublished: true })
      .sort({ date: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: albums.length,
      data: albums,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/gallery/:id
// @desc    Get single album
// @access  Public
router.get("/:id", validateObjectId, validate, async (req, res, next) => {
  try {
    const album = await Gallery.findById(req.params.id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    res.status(200).json({
      success: true,
      data: album,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/gallery
// @desc    Create new album
// @access  Private (Admin/Editor)
router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  uploadMultiple,
  handleUploadError,
  albumValidation,
  validate,
  async (req, res, next) => {
    try {
      const { albumName, description, date } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one image",
        });
      }

      // Upload images to Cloudinary
      const imageResults = await uploadMultipleImages(
        req.files,
        "church-website/gallery"
      );

      // Format images for database
      const images = imageResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        caption: req.body[`captions[${index}]`] || "",
      }));

      // First image as cover image
      const coverImage = {
        url: imageResults[0].url,
        publicId: imageResults[0].publicId,
      };

      // Create album
      const album = await Gallery.create({
        albumName,
        description,
        coverImage,
        images,
        date: date || Date.now(),
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Album created successfully",
        data: album,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/gallery/:id/images
// @desc    Add images to existing album
// @access  Private (Admin/Editor)
router.post(
  "/:id/images",
  protect,
  authorize("admin", "editor"),
  validateObjectId,
  validate,
  uploadMultiple,
  handleUploadError,
  async (req, res, next) => {
    try {
      const album = await Gallery.findById(req.params.id);

      if (!album) {
        return res.status(404).json({
          success: false,
          message: "Album not found",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one image",
        });
      }

      // Upload images to Cloudinary
      const imageResults = await uploadMultipleImages(
        req.files,
        "church-website/gallery"
      );

      // Format new images
      const newImages = imageResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        caption: req.body[`captions[${index}]`] || "",
      }));

      // Add to existing images
      album.images.push(...newImages);
      await album.save();

      res.status(200).json({
        success: true,
        message: "Images added successfully",
        data: album,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/gallery/:id
// @desc    Delete album
// @access  Private (Admin)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  validate,
  async (req, res, next) => {
    try {
      const album = await Gallery.findById(req.params.id);

      if (!album) {
        return res.status(404).json({
          success: false,
          message: "Album not found",
        });
      }

      // Delete all images from Cloudinary
      const deletePromises = album.images.map((image) =>
        deleteImage(image.publicId)
      );

      if (album.coverImage && album.coverImage.publicId) {
        deletePromises.push(deleteImage(album.coverImage.publicId));
      }

      await Promise.all(deletePromises);

      await album.deleteOne();

      res.status(200).json({
        success: true,
        message: "Album deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/gallery/:albumId/images/:imageId
// @desc    Delete single image from album
// @access  Private (Admin/Editor)
router.delete(
  "/:albumId/images/:imageId",
  protect,
  authorize("admin", "editor"),
  async (req, res, next) => {
    try {
      const album = await Gallery.findById(req.params.albumId);

      if (!album) {
        return res.status(404).json({
          success: false,
          message: "Album not found",
        });
      }

      const image = album.images.id(req.params.imageId);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: "Image not found",
        });
      }

      // Delete from Cloudinary
      await deleteImage(image.publicId);

      // Remove from array
      image.deleteOne();
      await album.save();

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

const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [200, "Caption cannot exceed 200 characters"],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const gallerySchema = new mongoose.Schema(
  {
    albumName: {
      type: String,
      required: [true, "Album name is required"],
      trim: true,
      maxlength: [100, "Album name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    coverImage: {
      url: String,
      publicId: String,
    },
    images: [imageSchema],
    date: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
gallerySchema.index({ date: -1, isPublished: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);

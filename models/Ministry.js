const mongoose = require("mongoose");

const ministrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ministry name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Ministry description is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Ministry image is required"],
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, "Contact person name cannot exceed 100 characters"],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    schedule: {
      type: String,
      trim: true,
      maxlength: [200, "Schedule cannot exceed 200 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
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

// Index for ordering
ministrySchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model("Ministry", ministrySchema);

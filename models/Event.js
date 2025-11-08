const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Event image is required"],
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    category: {
      type: String,
      enum: [
        "worship",
        "bible-study",
        "youth",
        "outreach",
        "fellowship",
        "other",
      ],
      default: "other",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

// Index for efficient date queries
eventSchema.index({ startDate: -1, isPublished: 1 });

// Virtual to check if event is upcoming
eventSchema.virtual("isUpcoming").get(function () {
  return this.startDate > new Date();
});

module.exports = mongoose.model("Event", eventSchema);

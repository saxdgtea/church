const mongoose = require("mongoose");

const sermonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Sermon title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Sermon description is required"],
      trim: true,
    },
    scripture: {
      type: String,
      required: [true, "Scripture reference is required"],
      trim: true,
      maxlength: [100, "Scripture reference cannot exceed 100 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Sermon image is required"],
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
        },
        message: "Please provide a valid YouTube URL",
      },
    },
    youtubeVideoId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Sermon date is required"],
      default: Date.now,
    },
    pastor: {
      type: String,
      trim: true,
      default: "Pastor",
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
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
sermonSchema.index({ date: -1 });
sermonSchema.index({ isPublished: 1 });

// Extract YouTube video ID before saving
// Replace the extractYouTubeId method with this improved version

sermonSchema.methods.extractYouTubeId = function (url) {
  // Handle multiple YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/, // youtube.com/watch?v=ID
    /(?:youtube\.com\/embed\/)([^?\s]+)/, // youtube.com/embed/ID
    /(?:youtube\.com\/v\/)([^?\s]+)/, // youtube.com/v/ID
    /(?:youtu\.be\/)([^?\s]+)/, // youtu.be/ID
    /(?:youtube\.com\/shorts\/)([^?\s]+)/, // youtube.com/shorts/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Also update the pre-save hook to be more robust
sermonSchema.pre("save", function (next) {
  if (this.isModified("youtubeUrl") && this.youtubeUrl) {
    const videoId = this.extractYouTubeId(this.youtubeUrl);
    if (videoId) {
      this.youtubeVideoId = videoId;
    } else {
      return next(new Error("Invalid YouTube URL format"));
    }
  }
  next();
});
module.exports = mongoose.model("Sermon", sermonSchema);

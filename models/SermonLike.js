const mongoose = require("mongoose");

const sermonLikeSchema = new mongoose.Schema(
  {
    sermon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sermon",
      required: true,
    },
    userIdentifier: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000, // 90 days - auto delete after 90 days
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one like per user per sermon
sermonLikeSchema.index({ sermon: 1, userIdentifier: 1 }, { unique: true });

module.exports = mongoose.model("SermonLike", sermonLikeSchema);

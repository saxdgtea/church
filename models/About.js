const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: String,
  imagePublicId: String,
  order: {
    type: Number,
    default: 0,
  },
});

const leaderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  imageUrl: String,
  imagePublicId: String,
  order: {
    type: Number,
    default: 0,
  },
});

const aboutSchema = new mongoose.Schema(
  {
    welcomeMessage: {
      type: String,
      required: true,
      trim: true,
    },
    welcomeImageUrl: String,
    welcomeImagePublicId: String,
    sections: [sectionSchema],
    leadership: [leaderSchema],
    missionStatement: {
      type: String,
      trim: true,
    },
    visionStatement: {
      type: String,
      trim: true,
    },
    coreValues: [
      {
        type: String,
        trim: true,
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Only allow one about doc
//aboutSchema.index({ _id: 1 }, { unique: true });

// ✅ Export the model so `require()` returns a working Mongoose model
module.exports = mongoose.model("About", aboutSchema);

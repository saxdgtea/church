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

// --- FIX: Add pre-save hook to clean temporary IDs for both CREATE and UPDATE ---
aboutSchema.pre("save", function (next) {
  // Helper function to clean an array of subdocuments
  const cleanSubdocs = (subdocs) => {
    if (!subdocs || !Array.isArray(subdocs)) {
      return;
    }
    subdocs.forEach((doc) => {
      // If _id exists and is not a valid ObjectId, delete it.
      // Mongoose will automatically generate a new one for new subdocuments.
      if (doc._id && !mongoose.Types.ObjectId.isValid(doc._id)) {
        delete doc._id;
      }
    });
  };

  // Apply cleaning to both arrays that contain subdocuments
  cleanSubdocs(this.leadership);
  cleanSubdocs(this.sections);

  next();
});

// Only allow one about doc
//aboutSchema.index({ _id: 1 }, { unique: true });

module.exports = mongoose.model("About", aboutSchema);

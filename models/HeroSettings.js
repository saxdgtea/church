const mongoose = require("mongoose");

const heroSettingsSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "home",
        "sermons",
        "ministries",
        "events",
        "gallery",
        "about",
        "contact",
      ],
    },
    backgroundImageUrl: {
      type: String,
      default: "",
    },
    backgroundImagePublicId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    overlayOpacity: {
      type: Number,
      default: 0.6,
      min: 0,
      max: 1,
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

module.exports = mongoose.model("HeroSettings", heroSettingsSchema);

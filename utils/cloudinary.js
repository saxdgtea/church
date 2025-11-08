const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Upload image to Cloudinary from buffer
exports.uploadImage = (buffer, folder = "church-website") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Delete image from Cloudinary
exports.deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Upload multiple images
exports.uploadMultipleImages = async (files, folder = "church-website") => {
  try {
    const uploadPromises = files.map((file) =>
      exports.uploadImage(file.buffer, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

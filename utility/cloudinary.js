require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function with optimization
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No local file path provided");
      return null;
    }

    console.log("Uploading file to Cloudinary:", localFilePath);

    // Upload the file to Cloudinary with optimization
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Detects image or video
      folder: "social-media", // Keep your folder structure
      transformation: [
        { fetch_format: "auto", quality: "auto" }, // Optimize format and quality
        { width: 800, height: 800, crop: "limit" }, // Resize to max 800x800 (adjust as needed)
      ],
    });

    console.log(
      "File uploaded successfully to Cloudinary:",
      response.secure_url
    );
    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);

    // Clean up temporary file on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Temporary file deleted:", localFilePath);
    }

    return null;
  }
};

module.exports = { uploadOnCloudinary };

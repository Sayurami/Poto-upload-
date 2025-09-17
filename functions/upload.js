const { unlinkSync } = require("fs");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { builder } = require("@netlify/functions");
require("dotenv").config();

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for temporary storage
const upload = multer({ dest: "/tmp" });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "gojo_uploads",
      use_filename: true,
      unique_filename: false,
    });

    // Remove temporary file
    unlinkSync(filePath);

    res.status(200).json({
      message: "File uploaded successfully!",
      url: result.secure_url,
      originalName,
    });
  } catch (error) {
    // Remove temporary file even if upload fails
    try {
      unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }

    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// Export Netlify function
module.exports.handler = builder(app);

const { writeFileSync, unlinkSync } = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { builder } = require("@netlify/functions");
require("dotenv").config();

const app = express();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for temporary storage
const upload = multer({ dest: "/tmp" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "gojo_uploads",
      use_filename: true,
      unique_filename: false
    });

    // Delete temporary file
    unlinkSync(filePath);

    res.status(200).json({
      message: "File uploaded successfully!",
      url: result.secure_url,
      originalName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

module.exports.handler = builder(app);

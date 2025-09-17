require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
const { builder } = require('@netlify/functions');

const app = express();
const upload = multer({ dest: '/tmp/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const metaFile = path.join(__dirname, '../public/uploads/meta.json');
if (!fs.existsSync(metaFile)) fs.writeFileSync(metaFile, JSON.stringify([]));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { name, description } = req.body;

  try {
    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'gojo_gallery' });
    fs.unlinkSync(req.file.path);

    const meta = JSON.parse(fs.readFileSync(metaFile));
    meta.push({ url: result.secure_url, name: name || 'No Name', description: description || 'No Description' });
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/uploads', (req, res) => {
  const meta = JSON.parse(fs.readFileSync(metaFile));
  res.json(meta);
});

module.exports.handler = builder(app);

const { builder } = require('@netlify/functions');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Use /tmp for temporary upload storage in Netlify
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const metaFile = path.join(uploadDir, 'meta.json');

// Upload
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded!' });

  // Move file from /tmp to public/uploads
  const targetPath = path.join(uploadDir, req.file.filename);
  fs.renameSync(req.file.path, targetPath);

  const { name, description } = req.body;
  let meta = [];
  if (fs.existsSync(metaFile)) meta = JSON.parse(fs.readFileSync(metaFile));

  meta.push({
    file: req.file.filename,
    name: name || 'No Name',
    description: description || 'No Description'
  });

  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  res.json({ success: true, filePath: '/uploads/' + req.file.filename });
});

// Return gallery
app.get('/uploads', (req, res) => {
  let meta = [];
  if (fs.existsSync(metaFile)) meta = JSON.parse(fs.readFileSync(metaFile));
  res.json(meta);
});

// Delete photo
app.delete('/uploads/:file', (req, res) => {
  const fileName = req.params.file;
  let meta = [];
  if (fs.existsSync(metaFile)) meta = JSON.parse(fs.readFileSync(metaFile));

  const index = meta.findIndex(m => m.file === fileName);
  if (index === -1) return res.status(404).json({ message: 'File not found' });

  const filePath = path.join(uploadDir, fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  meta.splice(index, 1);
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

  res.json({ success: true });
});

module.exports.handler = builder(app);

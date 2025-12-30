const express = require('express');
const upload = require('../middleware/upload');
const authGuard = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const path = require('path');

const router = express.Router();

// Upload file đơn
router.post('/single', authGuard, adminGuard, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Upload nhiều file
router.post('/multiple', authGuard, adminGuard, upload.array('files', 10), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files,
    });
  } catch (error) {
    next(error);
  }
});

// Phục vụ các file đã upload
router.get('/:filename', (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

module.exports = router;


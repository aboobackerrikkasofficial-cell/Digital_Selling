const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'thumbnail') {
      cb(null, path.join(__dirname, '../uploads/public'));
    } else {
      cb(null, path.join(__dirname, '../uploads/private'));
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage: storage });

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { files: true } // In production, omit private files from public endpoint
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin Middleware Placeholder (replace with actual JWT check in production)
const checkAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Add proper JWT verification here
  next();
};

// Create Product (Admin Only)
router.post('/', checkAdmin, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'product_files', maxCount: 10 }
]), async (req, res) => {
  try {
    const { title, short_description, description, category, product_type, price, original_price, currency } = req.body;
    
    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        short_description,
        description,
        category,
        product_type,
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        currency: currency || 'INR',
        thumbnail: req.files['thumbnail'] ? `/uploads/public/${req.files['thumbnail'][0].filename}` : null
      }
    });

    // Handle private files
    if (req.files['product_files']) {
      const fileData = req.files['product_files'].map(file => ({
        product_id: product.id,
        filename: file.originalname,
        storage_key: file.filename,
        file_type: file.mimetype,
        file_size: file.size
      }));
      
      await prisma.productFile.createMany({ data: fileData });
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;

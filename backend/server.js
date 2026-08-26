const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory setup
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'uploads', 'public');
const privateDir = path.join(__dirname, 'uploads', 'private');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir, { recursive: true });

// Static serving for public uploads (thumbnails)
app.use('/uploads', express.static(uploadDir));
app.use('/uploads/public', express.static(publicDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'thumbnail_file' || file.fieldname === 'thumbnail') {
      cb(null, publicDir);
    } else {
      cb(null, privateDir);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// AUTH
app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST CREATE PRODUCT (Supports thumbnail_file and product_file)
app.post('/api/products', upload.fields([
  { name: 'thumbnail_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'product_file', maxCount: 1 },
  { name: 'product_files', maxCount: 10 }
]), async (req, res) => {
  try {
    const { title, short_description, description, category, price, badge } = req.body;

    let thumbnail = '';
    const thumbFile = req.files?.['thumbnail_file']?.[0] || req.files?.['thumbnail']?.[0];
    if (thumbFile) {
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      thumbnail = `${protocol}://${host}/uploads/public/${thumbFile.filename}`;
    } else if (req.body.thumbnail && typeof req.body.thumbnail === 'string') {
      thumbnail = req.body.thumbnail;
    }

    const slug = (title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const productFile = req.files?.['product_file']?.[0] || req.files?.['product_files']?.[0];
    const filename = productFile ? productFile.originalname : 'product-file';
    const storage_key = productFile ? productFile.filename : 'none';
    const file_type = productFile ? productFile.mimetype : 'application/octet-stream';
    const file_size = productFile ? productFile.size : 0;

    const product = await prisma.product.create({
      data: {
        title: title || 'Untitled Product',
        slug,
        short_description: short_description || '',
        description: description || short_description || '',
        category: category || 'digital',
        product_type: 'digital',
        price: parseFloat(price) || 0,
        currency: 'INR',
        thumbnail: thumbnail || null,
        active: true,
        files: productFile ? {
          create: {
            filename,
            storage_key,
            file_type,
            file_size
          }
        } : undefined
      }
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
});

// PAYMENTS: CREATE ORDER
app.post('/api/payments/create', async (req, res) => {
  try {
    const { productId, planType, customerEmail, customerPhone } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ success: false, message: 'Razorpay keys not configured' });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const amountInPaise = Math.round(product.price * 100);
    const options = {
      amount: amountInPaise,
      currency: product.currency || 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create payment order' });
  }
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Backend running on port ' + PORT);
});

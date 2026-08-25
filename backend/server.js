const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'uploads', 'public');
const privateDir = path.join(__dirname, 'uploads', 'private');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir);

// Static serving for public uploads (thumbnails)
app.use('/uploads/public', express.static(publicDir));

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  // Simple token check for now (we'll implement properly later)
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded check for initial setup based on user prompt
  if (username === process.env.ADMIN_USERNAME) {
     // Generate token
     const token = jwt.sign({ username }, process.env.SESSION_SECRET, { expiresIn: '1d' });
     return res.json({ token, message: 'Logged in successfully' });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Products Router
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

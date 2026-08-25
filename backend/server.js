const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const products = await prisma.product.findMany();
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Backend running on port ' + PORT);
});

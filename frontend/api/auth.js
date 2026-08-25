import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' })
  }

  try {
    // 1. Fetch admin record from Supabase
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // 2. Hash compare: verify password against hashed version in DB
    const isMatch = await bcrypt.compare(password, admin.password_hash)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // 3. Issue JWT Token
    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' })

    return res.status(200).json({ success: true, token })
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

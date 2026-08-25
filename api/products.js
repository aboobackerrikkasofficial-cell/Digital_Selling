import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' }
      })
      return res.status(200).json({ success: true, products })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, message: 'Server Error' })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}

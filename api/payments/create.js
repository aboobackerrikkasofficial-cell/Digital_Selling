import { PrismaClient } from '@prisma/client'
import Razorpay from 'razorpay'

const prisma = new PrismaClient()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { productId, planType, customerEmail, customerPhone } = req.body

  if (!productId || !planType) {
    return res.status(400).json({ success: false, message: 'Missing product details' })
  }

  try {
    // 1. Fetch real price from Supabase - DO NOT trust frontend price
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    // 2. Determine price based on plan type
    let finalPriceInr = 0
    if (planType === 'single') {
      finalPriceInr = product.singlePriceInr
    } else if (planType === 'subscription') {
      finalPriceInr = product.subPriceInr
    } else {
      return res.status(400).json({ success: false, message: 'Invalid plan type' })
    }

    // Razorpay expects amount in paisa (multiply by 100)
    const amountInPaisa = Math.round(finalPriceInr * 100)

    // 3. Create Order in Razorpay
    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    }

    const rzpOrder = await razorpay.orders.create(options)

    // 4. Create Pending Order in Supabase
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        amount: finalPriceInr,
        customerEmail: customerEmail || 'unknown@example.com',
        customerPhone: customerPhone || 'unknown',
        status: 'PENDING',
        razorpayOrderId: rzpOrder.id
      }
    })

    // Return to frontend to initialize checkout
    return res.status(200).json({
      success: true,
      orderId: rzpOrder.id,
      amount: amountInPaisa,
      currency: rzpOrder.currency,
      dbOrderId: order.id
    })

  } catch (error) {
    console.error('Razorpay Create Error:', error)
    return res.status(500).json({ success: false, message: 'Payment gateway error' })
  }
}

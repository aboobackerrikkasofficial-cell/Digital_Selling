import { PrismaClient } from '@prisma/client';
import crypto from 'crypto'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
    return res.status(400).json({ success: false, message: 'Missing payment verification details' })
  }

  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid, update DB
      await prisma.order.update({
        where: { id: dbOrderId },
        data: {
          status: 'COMPLETED',
          razorpayPaymentId: razorpay_payment_id
        }
      });
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error)
    return res.status(500).json({ success: false, message: 'Server error during verification' })
  }
}

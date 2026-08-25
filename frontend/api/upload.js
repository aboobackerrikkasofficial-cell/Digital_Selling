import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Needed to bypass RLS for uploads from backend
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  // Basic security: In a real app, verify the JWT token here first
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { fileName, fileType } = req.body

  if (!fileName || !fileType) {
    return res.status(400).json({ success: false, message: 'Missing file metadata' })
  }

  try {
    const filePath = `private/${Date.now()}_${fileName}`

    // Create a signed URL valid for 60 seconds to let the frontend upload directly
    const { data, error } = await supabase.storage
      .from('products')
      .createSignedUploadUrl(filePath)

    if (error) {
      throw error
    }

    return res.status(200).json({
      success: true,
      uploadUrl: data.signedUrl,
      path: filePath,
      token: data.token
    })

  } catch (error) {
    console.error('Storage error:', error)
    return res.status(500).json({ success: false, message: 'Failed to generate upload URL' })
  }
}

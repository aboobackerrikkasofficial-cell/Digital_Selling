import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Configure Supabase Client (if keys are available)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        where: { active: true },
        orderBy: { created_at: 'desc' }
      });
      return res.status(200).json({ success: true, products });
    } catch (error) {
      console.error('Fetch products error:', error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (req.method === 'POST') {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024 // 100MB limit for video/pdfs
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(400).json({ success: false, message: 'Error parsing form data' });
      }

      try {
        const title = fields.title?.[0] || 'Untitled';
        const short_description = fields.short_description?.[0] || '';
        const category = fields.category?.[0] || 'general';
        const badge = fields.badge?.[0] || '';
        const thumbnail = fields.thumbnail?.[0] || '';
        const price = parseFloat(fields.price?.[0]) || 0;
        
        // Use title as slug (simplified)
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

        let storage_key = 'local/mock/' + Date.now();
        let filename = 'mock_file.pdf';
        let file_type = 'application/pdf';
        let file_size = 0;

        const productFile = files.product_file?.[0];

        // 1. Upload to Supabase Storage if configured
        if (productFile) {
          filename = productFile.originalFilename;
          file_type = productFile.mimetype;
          file_size = productFile.size;

          if (supabase) {
            const fileData = fs.readFileSync(productFile.filepath);
            const uploadPath = `products/${slug}/${filename}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('products')
              .upload(uploadPath, fileData, {
                contentType: file_type,
                upsert: true
              });

            if (uploadError) {
              console.error('Supabase upload error:', uploadError);
              throw new Error('Failed to upload file to Supabase Storage.');
            }
            storage_key = uploadPath;
          } else {
            console.warn('Supabase keys missing. File not uploaded to cloud storage.');
          }
        }

        // 2. Save Product to Database
        const newProduct = await prisma.product.create({
          data: {
            title,
            slug,
            short_description,
            description: short_description, // fallback
            category,
            product_type: 'digital',
            price,
            thumbnail,
            active: true,
            files: {
              create: {
                filename,
                storage_key,
                file_type,
                file_size
              }
            }
          }
        });

        return res.status(200).json({ success: true, product: newProduct });
      } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ success: false, message: error.message || 'Error saving product' });
      }
    });
    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

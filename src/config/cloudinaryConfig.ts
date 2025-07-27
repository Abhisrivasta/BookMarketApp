import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import * as dotenv from 'dotenv';
import { Request } from 'express';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_API_SECRET!,
});

export const uploadToCloudinary = async (req: Request): Promise<any> => {
  if (!req.file) {
    throw new Error('No file found in request');
  }

  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'books',
        public_id: originalName.split('.')[0],
        resource_type: 'image',
        timeout: 60000, 
        transformation: [
          { quality: "auto:eco" },     
          { fetch_format: "auto" },    
        ],
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("✅ Uploaded to Cloudinary:", result?.secure_url);
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export { cloudinary };

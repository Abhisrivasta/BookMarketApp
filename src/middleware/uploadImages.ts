import { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary } from '../config/cloudinaryConfig';


export const uploadImageMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {   
      return next();
    }

    const result = await uploadToCloudinary(req);
    res.locals.cloudinaryImageUrl = result.secure_url || result.url;
    res.locals.cloudinaryPublicId = result.public_id;
    next();
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Image upload failed", error });
  }
};

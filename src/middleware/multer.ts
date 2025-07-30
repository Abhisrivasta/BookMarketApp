import path from 'path';
import multer from 'multer';

const storage = multer.memoryStorage();

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  console.log(file);

  if (
    file.mimetype.startsWith('image/') ||
    (file.mimetype === 'application/octet-stream' && allowedExtensions.includes(ext))||file.mimetype.startsWith('photo/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

export { upload };

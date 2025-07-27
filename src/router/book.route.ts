import express from "express"
import { verifyToken } from "../middleware/verifyToken";
import {  handleCreateBook, handleDeleteMyBook, handleGetAllBooks, handleGetBookById, hanldeGetMyBooks, updateBook } from "../controller/book.controller";
import { upload } from "../middleware/multer";
import { uploadImageMiddleware } from "../middleware/uploadImages";


const router = express.Router();

router.post("/book",verifyToken,upload.single('image'),uploadImageMiddleware,handleCreateBook)
router.get("/books/:id", handleGetBookById)
router.get("/books",handleGetAllBooks)
router.get("/myBooks/:id",verifyToken,hanldeGetMyBooks)

router.put("/books/:id", verifyToken, updateBook);
router.delete("/books/:id",verifyToken,handleDeleteMyBook)

export default router;
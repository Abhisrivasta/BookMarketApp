import express from "express"
import { verifyToken } from "../middleware/verifyToken";
import {  getNearbyBooks, handleCreateBook, handleDeleteMyBook, handleGetAllBooks, handleGetBookById, hanldeGetMyBooks, updateBook } from "../controller/book.controller";
import { upload } from "../middleware/multer";
import { uploadImageMiddleware } from "../middleware/uploadImages";


const router = express.Router();

router.post("/book", verifyToken, upload.single('image'), uploadImageMiddleware, handleCreateBook)

router.get("/nearby", getNearbyBooks)

router.get("/books", handleGetAllBooks)
router.get("/books/:id", handleGetBookById)

router.get("/myBooks", verifyToken, hanldeGetMyBooks)

router.put("/books/:id", verifyToken, upload.single("image"), uploadImageMiddleware, updateBook)
router.delete("/books/:id", verifyToken, handleDeleteMyBook)


export default router;
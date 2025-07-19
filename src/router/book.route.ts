import express from "express"
import { verifyToken } from "../middleware/verifyToken";
import {  handleCreateBook, handleDeleteMyBook, handleGetAllBooks, handleGetBookById, hanldeGetMyBooks, updateBook } from "../controller/book.controller";


const router = express.Router();

router.post("/book",verifyToken,handleCreateBook)
router.get("/books/:id", verifyToken, handleGetBookById)
router.get("/books",handleGetAllBooks)
router.get("/myBooks/:id",verifyToken,hanldeGetMyBooks)

router.put("/books/:id", verifyToken, updateBook);
router.delete("/books/:id",verifyToken,handleDeleteMyBook)

export default router;
import { Request, Response } from "express";
import Book from "../models/book.model";
import { createBookSchemaValidator, getBookSchemaValidator } from "../validators/bookValidator";
import { AuthRequest } from "../middleware/verifyToken";
import { v2 as cloudinary } from "cloudinary";
import { getHumanReadableLocation } from "../geocode";

export const handleCreateBook = async (req: AuthRequest, res: Response) => {
  if (typeof req.body.location === "string") {
    try {
      req.body.location = JSON.parse(req.body.location);
      console.log(req.body.location)
    } catch (err) {
      return res.status(400).json({ message: "Invalid location format" });
    }
  }

  const result = createBookSchemaValidator.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const imageUrl = res.locals.cloudinaryImageUrl as string;
  const cloudinaryPublicId = res.locals.cloudinaryPublicId as string;

  if (!imageUrl || !cloudinaryPublicId) {
    return res.status(400).json({ message: "Image URL missing" });
  }

  const { title, author, description, examType, price, location } = result.data;
  const sellerId = (req.user as any).id;

  try {
    const formattedAddress = await getHumanReadableLocation(location.latitude, location.longitude);

    const book = await Book.create({
      title,
      author,
      description,
      examType,
      price,
      imageUrl,
      cloudinaryPublicId,
      location: {
        ...location,
        formattedAddress,
      },
      seller: sellerId,
    });

    return res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};


//get books by id 
export const handleGetBookById = async (req: AuthRequest, res: Response) => {
  const result = getBookSchemaValidator.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid book ID",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { id } = result.data;


  try {
const book = await Book.findById(id).populate("seller", "name email phone");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    let isOwner = false;
    if (req.user && book.seller && book.seller._id.toString() === req.user.id) {
      isOwner = true;
    }

    return res.status(200).json({ book, isOwner });
  } catch (error) {
    console.error("Get book by ID error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//handle get all books
export const handleGetAllBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const total = await Book.countDocuments();
    const books = await Book.find()
      .lean()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("seller",  "name email phone");

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ total, totalPages, page, limit, books });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


//handle get books of user 
export const hanldeGetMyBooks = async (req: AuthRequest, res: Response) => {
  const sellerId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const total = await Book.countDocuments({ seller: sellerId });

    const books = await Book.find({ seller: sellerId })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("seller",  "name email phone");

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ books, total, totalPages, page, limit });
  } catch (error) {
    res.status(500).json({ message: "Error in server", error });
  }
};


//update book
export const updateBook = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Book ID is required" });

  const userId = req.user?.id;
  const { title, author, description, examType, price, imageUrl, location } = req.body;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.seller.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this book" });
    }

    book.title = title;
    book.author = author;
    book.description = description;
    book.examType = examType;
    book.price = price;
    book.imageUrl = imageUrl;
    book.location = location;

    const updatedBook = await book.save();

    return res.status(200).json({ message: "Book updated successfully", book: updatedBook });
  } catch (error) {
    console.error("Update book error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//Delete books
export const handleDeleteMyBook = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) return res.status(400).json({ message: "Book ID is required" });

  try {
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.seller.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this book" });
    }

       if (book.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(book.cloudinaryPublicId);
    }

    await book.deleteOne(); 

    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete book error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

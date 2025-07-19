import { Request, Response } from "express";
import Book from "../models/book.model";
import { createBookSchemaValidator, getBookSchemaValidator } from "../validators/bookValidator";
import { AuthRequest } from "../middleware/verifyToken";


//create books
export const handleCreateBook = async (req: AuthRequest, res: Response) => {
  const result = createBookSchemaValidator.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { title, author, description, examType, price, imageUrl, location } = result.data;
  const sellerId = (req.user as any).id;

  try {
    const book = await Book.create({
      title,
      author,
      description,
      examType,
      price,
      imageUrl,
      seller: sellerId,
      location: location
        ? {
          type: "Point",
          coordinates: location.coordinates,
          placeName: location.placeName,
        }
        : undefined,
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
    const book = await Book.findById(id).populate("seller", "email");

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

    const books = await Book.find()
      .lean()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("seller", "email");

    const total = await Book.countDocuments();

    res.status(200).json({ total, page, limit, books });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//handle get books of user 
export const hanldeGetMyBooks = async (req: AuthRequest, res: Response) => {
  const sellerId = req.user?.id;

  try {
    const books = await Book.find({ seller: sellerId }).populate("seller", "email");
    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ message: "Error in server", error });
  }
};


//update book
export const updateBook = async (req: AuthRequest, res: Response) => {
  const {id} = req.params;
  if(!id) return res.status(400).json({message:"BookId is not available"});
  const{title, author, description, examType, price, imageUrl, location} = req.body;

try {
   const book = await Book.findOneAndUpdate({id},{title, author, description, examType, price, imageUrl, location},{new:true})
   if(!book) res.status(400).json({message:"book is not updated"})
   return res.status(201).json({message:"book updated successfully",book})
} catch (error) {
  return res.status(500).json({message:"Internal server error"})
}
};


export const handleDeleteMyBook = async (req: AuthRequest, res: Response) => {
  const{id}= req.params;
  if(!id) return res.status(400).json({message:"Id is not available"});
  try {
    const book = await Book.findOneAndDelete({id});
    return res.status(200).json({message:"Book deleted successfully"});
  } catch (error) {
    return res.status(500).json({message:"Server error"});
  }
};
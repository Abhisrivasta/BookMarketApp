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
      console.log("Parsed location:", req.body.location);
    } catch {
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
    const [longitude, latitude] = location.coordinates;

    const formattedAddress = await getHumanReadableLocation(latitude, longitude);

    const book = await Book.create({
      title,
      author,
      description,
      examType,
      price,
      imageUrl,
      cloudinaryPublicId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude], 
        formattedAddress,
      },
      seller: sellerId,
    });

    return res.status(201).json({
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({ message: "Internal server error" });
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

    const search = req.query.search as string;
    const priceMin = parseFloat(req.query.priceMin as string);
    const priceMax = parseFloat(req.query.priceMax as string);
    const condition = req.query.condition as string;
    const sort = req.query.sort as string;

    let filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }

    if (!isNaN(priceMin) || !isNaN(priceMax)) {
      filter.price = {};
      if (!isNaN(priceMin)) filter.price.$gte = priceMin;
      if (!isNaN(priceMax)) filter.price.$lte = priceMax;
    }

    if (condition) {
      filter.condition = condition;
    }

    let query = Book.find(filter)
      .populate("seller", "name email phone")
      .lean()
      .skip((page - 1) * limit)
      .limit(limit);

    if (sort === "asc") query = query.sort({ price: 1 });
    if (sort === "desc") query = query.sort({ price: -1 });

    const total = await Book.countDocuments(filter);
    const books = await query;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ total, totalPages, page, limit, books });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


//handle get books of user 
export const hanldeGetMyBooks = async (req: AuthRequest, res: Response) => {
  const sellerId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const total = await Book.countDocuments({ seller: sellerId });

    const books = await Book.find({ seller: sellerId })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("seller", "name email phone");

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

  // Parse location if sent as string
  if (typeof req.body.location === "string") {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch {
      return res.status(400).json({ message: "Invalid location format" });
    }
  }

  const { title, author, description, examType, price, condition, location } = req.body;

  const newImageUrl = res.locals.cloudinaryImageUrl as string | undefined;
  const newCloudinaryPublicId = res.locals.cloudinaryPublicId as string | undefined;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.seller.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this book" });
    }

    // Update basic fields
    book.title = title || book.title;
    book.author = author || book.author;
    book.description = description || book.description;
    book.examType = examType || book.examType;
    book.price = price || book.price;
    book.condition = condition || book.condition;

    // Handle image update
    if (!book.imageUrl) {
      book.imageUrl = "https://peoplesblog.co.in/sri-vedanta-swarajya-sangam/assets/img/books/default.jpeg";
    }

    if (newImageUrl) {
      if (book.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(book.cloudinaryPublicId);
      }
      book.imageUrl = newImageUrl;
      book.cloudinaryPublicId = newCloudinaryPublicId;
    }

    // Handle location update if new latitude & longitude are provided
    if (location?.latitude && location?.longitude) {
      const formattedAddress = await getHumanReadableLocation(location.latitude, location.longitude);
      book.location = {
        type: "Point",
        coordinates: [Number(location.longitude), Number(location.latitude)], // GeoJSON order
        formattedAddress,
      };
    }

    const updatedBook = await book.save();

    return res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook
    });

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


//get nearby books
export const getNearbyBooks = async (req: Request, res: Response) => {
  try {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude are required" });
    }

    const maxDistance = distance ? Number(distance) * 1000 : 10000;

    const books = await Book.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: maxDistance,
        },
      },
    }).populate("seller", "name phone");

    res.status(200).json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

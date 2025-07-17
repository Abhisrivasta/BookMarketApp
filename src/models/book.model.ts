import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  description?: string;
  examType?: string;
  price: number;
  condition?: "new" | "used";
  imageUrl: string;
  seller: mongoose.Types.ObjectId;
  location?: {
    type: "Point";
    coordinates: [number, number]; 
    placeName: string;
  };
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    examType: { type: String },
    price: { type: Number, required: true },
    condition: {
      type: String,
      enum: ["new", "used"],
      default: "used",
    },
    imageUrl: { type: String, required: true },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        index: "2dsphere",
      },
      placeName: String,
    },
  },
  { timestamps: true }
);

const Book = mongoose.model<IBook>("Book", bookSchema);
export default Book;

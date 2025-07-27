import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  description?: string;
  examType?: string;
  price: number;
  condition?: "new" | "used";
  imageUrl: string;
  cloudinaryPublicId?: string;
  seller: mongoose.Types.ObjectId;
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string; // ✅ Add to TypeScript type too
  };
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    examType: { type: String },
    price: { type: Number, required: true },
    condition: { type: String, enum: ["new", "used"], default: "used" },

    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },

    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      formattedAddress: { type: String }, 
    },
  },
  { timestamps: true }
);

const Book = mongoose.model<IBook>("Book", bookSchema);
export default Book;

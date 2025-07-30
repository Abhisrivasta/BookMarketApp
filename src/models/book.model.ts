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
    type: "Point";
    coordinates: [number, number]; 
    formattedAddress?: string;
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
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      formattedAddress: { type: String },
    },
  },
  { timestamps: true }
);

// Create 2dsphere index for $near
bookSchema.index({ location: "2dsphere" });

const Book = mongoose.model<IBook>("Book", bookSchema);
export default Book;

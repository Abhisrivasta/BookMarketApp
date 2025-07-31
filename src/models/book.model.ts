import mongoose, { Document, Schema, Model } from "mongoose";

interface ILocation {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  coordinates?: [number, number]; 
}

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
  location: ILocation;
}

// Schema Definition
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
      coordinates: {
        type: [Number], 
        index: "2dsphere",
      },
    },
  },
  { timestamps: true }
);

bookSchema.pre<IBook>("save", function (next) {
  if (this.location && this.location.longitude && this.location.latitude) {
    this.location.coordinates = [
      this.location.longitude,
      this.location.latitude,
    ];
  }
  next();
});

// Model
const Book: Model<IBook> = mongoose.model<IBook>("Book", bookSchema);

export default Book;

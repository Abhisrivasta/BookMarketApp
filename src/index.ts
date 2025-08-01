import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from "./router/user.route";
import cookieParser from "cookie-parser";
import bookRoutes from "./router/book.route"
import cors from "cors"


dotenv.config();

const app = express();
app.use(cors({
origin: process.env.CLIENT_URL,
  credentials: true
}));


app.use(express.json());
app.use(cookieParser()); 
app.use("/api/user", userRouter);
app.use("/api/books", bookRoutes);
app.use(express.urlencoded({ extended: true })); 



app.get('/', (req, res) => {
  res.send('Hello, World!');
});

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

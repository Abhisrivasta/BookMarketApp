import { Request, Response } from "express";
import User from "../models/User.model";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { registerValidator, loginValidator, forgetPasswordValidator } from "../validators/userValidator";
import nodemailer from "nodemailer"
import { AuthRequest } from "../middleware/verifyToken";
import Contact from "../models/Contact.model";
import { v2 as cloudinary } from "cloudinary";


//register
export const registerUser = async (req: Request, res: Response) => {
  const result = registerValidator.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { name, email, phone, password } = result.data;
  const imageUrl = res.locals.cloudinaryImageUrl as string;
  const cloudinaryPublicId = res.locals.cloudinaryPublicId as string;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      imageUrl,
      cloudinaryPublicId,
      password: hashedPassword,
    });

    return res.status(200).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        imageUrl: newUser.imageUrl
      },
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};




//login
export const handleLoginUser = async (req: Request, res: Response) => {
  const result = loginValidator.safeParse(req.body);


  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_SECRET as string,
      { expiresIn: "7d" }
    )

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  res.cookie("accessToken", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 2 * 24 * 60 * 60 * 1000, 
});



    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

//getprofile
export const getUserProfile = async (req: Request, res: Response) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        imageUrl: user.imageUrl
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

//update UserProfile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    return res.status(400).json({ message: "User ID is missing" });
  }

  if (id !== userId) {
    return res.status(403).json({ message: "Unauthorized: Cannot update another user's profile" });
  }

  const { name, email, phone } = req.body;

  const imageUrl = res.locals.cloudinaryImageUrl as string | undefined;
  const cloudinaryPublicId = res.locals.cloudinaryPublicId as string | undefined;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    if (imageUrl && cloudinaryPublicId) {
      if (user.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(user.cloudinaryPublicId);
      }
      user.imageUrl = imageUrl;
      user.cloudinaryPublicId = cloudinaryPublicId;
    }

    const updatedUserProfile = await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUserProfile._id,
        name: updatedUserProfile.name,
        email: updatedUserProfile.email,
        phone: updatedUserProfile.phone,
        imageUrl: updatedUserProfile.imageUrl
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};



//logout
export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};


// Refresh token
export const refreshAccessToken = (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET as string) as { userId: string };

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
  maxAge: 2 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};



// forgetPassword
export const forgetPassword = async (req: Request, res: Response) => {
  const result = forgetPasswordValidator.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email } = result.data;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User does not exist" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.RESET_SECRET as string,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:5173/redirect-reset?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Book Store App" <no-reply@bookstore.com>',
      to: user.email,
      subject: "Reset Password",
      html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.status(200).json({ message: 'Password reset link sent' });

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// getreset-password/:token
export const getResetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET!);
    res.status(200).json({ valid: true, message: "Valid token", decoded });
  } catch (err) {
    res.status(400).json({ valid: false, message: "Invalid or expired token" });
  }
};

//reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET!) as { userId: string };
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log("Password updated for:", user.email);

    res.status(200).json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Reset error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};


export const contactUs = async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const contactMessage = await Contact.create({ name, email, message });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Book Store Contact" <${email}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Message from ${name}`,
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    return res.status(201).json({
      message: "Message sent successfully",
      contact: contactMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

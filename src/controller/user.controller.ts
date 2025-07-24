import { Request, Response } from "express";
import User from "../models/User.model";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { registerValidator, loginValidator, forgetPasswordValidator } from "../validators/userValidator";
import nodemailer from "nodemailer"

//register
export const registerUser = async (req: Request, res: Response) => {
    const result = registerValidator.safeParse(req.body);


    if (!result.success) {
        return res.status(400).json({
            message: 'validation failed',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { name, email, password } = result.data;
    try {
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (!newUser) {
            res.status(404).json({ message: "newUser not created " })
        }

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        )
        const refreshToken = jwt.sign(
            { userId: newUser._id },
            process.env.REFRESH_SECRET as string,
            { expiresIn: "7d" }
        )
        if (!token || !refreshToken) {
           return res.status(403).json({ message: "Access token and refresh token are not created" })
        }

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "User Registered successfully successful",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error })
    }
}



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
  maxAge: 15 * 60 * 1000, 
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
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


//logout
export const logoutUser = (req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
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

        res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, 
});

        return res.status(200).json({ token: accessToken });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};



// POST /api/user/forgetPassword
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

// ✅ GET /api/user/reset-password/:token
export const getResetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET!);
    res.status(200).json({ valid: true, message: "Valid token", decoded });
  } catch (err) {
    res.status(400).json({ valid: false, message: "Invalid or expired token" });
  }
};

// ✅ POST /api/user/reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET!) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

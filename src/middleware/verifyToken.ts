import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  const accessToken = bearerToken || req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as jwt.JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

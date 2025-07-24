import express from "express";
import {
  registerUser,
  handleLoginUser,
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  resetPassword,
  getResetPassword,
  getUserProfile
} from "../controller/user.controller";
import { verifyToken } from "../middleware/verifyToken";


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', handleLoginUser);
router.post('/logout', logoutUser);
router.post('/refreshToken', refreshAccessToken);

router.get("/profile", verifyToken,getUserProfile);


// Password reset routes
router.post('/password/forgot', forgetPassword);
router.get('/password/reset/:token', getResetPassword);
router.post('/password/reset/:token', resetPassword);
  

export default router;

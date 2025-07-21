import express from "express";
import {
  registerUser,
  handleLoginUser,
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  resetPassword,
  getResetPassword
} from "../controller/user.controller";

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', handleLoginUser);
router.post('/logout', logoutUser);
router.post('/refreshToken', refreshAccessToken);

// Password reset routes
router.post('/forgetPassword', forgetPassword);
router.get('/reset-password/:token', getResetPassword);      
router.post('/reset-password/:token', resetPassword);        

export default router;

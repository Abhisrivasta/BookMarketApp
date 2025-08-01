import express from "express";
import {
  registerUser,
  
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  resetPassword,
  getResetPassword,
  getUserProfile,
  updateUserProfile,
  handleLoginUser,
  
} from "../controller/user.controller";
import { verifyToken } from "../middleware/verifyToken";
import { upload } from "../middleware/multer";
import { uploadImageMiddleware } from "../middleware/uploadImages";
import { contactUs } from "../controller/user.controller";


const router = express.Router();

router.post('/register',upload.single('photo'),uploadImageMiddleware, registerUser);
router.post('/login',handleLoginUser);
router.post('/logout', logoutUser);
router.post('/refreshToken', refreshAccessToken);


router.get("/profile", verifyToken,getUserProfile);
router.put("/profile/:id",verifyToken ,upload.single('photo'),uploadImageMiddleware, updateUserProfile);


router.post("/contact", contactUs);




// Password reset routes
router.post('/password/forgot', forgetPassword);
router.get('/password/reset/:token', getResetPassword);
router.post('/password/reset/:token', resetPassword);
    

export default router;

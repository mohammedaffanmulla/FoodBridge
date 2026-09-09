import express from "express";
import { register, login, requestOTP, verifyOTP, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp/request", requestOTP);
router.post("/otp/verify", verifyOTP);
router.get("/me", protect, getMe);

export default router;

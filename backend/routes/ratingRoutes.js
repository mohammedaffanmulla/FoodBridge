import express from "express";
import { createRating, getRatingsForUser } from "../controllers/ratingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/", protect, createRating);
router.get("/:userId", getRatingsForUser);

export default router;

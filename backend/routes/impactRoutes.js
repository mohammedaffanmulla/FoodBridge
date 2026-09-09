import express from "express";
import { getLeaderboard, getMyImpact } from "../controllers/impactController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/leaderboard", getLeaderboard);
router.get("/me", protect, getMyImpact);

export default router;

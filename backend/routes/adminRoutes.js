import express from "express";
import {
  getPendingNGOs, verifyNGO, getPlatformStats, getFraudFlags, setUserActive,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/ngos/pending", getPendingNGOs);
router.patch("/ngos/:id/verify", verifyNGO);
router.get("/stats", getPlatformStats);
router.get("/fraud-flags", getFraudFlags);
router.patch("/users/:id/active", setUserActive);

export default router;

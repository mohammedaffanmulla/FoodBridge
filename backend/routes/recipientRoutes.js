import express from "express";
import { createNeedRequest, getMyRequests, getOpenNeeds } from "../controllers/recipientController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/requests", protect, authorize("recipient"), createNeedRequest);
router.get("/requests/mine", protect, authorize("recipient"), getMyRequests);
router.get("/requests/open", protect, authorize("ngo", "volunteer", "admin"), getOpenNeeds);

export default router;

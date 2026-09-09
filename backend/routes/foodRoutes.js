import express from "express";
import {
  createListing, getNearbyListings, getListing, acceptListing,
  updateTracking, markPickedUp, markDelivered, getMyListings,
} from "../controllers/foodController.js";
import { protect, authorize, requireVerifiedNGO } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, authorize("donor"), upload.array("photos", 5), createListing);
router.get("/nearby", protect, getNearbyListings);
router.get("/mine", protect, authorize("donor"), getMyListings);
router.get("/:id", protect, getListing);

router.post("/:id/accept", protect, authorize("ngo", "volunteer"), requireVerifiedNGO, acceptListing);
router.patch("/:id/picked-up", protect, authorize("ngo", "volunteer"), markPickedUp);
router.patch("/:id/delivered", protect, authorize("ngo", "volunteer"), markDelivered);
router.patch("/requests/:requestId/track", protect, authorize("ngo", "volunteer"), updateTracking);

export default router;

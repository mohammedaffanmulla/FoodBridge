import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import FoodListing from "../models/FoodListing.js";
import Request from "../models/Request.js";
import { notify } from "../utils/notify.js";

// @desc  List NGOs pending verification
// @route GET /api/admin/ngos/pending
export const getPendingNGOs = asyncHandler(async (req, res) => {
  const ngos = await User.find({ role: "ngo", "verification.status": "pending" });
  res.json({ ngos });
});

// @desc  Approve/reject an NGO
// @route PATCH /api/admin/ngos/:id/verify
export const verifyNGO = asyncHandler(async (req, res) => {
  const { decision, notes } = req.body; // decision: "verified" | "rejected"
  const ngo = await User.findById(req.params.id);
  if (!ngo || ngo.role !== "ngo") {
    res.status(404);
    throw new Error("NGO not found");
  }

  ngo.verification.status = decision;
  ngo.verification.reviewedBy = req.user._id;
  ngo.verification.reviewedAt = new Date();
  ngo.verification.notes = notes;
  await ngo.save();

  await notify({
    userId: ngo._id,
    type: "verification_update",
    title: `Verification ${decision}`,
    body:
      decision === "verified"
        ? "Your NGO has been verified. You can now accept food donations."
        : `Your NGO verification was rejected. ${notes || ""}`,
    channel: ["push", "email"],
  });

  res.json({ ngo });
});

// @desc  Platform-wide stats for admin dashboard
// @route GET /api/admin/stats
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalDonors, totalNGOs, totalListings, deliveredListings, agg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "donor" }),
    User.countDocuments({ role: "ngo", "verification.status": "verified" }),
    FoodListing.countDocuments(),
    FoodListing.countDocuments({ status: "delivered" }),
    FoodListing.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, meals: { $sum: "$estimatedMeals" }, co2: { $sum: "$estimatedCo2SavedKg" } } },
    ]),
  ]);

  res.json({
    totalUsers,
    totalDonors,
    totalVerifiedNGOs: totalNGOs,
    totalListings,
    deliveredListings,
    mealsSaved: agg[0]?.meals || 0,
    co2SavedKg: agg[0]?.co2 || 0,
  });
});

// @desc  Listings flagged for potential fraud (e.g. repeat cancellations, mismatched quantity)
// @route GET /api/admin/fraud-flags
export const getFraudFlags = asyncHandler(async (req, res) => {
  const flagged = await FoodListing.find({ "fraudFlags.0": { $exists: true } }).populate("donor", "name email phone");
  res.json({ flagged });
});

// @desc  Suspend/reactivate a user (fraud action)
// @route PATCH /api/admin/users/:id/active
export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  res.json({ user });
});

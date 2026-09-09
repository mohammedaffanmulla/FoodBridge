import asyncHandler from "express-async-handler";
import Rating from "../models/Rating.js";
import User from "../models/User.js";

// @desc  Rate a donor or NGO after a completed delivery
// @route POST /api/ratings
export const createRating = asyncHandler(async (req, res) => {
  const { toUser, listing, stars, comment } = req.body;

  const rating = await Rating.create({ fromUser: req.user._id, toUser, listing, stars, comment });

  const agg = await Rating.aggregate([
    { $match: { toUser: rating.toUser } },
    { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } },
  ]);

  await User.findByIdAndUpdate(toUser, {
    ratingAvg: Math.round(agg[0].avg * 10) / 10,
    ratingCount: agg[0].count,
  });

  res.status(201).json({ rating });
});

// @desc  Get ratings for a user
// @route GET /api/ratings/:userId
export const getRatingsForUser = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ toUser: req.params.userId })
    .populate("fromUser", "name role")
    .sort("-createdAt");
  res.json({ ratings });
});

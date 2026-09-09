import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const BADGE_THRESHOLDS = [
  { points: 50, badge: "Bronze Bridge Builder" },
  { points: 200, badge: "Silver Bridge Builder" },
  { points: 500, badge: "Gold Bridge Builder" },
  { points: 1000, badge: "FoodBridge Champion" },
];

export function badgesForPoints(points) {
  return BADGE_THRESHOLDS.filter((b) => points >= b.points).map((b) => b.badge);
}

// @desc  Top donors/NGOs leaderboard
// @route GET /api/impact/leaderboard?role=donor
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { role = "donor", limit = 20 } = req.query;
  const users = await User.find({ role })
    .select("name points stats badges donorType")
    .sort("-points")
    .limit(Number(limit));
  res.json({ leaderboard: users });
});

// @desc  Logged-in user's personal impact summary
// @route GET /api/impact/me
export const getMyImpact = asyncHandler(async (req, res) => {
  const user = req.user;
  const earnedBadges = badgesForPoints(user.points);
  if (earnedBadges.length !== user.badges.length) {
    user.badges = earnedBadges;
    await user.save();
  }
  res.json({
    stats: user.stats,
    points: user.points,
    badges: user.badges,
    nextBadge: BADGE_THRESHOLDS.find((b) => b.points > user.points) || null,
  });
});

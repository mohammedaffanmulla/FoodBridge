import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import FoodListing from "../models/FoodListing.js";

const BADGE_THRESHOLDS = [
  { points: 50, badge: "Bronze Bridge Builder" },
  { points: 200, badge: "Silver Bridge Builder" },
  { points: 500, badge: "Gold Bridge Builder" },
  { points: 1000, badge: "FoodBridge Champion" },
];

export function badgesForPoints(points) {
  return BADGE_THRESHOLDS.filter((b) => points >= b.points).map((b) => b.badge);
}

// @desc  Top donors/NGOs leaderboard, each with a few of their recent
// completed listings (title, quantity, food type) so the leaderboard shows
// actual food details, not just points.
// @route GET /api/impact/leaderboard?role=donor
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { role = "donor", limit = 20, listingsPerUser = 3 } = req.query;
  const users = await User.find({ role })
    .select("name points stats badges donorType")
    .sort("-points")
    .limit(Number(limit));

  // Donors are matched by `donor`; NGOs/volunteers by `acceptedBy` — same
  // field name either way from the client's point of view: `recentListings`.
  const matchField = role === "donor" ? "donor" : "acceptedBy";

  const leaderboard = await Promise.all(
    users.map(async (u) => {
      const recentListings = await FoodListing.find({
        [matchField]: u._id,
        status: "delivered",
      })
        .select("title quantity foodState classification.category deliveredAt updatedAt")
        .sort("-updatedAt")
        .limit(Number(listingsPerUser));

      return { ...u.toObject(), recentListings };
    })
  );

  res.json({ leaderboard });
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
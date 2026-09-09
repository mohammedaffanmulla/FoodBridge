import FoodListing from "../models/FoodListing.js";
import { notify } from "../utils/notify.js";

/**
 * Runs every minute. In production, replace this setInterval with
 * node-cron or a BullMQ repeatable job so it survives across multiple
 * server instances without double-firing.
 */
export function startExpiryJob(io) {
  setInterval(async () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000); // 30 min warning

    // 1. Warn donors/NGOs about listings expiring soon and still unclaimed
    const expiringSoon = await FoodListing.find({
      status: { $in: ["available", "accepted"] },
      expiryTime: { $gte: now, $lte: soon },
    });

    for (const listing of expiringSoon) {
      await notify({
        userId: listing.donor,
        type: "expiry_countdown",
        title: "Pickup window closing soon",
        body: `"${listing.title}" expires in under 30 minutes.`,
        channel: ["push"],
        relatedListing: listing._id,
        io,
      });
    }

    // 2. Auto-expire anything past its window and never picked up
    await FoodListing.updateMany(
      { status: { $in: ["available", "accepted"] }, expiryTime: { $lt: now } },
      { $set: { status: "expired" }, $push: { timeline: { status: "expired", at: now } } }
    );
  }, 60 * 1000);
}

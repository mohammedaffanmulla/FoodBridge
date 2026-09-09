import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_listing_nearby", "expiry_countdown", "request_accepted", "pickup_alert", "delivery_confirmed", "verification_update", "system"],
      required: true,
    },
    title: String,
    body: String,
    channel: { type: [String], enum: ["push", "sms", "email"], default: ["push"] },
    read: { type: Boolean, default: false },
    relatedListing: { type: mongoose.Schema.Types.ObjectId, ref: "FoodListing" },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);

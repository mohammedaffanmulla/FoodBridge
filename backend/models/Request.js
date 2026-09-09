import mongoose from "mongoose";

// A recipient (orphanage/shelter/individual) asking for food, OR
// an NGO/volunteer claiming a listing - both flow through here.
const requestSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "FoodListing" }, // optional if it's a standing "need"
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    peopleToFeed: Number,
    urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "fulfilled", "cancelled"],
      default: "pending",
    },

    // Live GPS pickup tracking
    tracking: {
      volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      currentLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
      },
      lastUpdated: Date,
      pickedUpAt: Date,
      deliveredAt: Date,
      proofPhoto: String,
    },

    note: String,
  },
  { timestamps: true }
);

requestSchema.index({ "tracking.currentLocation": "2dsphere" });

export default mongoose.model("Request", requestSchema);

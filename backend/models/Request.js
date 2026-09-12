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
        type: {
          type: String,
          enum: ["Point"],
          // NOTE: no `default` here on purpose. If we default this to "Point"
          // while coordinates stays undefined, Mongoose/Mongo end up storing
          // { type: "Point" } with no coordinates, which breaks 2dsphere
          // geo queries with "Point must be an array or object, instead got
          // type missing". Only set this field when real coordinates exist.
        },
        coordinates: {
          type: [Number],
          validate: {
            validator: (v) => !v || v.length === 2,
            message: "coordinates must be an array of [lng, lat]",
          },
        },
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

// sparse: true so requests without a currentLocation set yet are simply
// excluded from the geo index instead of breaking it.
requestSchema.index({ "tracking.currentLocation": "2dsphere" }, { sparse: true });

export default mongoose.model("Request", requestSchema);
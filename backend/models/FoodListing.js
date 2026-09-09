import mongoose from "mongoose";

const foodListingSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },
    description: String,
    photos: [{ type: String }],

    foodState: { type: String, enum: ["cooked", "raw"], required: true },
    quantity: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ["kg", "plates", "liters", "packets"], required: true },
    },

    preparedAt: Date,
    expiryTime: { type: Date, required: true },

    // Auto-classification result. See utils/classifyFood.js
    classification: {
      category: {
        type: String,
        enum: ["human_edible", "animal_feed", "compost_waste"],
        required: true,
      },
      routedTo: {
        type: String,
        enum: ["ngo_shelter", "farm_animal_shelter", "waste_partner"],
        required: true,
      },
      reason: String,
      confidence: { type: Number, default: 0.8 },
    },

    pickupLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, required: true },
    },

    status: {
      type: String,
      enum: [
        "available",
        "requested",
        "accepted",
        "picked_up",
        "delivered",
        "expired",
        "cancelled",
      ],
      default: "available",
    },

    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // NGO/volunteer/waste partner
    recipientOrg: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // final recipient org, if separate

    // Recurring donation support (e.g. restaurant posts daily leftovers)
    recurrence: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", null], default: null },
      timeOfDay: String, // "21:30"
      daysOfWeek: [{ type: Number }], // 0-6 for weekly
      active: { type: Boolean, default: true },
    },

    timeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],

    estimatedMeals: { type: Number, default: 0 },
    estimatedCo2SavedKg: { type: Number, default: 0 },

    fraudFlags: [{ type: String }],
  },
  { timestamps: true }
);

foodListingSchema.index({ pickupLocation: "2dsphere" });
foodListingSchema.index({ status: 1, expiryTime: 1 });

export default mongoose.model("FoodListing", foodListingSchema);

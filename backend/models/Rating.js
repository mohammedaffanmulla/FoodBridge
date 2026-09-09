import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "FoodListing" },
    stars: { type: Number, min: 1, max: 5, required: true },
    comment: String,
  },
  { timestamps: true }
);

ratingSchema.index({ toUser: 1 });

export default mongoose.model("Rating", ratingSchema);

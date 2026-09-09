import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    address: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "recipient", "admin"],
      required: true,
    },
    // Donor sub-type: restaurant, wedding_hall, individual, event, caterer
    donorType: {
      type: String,
      enum: ["restaurant", "wedding_hall", "individual", "event", "caterer", null],
      default: null,
    },
    // Recipient sub-type: orphanage, old_age_home, shelter, individual_in_need
    recipientType: {
      type: String,
      enum: ["orphanage", "old_age_home", "shelter", "individual_in_need", null],
      default: null,
    },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },

    // OTP login
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },

    // NGO verification (admin-controlled)
    verification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified",
      },
      documentsUrl: [{ type: String }],
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
      notes: String,
    },

    location: locationSchema,
    profilePhoto: String,

    // Gamification
    points: { type: Number, default: 0 },
    badges: [{ type: String }],

    // Impact stats (denormalized for fast dashboard reads)
    stats: {
      totalDonations: { type: Number, default: 0 },
      mealsSaved: { type: Number, default: 0 },
      pickupsCompleted: { type: Number, default: 0 },
    },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    languagePref: { type: String, default: "en" },
    isActive: { type: Boolean, default: true },

    // Optional payment/funds info for NGOs needing transport funds
    donationWalletId: String,
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", userSchema);

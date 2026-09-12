import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { signToken, generateOTP, otpExpiry } from "../utils/tokens.js";
import { notify } from "../utils/notify.js";

// The email field is stored lowercased+trimmed (see User.js schema), but
// login/OTP input was being matched against the raw, un-normalized string —
// so "John@Example.com" would never match a stored "john@example.com" and
// silently fail with "Invalid credentials" even with the right password.
// Phone numbers are left case-alone but still trimmed.
function normalizeIdentifier(value) {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed;
}

// @desc  Register a new user (donor/ngo/volunteer/recipient)
// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, role, donorType, recipientType, password, location } = req.body;
  const email = normalizeIdentifier(req.body.email);
  const phone = normalizeIdentifier(req.body.phone);

  if (!name || !role || (!email && !phone)) {
    res.status(400);
    throw new Error("name, role and at least one of email/phone are required");
  }

  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email or phone already exists");
  }

  const user = await User.create({
    name,
    role,
    donorType: role === "donor" ? donorType : undefined,
    recipientType: role === "recipient" ? recipientType : undefined,
    email,
    phone,
    passwordHash: password, // hashed in pre-save hook
    location,
    verification: { status: role === "ngo" ? "pending" : "unverified" },
  });

  const token = signToken(user._id, user.role);
  res.status(201).json({ token, user: sanitize(user) });
});

// @desc  Password login
// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const emailOrPhone = normalizeIdentifier(req.body.emailOrPhone);
  const { password } = req.body;
  const user = await User.findOne({
    $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
  }).select("+passwordHash");

  if (!user || !user.passwordHash || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = signToken(user._id, user.role);
  res.json({ token, user: sanitize(user) });
});

// @desc  Request an OTP to phone/email (passwordless login)
// @route POST /api/auth/otp/request
export const requestOTP = asyncHandler(async (req, res) => {
  const emailOrPhone = normalizeIdentifier(req.body.emailOrPhone);
  const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
  if (!user) {
    res.status(404);
    throw new Error("No account found for this email/phone");
  }

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpiresAt = otpExpiry();
  await user.save();

  await notify({
    userId: user._id,
    type: "system",
    title: "Your FoodBridge OTP",
    body: `Your login code is ${otp}. It expires in ${process.env.OTP_EXPIRES_MIN || 5} minutes.`,
    channel: user.phone === emailOrPhone ? ["sms"] : ["email"],
    phone: user.phone,
    email: user.email,
  });

  res.json({ message: "OTP sent" });
});

// @desc  Verify OTP and log in
// @route POST /api/auth/otp/verify
export const verifyOTP = asyncHandler(async (req, res) => {
  const emailOrPhone = normalizeIdentifier(req.body.emailOrPhone);
  const { otp } = req.body;
  const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }).select(
    "+otpCode +otpExpiresAt"
  );

  if (!user || user.otpCode !== otp || user.otpExpiresAt < new Date()) {
    res.status(401);
    throw new Error("Invalid or expired OTP");
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = signToken(user._id, user.role);
  res.json({ token, user: sanitize(user) });
});

// @desc  Get current logged-in user
// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitize(req.user) });
});

function sanitize(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.otpCode;
  delete obj.otpExpiresAt;
  return obj;
}

import jwt from "jsonwebtoken";

export const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

export const otpExpiry = () =>
  new Date(Date.now() + (Number(process.env.OTP_EXPIRES_MIN) || 5) * 60 * 1000);

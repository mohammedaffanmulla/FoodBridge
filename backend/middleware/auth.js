import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error("User not found or deactivated");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }
});

// Usage: authorize("ngo", "admin")
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

// Extra guard for actions only a *verified* NGO can take (accepting large donations etc.)
export const requireVerifiedNGO = (req, res, next) => {
  if (req.user.role === "ngo" && req.user.verification.status !== "verified") {
    res.status(403);
    throw new Error("NGO account must be verified by admin before accepting donations");
  }
  next();
};

import dotenv from "dotenv";
import dns from "dns";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

// Force Node.js to use Cloudflare and Google Public DNS for resolution
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();
await connectDB();

const email = process.env.SEED_ADMIN_EMAIL || "admin@foodbridge.local";
const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

const existing = await User.findOne({ email });
if (existing) {
  console.log(`Admin already exists: ${email}`);
} else {
  await User.create({
    name: "FoodBridge Admin",
    role: "admin",
    email,
    passwordHash: password,
    verification: { status: "verified" },
  });
  console.log(`Admin created -> email: ${email}  password: ${password}`);
  console.log("Change this password after first login.");
}

process.exit(0);
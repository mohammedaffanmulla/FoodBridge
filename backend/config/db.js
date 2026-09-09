import mongoose from "mongoose";
import dns from "dns";

export const connectDB = async () => {
  try {
    // Override DNS resolution to Cloudflare and Google Public DNS
    // Fixes ECONNREFUSED issues with MongoDB Atlas SRV records
    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file!");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // Allow up to 15 seconds to connect
      family: 4,                       // Force IPv4 resolution
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};
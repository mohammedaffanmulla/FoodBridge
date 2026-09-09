import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { startExpiryJob } from "./utils/expiryJob.js";

import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import recipientRoutes from "./routes/recipientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import impactRoutes from "./routes/impactRoutes.js";

dotenv.config();
await connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || "*" } });

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(morgan("dev"));

// attach io to every request so controllers can emit real-time events
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room)); // e.g. `user:<id>` or `listing:<id>`
});

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/impact", impactRoutes);

app.use(notFound);
app.use(errorHandler);

startExpiryJob(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`FoodBridge API running on port ${PORT}`));

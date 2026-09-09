import asyncHandler from "express-async-handler";
import Request from "../models/Request.js";
import { notify } from "../utils/notify.js";
import User from "../models/User.js";

// @desc  Recipient (orphanage/shelter/individual) posts a standing food need
// @route POST /api/recipients/requests
export const createNeedRequest = asyncHandler(async (req, res) => {
  const { peopleToFeed, urgency, note } = req.body;

  const request = await Request.create({
    requestedBy: req.user._id,
    peopleToFeed,
    urgency,
    note,
    status: "pending",
  });

  // Notify nearby verified NGOs of an urgent need
  if (urgency === "high") {
    const nearbyNGOs = await User.find({
      role: "ngo",
      "verification.status": "verified",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: req.user.location?.coordinates || [0, 0] },
          $maxDistance: 20000,
        },
      },
    }).limit(15);

    await Promise.all(
      nearbyNGOs.map((ngo) =>
        notify({
          userId: ngo._id,
          type: "system",
          title: "Urgent food request nearby",
          body: `${req.user.name} needs food for ${peopleToFeed} people.`,
          channel: ["push", "sms"],
        })
      )
    );
  }

  res.status(201).json({ request });
});

// @desc  Recipient's own requests
// @route GET /api/recipients/requests/mine
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ requestedBy: req.user._id })
    .populate("listing")
    .sort("-createdAt");
  res.json({ requests });
});

// @desc  All open (pending) needs, for NGOs to browse and match against listings
// @route GET /api/recipients/requests/open
export const getOpenNeeds = asyncHandler(async (req, res) => {
  const requests = await Request.find({ status: "pending" })
    .populate("requestedBy", "name recipientType location")
    .sort("-urgency -createdAt");
  res.json({ requests });
});

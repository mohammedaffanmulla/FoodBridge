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
          io: req.io,
        })
      )
    );
  }

  // Let every open NGO/volunteer dashboard know a new need just appeared,
  // the same way "food:new" works for donor listings.
  req.io.emit("need:new", { requestId: request._id });

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
    .sort("-createdAt");

  // Sorting by urgency string alphabetically puts "low" before "medium"
  // before "high" — the opposite of what a dashboard should show first.
  const weight = { high: 0, medium: 1, low: 2 };
  requests.sort((a, b) => weight[a.urgency] - weight[b.urgency]);

  res.json({ requests });
});

// @desc  NGO/volunteer marks a community need as fulfilled — this is the
// step that was completely missing: without it, a recipient's request just
// sat as "pending" forever with no way for anyone to close the loop, and
// the recipient never found out their need had actually been met.
// @route PATCH /api/recipients/requests/:id/fulfill
export const fulfillRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (request.status !== "pending") {
    res.status(400);
    throw new Error("This request has already been handled");
  }

  request.status = "fulfilled";
  request.tracking = { ...request.tracking, volunteer: req.user._id, deliveredAt: new Date() };
  await request.save();

  await notify({
    userId: request.requestedBy,
    type: "delivery_confirmed",
    title: "Your request was fulfilled",
    body: `${req.user.name} has arranged food for the ${request.peopleToFeed} people you requested for.`,
    channel: ["push", "sms"],
    io: req.io,
  });

  req.io.emit("need:updated", { requestId: request._id, status: "fulfilled" });

  res.json({ request });
});

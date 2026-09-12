import asyncHandler from "express-async-handler";
import cloudinary from "cloudinary";
import FoodListing from "../models/FoodListing.js";
import User from "../models/User.js";
import Request from "../models/Request.js";
import { classifyFood, estimateImpact } from "../utils/classifyFood.js";
import { notify } from "../utils/notify.js";

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function uploadPhotos(files = []) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // Dev fallback: no cloud storage configured, skip upload.
    return [];
  }
  const uploads = files.map(
    (f) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "foodbridge/listings" },
          (err, result) => (err ? reject(err) : resolve(result.secure_url))
        );
        stream.end(f.buffer);
      })
  );
  return Promise.all(uploads);
}

// @desc  Donor creates a food listing (auto-classified on save)
// @route POST /api/food
export const createListing = asyncHandler(async (req, res) => {
  const {
    title, description, foodState, quantity, preparedAt, expiryTime,
    pickupLocation, recurrence,
  } = req.body;

  if (!title || !foodState || !quantity || !expiryTime || !pickupLocation) {
    res.status(400);
    throw new Error("title, foodState, quantity, expiryTime and pickupLocation are required");
  }

  const parsedQuantity = typeof quantity === "string" ? JSON.parse(quantity) : quantity;
  const parsedLocation = typeof pickupLocation === "string" ? JSON.parse(pickupLocation) : pickupLocation;
  const parsedRecurrence = typeof recurrence === "string" ? JSON.parse(recurrence) : recurrence;

  const classification = classifyFood({ title, description, foodState, preparedAt, expiryTime });
  const impact = estimateImpact(parsedQuantity);
  const photos = await uploadPhotos(req.files);

  const listing = await FoodListing.create({
    donor: req.user._id,
    title,
    description,
    photos,
    foodState,
    quantity: parsedQuantity,
    preparedAt,
    expiryTime,
    classification,
    pickupLocation: {
      type: "Point",
      coordinates: parsedLocation.coordinates,
      address: parsedLocation.address,
    },
    recurrence: parsedRecurrence,
    estimatedMeals: impact.estimatedMeals,
    estimatedCo2SavedKg: impact.estimatedCo2SavedKg,
    timeline: [{ status: "available", by: req.user._id, note: "Listing created" }],
  });

  // Notify nearby verified NGOs/volunteers/waste-partners matching the routed category
  const targetRole = classification.routedTo === "waste_partner" ? "ngo" : "ngo"; // simplified: all routed via NGO/volunteer network in MVP
  const nearby = await User.find({
    role: { $in: ["ngo", "volunteer"] },
    "verification.status": "verified",
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: parsedLocation.coordinates },
        $maxDistance: 15000, // 15km
      },
    },
  }).limit(25);

  await Promise.all(
    nearby.map((u) =>
      notify({
        userId: u._id,
        type: "new_listing_nearby",
        title: "New food listing nearby",
        body: `${title} (${parsedQuantity.value} ${parsedQuantity.unit}) available for pickup — routed as ${classification.routedTo.replace("_", " ")}.`,
        channel: ["push"],
        relatedListing: listing._id,
        io: req.io,
      })
    )
  );

  // Broadcast to every connected client so any open NGO/volunteer dashboard
  // refreshes its nearby list immediately, instead of only on next page load.
  req.io.emit("food:new", { listingId: listing._id });

  res.status(201).json({ listing });
});

// @desc  Browse nearby available listings (for map + NGO dashboard)
// @route GET /api/food/nearby?lng=..&lat=..&radiusKm=10&category=
export const getNearbyListings = asyncHandler(async (req, res) => {
  const { lng, lat, radiusKm = 10, category, status = "available" } = req.query;
  if (!lng || !lat) {
    res.status(400);
    throw new Error("lng and lat query params are required");
  }

  const filter = {
    status,
    pickupLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000,
      },
    },
  };
  if (category) filter["classification.category"] = category;

  const listings = await FoodListing.find(filter).populate("donor", "name donorType ratingAvg");
  res.json({ listings });
});

// @desc  Get a single listing
// @route GET /api/food/:id
export const getListing = asyncHandler(async (req, res) => {
  const listing = await FoodListing.findById(req.params.id).populate("donor", "name donorType phone ratingAvg");
  if (!listing) {
    res.status(404);
    throw new Error("Listing not found");
  }
  res.json({ listing });
});

// @desc  NGO/volunteer accepts a listing -> creates a Request + moves listing to 'accepted'
// @route POST /api/food/:id/accept
export const acceptListing = asyncHandler(async (req, res) => {
  const listing = await FoodListing.findById(req.params.id);
  if (!listing || listing.status !== "available") {
    res.status(400);
    throw new Error("Listing is not available for pickup");
  }

  listing.status = "accepted";
  listing.acceptedBy = req.user._id;
  listing.timeline.push({ status: "accepted", by: req.user._id });
  await listing.save();

  // Intentionally NOT setting tracking.currentLocation here. It gets set
  // later via updateTracking() once we actually have real GPS coordinates
  // from the volunteer's device. Setting a placeholder Point with no
  // coordinates is what caused the "Point must be an array or object,
  // instead got type missing" geo-index error.
  const request = await Request.create({
    listing: listing._id,
    requestedBy: req.user._id,
    status: "accepted",
    tracking: { volunteer: req.user._id },
  });

  await notify({
    userId: listing.donor,
    type: "request_accepted",
    title: "Your donation was accepted",
    body: `${req.user.name} is on the way to pick up "${listing.title}".`,
    channel: ["push", "sms"],
    relatedListing: listing._id,
    io: req.io,
  });

  // Tell every connected dashboard this listing is no longer available,
  // so it disappears from other NGOs'/volunteers' lists immediately.
  req.io.emit("food:updated", { listingId: listing._id, status: "accepted" });

  res.json({ listing, request });
});

// @desc  Update live GPS location during pickup
// @route PATCH /api/food/requests/:requestId/track
export const updateTracking = asyncHandler(async (req, res) => {
  const { lng, lat } = req.body;

  if (lng == null || lat == null || isNaN(Number(lng)) || isNaN(Number(lat))) {
    res.status(400);
    throw new Error("Valid lng and lat are required to update tracking location");
  }

  const request = await Request.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  request.tracking.currentLocation = {
    type: "Point",
    coordinates: [Number(lng), Number(lat)],
  };
  request.tracking.lastUpdated = new Date();
  await request.save();

  if (req.io) {
    req.io.to(`listing:${request.listing}`).emit("tracking:update", {
      requestId: request._id,
      coordinates: [Number(lng), Number(lat)],
    });
  }

  res.json({ ok: true });
});

// @desc  Mark picked up
// @route PATCH /api/food/:id/picked-up
export const markPickedUp = asyncHandler(async (req, res) => {
  const listing = await FoodListing.findById(req.params.id);
  listing.status = "picked_up";
  listing.timeline.push({ status: "picked_up", by: req.user._id });
  await listing.save();

  await Request.updateOne({ listing: listing._id }, { "tracking.pickedUpAt": new Date() });
  res.json({ listing });
});

// @desc  Confirm delivery -> updates donor + NGO impact stats, and closes the
// loop with a recipient's open need request if one was selected.
// @route PATCH /api/food/:id/delivered
export const markDelivered = asyncHandler(async (req, res) => {
  const { proofPhoto, peopleFed, recipientRequestId } = req.body;
  const listing = await FoodListing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error("Listing not found");
  }

  listing.status = "delivered";
  listing.timeline.push({ status: "delivered", by: req.user._id });

  // This is the piece that was missing entirely: linking a delivered listing
  // back to the specific recipient (orphanage/shelter/individual) whose
  // request it fulfills, instead of the recipient side never hearing anything.
  if (recipientRequestId) {
    const need = await Request.findById(recipientRequestId);
    if (need && need.status === "pending") {
      listing.recipientOrg = need.requestedBy;
      need.status = "fulfilled";
      need.listing = listing._id;
      await need.save();

      await notify({
        userId: need.requestedBy,
        type: "request_fulfilled",
        title: "Your food request was fulfilled",
        body: `"${listing.title}" has been delivered to cover your request for ${need.peopleToFeed} people.`,
        channel: ["push", "sms"],
        relatedListing: listing._id,
        io: req.io,
      });
    }
  }

  await listing.save();

  await Request.updateOne(
    { listing: listing._id },
    { status: "fulfilled", "tracking.deliveredAt": new Date(), "tracking.proofPhoto": proofPhoto }
  );

  await User.findByIdAndUpdate(listing.donor, {
    $inc: {
      "stats.totalDonations": 1,
      "stats.mealsSaved": peopleFed || listing.estimatedMeals,
      points: 10,
    },
  });
  await User.findByIdAndUpdate(listing.acceptedBy, {
    $inc: { "stats.pickupsCompleted": 1, points: 10 },
  });

  await notify({
    userId: listing.donor,
    type: "delivery_confirmed",
    title: "Delivery confirmed",
    body: `"${listing.title}" was successfully delivered. Thank you for reducing food waste!`,
    channel: ["push", "email"],
    relatedListing: listing._id,
    io: req.io,
  });

  res.json({ listing });
});

// @desc  Donor's own listings
// @route GET /api/food/mine
export const getMyListings = asyncHandler(async (req, res) => {
  const listings = await FoodListing.find({ donor: req.user._id }).sort("-createdAt");
  res.json({ listings });
});

// @desc  NGO/volunteer's own in-progress and recent pickups. This is the
// piece that was missing: getNearbyListings only returns status="available"
// by default, so the moment a listing is accepted it disappeared from that
// query and the NGO lost their "mark picked up" / "confirm delivery" path
// back to it. This endpoint tracks it by who accepted it, not by status.
// @route GET /api/food/my-pickups
export const getMyPickups = asyncHandler(async (req, res) => {
  const listings = await FoodListing.find({
    acceptedBy: req.user._id,
    status: { $in: ["accepted", "picked_up", "delivered"] },
  })
    .populate("donor", "name donorType phone")
    .sort("-updatedAt")
    .limit(50);
  res.json({ listings });
});
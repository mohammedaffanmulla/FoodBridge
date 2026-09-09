# FoodBridge

Connects surplus food donors (restaurants, weddings, events, individuals) with
verified NGOs, shelters and volunteers to redistribute food to people who need
it — with a rule-based classifier that routes anything unsafe for humans to
animal-feed or compost partners instead of the bin.

This repo is a working MVP core, not the entire feature list in one shot —
see **What's stubbed / what's next** below for the honest picture.

## Stack

- **Backend:** Node.js + Express, MongoDB (Mongoose), Socket.io for real-time
  tracking/notifications, JWT + OTP auth.
- **Frontend:** React + Vite, Tailwind CSS, React Router, Google Maps
  (`@react-google-maps/api`), Socket.io client, PWA manifest.

## Project structure

```
foodbridge/
├── backend/
│   ├── config/db.js
│   ├── models/            User, FoodListing, Request, Rating, Notification
│   ├── middleware/         auth, upload (multer), error handler
│   ├── controllers/        auth, food, recipient, admin, rating, impact
│   ├── routes/
│   ├── utils/               classifyFood.js (edibility rules), notify.js
│   │                        (Twilio/Firebase/email hooks), expiryJob.js,
│   │                        tokens.js, seed.js
│   └── server.js
└── frontend/
    └── src/
        ├── pages/           Landing, Login, Register, DonorDashboard,
        │                    NGODashboard, RecipientDashboard, AdminDashboard,
        │                    MapView, ImpactDashboard, Leaderboard
        ├── components/      Navbar, FoodCard, ProtectedRoute
        ├── context/         AuthContext
        └── api/api.js
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI at minimum; everything else
                           # has a dev-mode fallback that logs instead of
                           # sending real SMS/email/uploads
npm install
npm run seed               # creates an admin login (see console output)
npm run dev                 # http://localhost:5000
```

Requires a MongoDB instance — either local (`mongod`) or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # add a Google Maps JS API key to enable /map
npm install
npm run dev                 # http://localhost:5173
```

### 3. Try it end-to-end

1. Register as a **donor**, post a listing (classification result shows
   immediately after posting).
2. Register as an **NGO** — it starts `pending`. Log in as the seeded admin
   at `/admin` and approve it.
3. Log back in as the NGO, accept the listing from `/ngo`, mark picked up,
   then confirm delivery — this updates the donor's impact stats, points,
   and badges.
4. Check `/impact` and `/leaderboard`.

## Core feature → file map

| Feature | Where |
|---|---|
| Auto-classification (human/animal/compost) | `backend/utils/classifyFood.js` |
| Donor listing + photo upload | `backend/controllers/foodController.js`, `frontend/src/pages/DonorDashboard.jsx` |
| NGO accept / GPS tracking / delivery confirm | `foodController.js` (`acceptListing`, `updateTracking`, `markDelivered`), `NGODashboard.jsx` |
| NGO verification (admin) | `adminController.js`, `AdminDashboard.jsx` |
| Notifications (SMS/push/email) | `backend/utils/notify.js` — swap the dev-mode `console.log` branches for real Twilio/Firebase/SMTP calls once you have keys |
| Expiry countdown + auto-expire | `backend/utils/expiryJob.js` |
| Live map | `frontend/src/pages/MapView.jsx` |
| Ratings | `ratingController.js` |
| Gamification (points/badges/leaderboard) | `impactController.js`, `Leaderboard.jsx` |
| Recurring donations | `FoodListing.recurrence` field — see note below |
| Role-based auth (Donor/NGO/Volunteer/Recipient/Admin) | `middleware/auth.js` |

## What's stubbed / what's next

Built as a working MVP core rather than faking every bullet point. Honest
status on the harder items:

- **Recurring donation scheduling** — the data model (`recurrence` field) and
  UI toggle are in place, but there's no scheduler actually re-creating the
  listing daily/weekly yet. Add a `node-cron` job that queries
  `recurrence.isRecurring: true, recurrence.active: true` listings and clones
  them at `timeOfDay`.
- **AI chatbot for WhatsApp/voice posting** — this is a separate service
  (WhatsApp Business API / Twilio Conversations + an LLM to parse free text
  into the `FoodListing` schema, then POST to `/api/food`). The API is
  already shaped to accept that input; the bot itself isn't built here.
- **Blockchain transparency log** — genuinely optional per the brief. If
  needed, the cleanest approach is writing a hash of each `delivered` event
  (donor, quantity, timestamp, recipient) to a low-cost chain (Polygon) or
  even just a public append-only ledger service, rather than running your
  own chain.
- **Multi-language support** — add `react-i18next`, pull strings out of the
  JSX into locale files. `User.languagePref` already exists on the model to
  drive it.
- **Payments for NGO transport funds** — needs a payment gateway (Razorpay
  for India, given the orphanage/old-age-home framing, or Stripe). Add a
  `Donation` model + a `/api/donations` route that creates an order and
  verifies the webhook.
- **Fraud prevention** — currently just a `fraudFlags` array admins can view.
  Real fraud detection (fake listings, no-show pickups, rating manipulation)
  needs a dedicated rules/scoring pass once you have real usage data to
  tune it against.
- **SMS/email/push are dev-mode by default** — they log to console until you
  add Twilio/SMTP/Firebase credentials to `.env`.

## Security notes before going to production

- Rotate `JWT_SECRET` and never commit `.env`.
- Add rate limiting on `/api/auth/otp/*` (OTP brute-force).
- Validate file uploads server-side beyond MIME-type (magic-byte check).
- Add input validation (e.g. `zod` or `joi`) on all controllers — this MVP
  does minimal manual checks.

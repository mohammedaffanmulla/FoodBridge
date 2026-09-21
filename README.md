# FoodBridge

Connects surplus food donors — restaurants, home kitchens, canteens, caterers,
weddings, individuals — with verified NGOs, shelters and volunteers who can
redistribute it, before it goes to waste.

Food that isn't safe for people doesn't just get binned: a classification
engine routes it to animal-feed partners or compost/waste partners instead.

---

## Stack

**Frontend** — React 18, Vite, Tailwind CSS, React Router, Axios,
Socket.io-client, Leaflet + OpenStreetMap (no API key needed), Lucide icons,
date-fns. PWA-ready with dark mode.

**Backend** — Node.js + Express, MongoDB via Mongoose, Socket.io for real-time
updates, JWT + OTP auth, bcrypt, Multer (uploads), Cloudinary (optional image
storage), Twilio (optional SMS).

---

## Setup

### 1. Database

Either run MongoDB locally in Docker (recommended — no IP whitelist hassle):

```bash
docker run -d --name foodbridge-mongo --restart unless-stopped \
  -p 27017:27017 -v foodbridge-mongo-data:/data/db mongo:7
```

…or use a MongoDB Atlas cluster and whitelist your IP under **Network Access**.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Set `MONGO_URI` in `.env`:
- Docker/local: `mongodb://localhost:27017/foodbridge`
- Atlas: your connection string, with `/foodbridge` before the `?`

Everything else (Twilio, SMTP, Cloudinary) is optional — without those keys
the app logs to console instead of sending real SMS/email/uploads.

```bash
npm install
npm run seed     # creates an admin account, prints credentials
npm run dev      # http://localhost:5000
```

Default admin: `admin@foodbridge.local` / `ChangeMe123!`

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL is preset to the backend
npm install
npm run dev             # http://localhost:5173
```

No map API key required — the live map uses OpenStreetMap.

---

## How the flow works

```
Donor posts listing
      ↓
Auto-classified (human-edible / animal feed / compost)
      ↓
Nearby verified NGOs + volunteers notified in real time
      ↓
NGO or volunteer accepts → marks picked up → confirms delivery
      ↓
Donor + NGO impact stats, points and badges update
```

Running alongside this, **recipients** (orphanages, shelters, individuals)
post food needs, which appear on the NGO/volunteer dashboard sorted by
urgency. Marking one fulfilled notifies the recipient and closes that loop.

**Admin** sits outside the flow: NGOs can't accept anything until an admin
verifies them at `/admin`.

---

## Testing it end to end

1. Log in as admin, keep that tab open.
2. Register a **donor** — post a listing, pin the pickup location.
3. Register an **NGO** with a location nearby. Approve it from the admin tab.
4. Log in as the NGO — the listing should appear live under *Nearby donations*.
5. Accept → Mark picked up → Confirm delivery.
6. Check `/leaderboard` and `/impact` — meals, points and food details now appear.

Note: the leaderboard only counts **delivered** listings, so steps 1–5 must
complete before any numbers show up.

---

## Project structure

```
backend/
├── config/db.js
├── models/         User, FoodListing, Request, Rating, Notification
├── middleware/     auth (JWT + role guards), upload, errorHandler
├── controllers/    auth, food, recipient, admin, rating, impact, notification
├── routes/
├── utils/          classifyFood.js, notify.js, expiryJob.js, tokens.js, seed.js
└── server.js

frontend/src/
├── pages/          Landing, Login, Register, DonorDashboard, NGODashboard,
│                   RecipientDashboard, AdminDashboard, MapView,
│                   ImpactDashboard, Leaderboard
├── components/     Navbar, Footer, FoodCard, NotificationBell, ProtectedRoute
├── context/        AuthContext
└── api/            api.js (axios), socket.js (Socket.io client)
```

---

## Feature → file map

| Feature | Where |
|---|---|
| Food classification (human/animal/compost) | `backend/utils/classifyFood.js` |
| Listing creation + photo upload | `foodController.js`, `DonorDashboard.jsx` |
| Accept / GPS tracking / delivery | `foodController.js`, `NGODashboard.jsx` |
| Recipient needs → NGO fulfillment | `recipientController.js`, `NGODashboard.jsx`, `RecipientDashboard.jsx` |
| NGO verification | `adminController.js`, `AdminDashboard.jsx` |
| Real-time notifications | `utils/notify.js`, `api/socket.js`, `NotificationBell.jsx` |
| Expiry countdown + auto-expire | `backend/utils/expiryJob.js` |
| Live map | `MapView.jsx` |
| Points, badges, leaderboard | `impactController.js`, `Leaderboard.jsx` |
| Role-based auth (5 roles) | `middleware/auth.js`, `authController.js` |

---

## Not built yet

Honest status — these are deliberate next steps, not oversights:

- **Recurring donations** — the data model and UI toggle exist, but no
  scheduler re-creates listings yet. Add a `node-cron` job over
  `recurrence.isRecurring: true`.
- **WhatsApp / voice posting bot** — needs a separate service (WhatsApp
  Business API + an LLM parsing free text into the listing schema, POSTing
  to `/api/food`). The API is already shaped for it.
- **Blockchain transparency log** — optional. Simplest version: hash each
  delivered event and write it to a low-cost chain like Polygon.
- **Multi-language** — add `react-i18next`; `User.languagePref` already exists.
- **Payments for NGO transport costs** — needs Razorpay or Stripe plus a
  `Donation` model and webhook verification.
- **Real fraud detection** — currently just an admin-visible `fraudFlags`
  array; meaningful scoring needs real usage data to tune against.

---

## Before production

- Rotate `JWT_SECRET`, never commit `.env`.
- Rate-limit `/api/auth/otp/*` against brute force.
- Validate uploads by magic bytes, not just MIME type.
- Add schema validation (`zod`/`joi`) — controllers do minimal manual checks.
- Replace the landing page's stock Unsplash images with your own photography.
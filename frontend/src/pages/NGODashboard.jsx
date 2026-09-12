import { useEffect, useState } from "react";
import api from "../api/api.js";
import FoodCard from "../components/FoodCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../api/socket.js";

export default function NGODashboard() {
  const { user } = useAuth();
  const [nearby, setNearby] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(true);
  const [justArrived, setJustArrived] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setCoords([pos.coords.longitude, pos.coords.latitude]); setLocating(false); },
      () => {
        // Fall back to the location saved at registration, if any.
        setCoords(user?.location?.coordinates?.[0] ? user.location.coordinates : null);
        setLocating(false);
        if (!user?.location?.coordinates?.[0]) {
          setError("Couldn't get your location and none is saved on your profile — enable location access to see nearby donations.");
        }
      }
    );
  }, []);

  const loadNearby = () => {
    if (!coords) return;
    api.get(`/food/nearby?lng=${coords[0]}&lat=${coords[1]}&radiusKm=15`)
      .then(({ data }) => setNearby(data.listings))
      .catch((e) => setError(e.response?.data?.message || "Could not load nearby listings"));
  };

  // This is the fix: accepted/picked-up listings are tracked by who
  // accepted them, not by "available" status, so they stay visible here
  // through the whole pickup → delivery flow instead of disappearing.
  const loadMyPickups = () => {
    api.get("/food/my-pickups")
      .then(({ data }) => setMyPickups(data.listings))
      .catch((e) => setError(e.response?.data?.message || "Could not load your pickups"));
  };

  // This is the piece that was missing entirely: recipients (orphanages,
  // shelters, individuals) post a need, but nothing ever showed it to NGOs
  // or volunteers, and nothing ever closed the loop back to the recipient.
  const loadOpenNeeds = () => {
    api.get("/recipients/requests/open")
      .then(({ data }) => setOpenNeeds(data.requests))
      .catch(() => {}); // non-critical section; fail quietly
  };

  useEffect(() => { loadNearby(); }, [coords]);
  useEffect(() => { loadMyPickups(); loadOpenNeeds(); }, []);

  // Live updates: when any donor posts, or any NGO/volunteer accepts a
  // listing, refresh this view immediately instead of waiting for a manual
  // reload. This is what makes a new donation actually show up here without
  // the person needing to refresh the page.
  useEffect(() => {
    const socket = getSocket();

    const onNewFood = () => {
      loadNearby();
      setJustArrived(true);
      setTimeout(() => setJustArrived(false), 4000);
    };
    const onUpdatedFood = () => loadNearby();
    const onNewNeed = () => loadOpenNeeds();
    const onUpdatedNeed = () => loadOpenNeeds();

    socket.on("food:new", onNewFood);
    socket.on("food:updated", onUpdatedFood);
    socket.on("need:new", onNewNeed);
    socket.on("need:updated", onUpdatedNeed);

    return () => {
      socket.off("food:new", onNewFood);
      socket.off("food:updated", onUpdatedFood);
      socket.off("need:new", onNewNeed);
      socket.off("need:updated", onUpdatedNeed);
    };
  }, [coords]);

  const accept = async (id) => {
    try {
      await api.post(`/food/${id}/accept`);
      loadNearby();
      loadMyPickups();
    } catch (e) {
      setError(e.response?.data?.message || "Could not accept — someone else may have already claimed it");
    }
  };

  const markPickedUp = async (id) => {
    await api.patch(`/food/${id}/picked-up`);
    loadMyPickups();
  };

  const markDelivered = async (id) => {
    await api.patch(`/food/${id}/delivered`, {});
    loadMyPickups();
  };

  const fulfillNeed = async (id) => {
    try {
      await api.patch(`/recipients/requests/${id}/fulfill`);
      loadOpenNeeds();
    } catch (e) {
      setError(e.response?.data?.message || "Could not mark this request fulfilled");
    }
  };

  const verified = user?.verification?.status === "verified" || user?.role === "volunteer";
  const activePickups = myPickups.filter((l) => l.status !== "delivered");
  const history = myPickups.filter((l) => l.status === "delivered");

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">
      {!verified && (
        <div className="border border-mango/40 bg-mango/10 rounded-lg p-4 text-sm">
          Your NGO account is <strong>{user?.verification?.status}</strong>. You'll be able to accept donations once an admin verifies you.
        </div>
      )}
      {error && <p className="text-clay text-sm">{error}</p>}
      {justArrived && (
        <div className="border border-mango/50 bg-mango/15 rounded-lg p-3 text-sm font-medium text-mango-dark">
          A new donation just appeared nearby — updated below.
        </div>
      )}

      {/* Active pickups — always visible regardless of the nearby-search radius,
          this is what was missing before: a place accepted items don't vanish from. */}
      {activePickups.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-1">Your active pickups</h2>
          <p className="text-sm text-ink-light dark:text-husk/70 mb-4">Accepted donations, in progress.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {activePickups.map((l) => (
              <FoodCard
                key={l._id}
                listing={l}
                action={
                  <div className="flex gap-2 mt-2 text-sm">
                    {l.status === "accepted" && (
                      <button onClick={() => markPickedUp(l._id)} className="px-3 py-1 rounded-full border border-banyan text-banyan dark:text-mango">
                        Mark picked up
                      </button>
                    )}
                    {l.status === "picked_up" && (
                      <button onClick={() => markDelivered(l._id)} className="px-3 py-1 rounded-full bg-mango text-ink">
                        Confirm delivery
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* This section didn't exist before — recipients had no way to be seen
          by NGOs/volunteers at all. It's what connects that side of the app. */}
      {openNeeds.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-1">People needing food nearby</h2>
          <p className="text-sm text-ink-light dark:text-husk/70 mb-4">
            Requests from orphanages, shelters, and individuals — sorted by urgency.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {openNeeds.map((n) => (
              <div key={n._id} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.requestedBy?.name || "Unnamed recipient"}</p>
                    <p className="text-sm text-ink-light dark:text-husk/70">{n.peopleToFeed} people to feed</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                    n.urgency === "high" ? "bg-clay/15 text-clay" : "bg-banyan/10 text-banyan dark:text-mango"
                  }`}>
                    {n.urgency} urgency
                  </span>
                </div>
                {n.note && <p className="text-xs text-ink-light dark:text-husk/60 mt-2">{n.note}</p>}
                <button
                  onClick={() => fulfillNeed(n._id)}
                  className="mt-3 px-3 py-1 rounded-full border border-banyan text-banyan dark:text-mango text-sm"
                >
                  Mark as fulfilled
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Nearby donations</h1>
        <p className="text-ink-light dark:text-husk/70 mb-6">
          {locating ? "Finding your location…" : "Within 15km of your current location."}
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {nearby.map((l) => (
            <FoodCard
              key={l._id}
              listing={l}
              action={
                l.status === "available" && verified && (
                  <button onClick={() => accept(l._id)} className="px-3 py-1 mt-2 rounded-full bg-banyan text-husk text-sm">
                    Accept
                  </button>
                )
              }
            />
          ))}
          {!locating && nearby.length === 0 && (
            <p className="text-ink-light dark:text-husk/60 text-sm">No available listings nearby right now — check back soon.</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Completed deliveries</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {history.map((l) => <FoodCard key={l._id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
}

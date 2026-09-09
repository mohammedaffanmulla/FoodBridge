import { useEffect, useState } from "react";
import api from "../api/api.js";
import FoodCard from "../components/FoodCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function NGODashboard() {
  const { user } = useAuth();
  const [nearby, setNearby] = useState([]);
  const [mine, setMine] = useState([]);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords([pos.coords.longitude, pos.coords.latitude]),
      () => setCoords(user?.location?.coordinates || [0, 0])
    );
  }, []);

  const loadNearby = () => {
    if (!coords) return;
    api.get(`/food/nearby?lng=${coords[0]}&lat=${coords[1]}&radiusKm=15`)
      .then(({ data }) => setNearby(data.listings))
      .catch((e) => setError(e.response?.data?.message || "Could not load nearby listings"));
  };

  useEffect(() => { loadNearby(); }, [coords]);

  const accept = async (id) => {
    try {
      await api.post(`/food/${id}/accept`);
      loadNearby();
      setMine((m) => [...m, id]);
    } catch (e) {
      setError(e.response?.data?.message || "Could not accept");
    }
  };

  const markPickedUp = (id) => api.patch(`/food/${id}/picked-up`).then(loadNearby);
  const markDelivered = (id) => api.patch(`/food/${id}/delivered`, {}).then(loadNearby);

  const verified = user?.verification?.status === "verified" || user?.role === "volunteer";

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Nearby donations</h1>
      <p className="text-ink-light dark:text-husk/70 mb-6">Within 15km of your current location.</p>

      {!verified && (
        <div className="border border-mango/40 bg-mango/10 rounded-lg p-4 text-sm mb-6">
          Your NGO account is <strong>{user?.verification?.status}</strong>. You'll be able to accept donations once an admin verifies you.
        </div>
      )}
      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {nearby.map((l) => (
          <FoodCard
            key={l._id}
            listing={l}
            action={
              <div className="flex gap-2 mt-2 text-sm">
                {l.status === "available" && verified && (
                  <button onClick={() => accept(l._id)} className="px-3 py-1 rounded-full bg-banyan text-husk">Accept</button>
                )}
                {l.status === "accepted" && l.acceptedBy === user._id && (
                  <button onClick={() => markPickedUp(l._id)} className="px-3 py-1 rounded-full border border-banyan text-banyan dark:text-mango">Mark picked up</button>
                )}
                {l.status === "picked_up" && l.acceptedBy === user._id && (
                  <button onClick={() => markDelivered(l._id)} className="px-3 py-1 rounded-full bg-mango text-ink">Confirm delivery</button>
                )}
              </div>
            }
          />
        ))}
        {nearby.length === 0 && <p className="text-ink-light dark:text-husk/60 text-sm">No available listings nearby right now — check back soon.</p>}
      </div>
    </div>
  );
}

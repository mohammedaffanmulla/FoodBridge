import { useEffect, useState } from "react";
import api from "../api/api.js";
import FoodCard from "../components/FoodCard.jsx";

const emptyForm = {
  title: "", description: "", foodState: "cooked",
  quantityValue: "", quantityUnit: "plates",
  preparedAt: "", expiryTime: "",
  address: "", lat: "", lng: "",
  isRecurring: false, frequency: "daily",
};

export default function DonorDashboard() {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastClassification, setLastClassification] = useState(null);

  const load = () => api.get("/food/mine").then(({ data }) => setListings(data.listings));
  useEffect(() => { load(); }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      update("lat", pos.coords.latitude);
      update("lng", pos.coords.longitude);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // A missing lat/lng silently becomes NaN once sent to the server, which
    // breaks the geospatial "find nearby NGOs" query for this listing forever
    // — it just never matches anyone. Catch it here instead.
    if (!form.lat || !form.lng) {
      setError("Please pin your pickup location — tap \"Use my current location\" below, or the listing won't reach anyone nearby.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("description", form.description);
      body.append("foodState", form.foodState);
      body.append("quantity", JSON.stringify({ value: Number(form.quantityValue), unit: form.quantityUnit }));
      body.append("preparedAt", form.preparedAt);
      body.append("expiryTime", form.expiryTime);
      body.append("pickupLocation", JSON.stringify({
        address: form.address,
        coordinates: [Number(form.lng), Number(form.lat)],
      }));
      body.append("recurrence", JSON.stringify({
        isRecurring: form.isRecurring, frequency: form.isRecurring ? form.frequency : null,
      }));
      photos.forEach((p) => body.append("photos", p));

      const { data } = await api.post("/food", body, { headers: { "Content-Type": "multipart/form-data" } });
      setLastClassification(data.listing.classification);
      setForm(emptyForm);
      setPhotos([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create listing");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 grid lg:grid-cols-[1fr_1.2fr] gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">List surplus food</h1>
        <p className="text-ink-light dark:text-husk/70 mb-6">
          We auto-classify it as safe for people, animal feed, or compost — and route it to the right partner.
        </p>

        {error && <p className="text-clay text-sm mb-4">{error}</p>}
        {lastClassification && (
          <div className="mb-6 border border-mango/40 bg-mango/10 rounded-lg p-4 text-sm">
            <p className="font-medium">Routed as: {lastClassification.routedTo.replace(/_/g, " ")}</p>
            <p className="text-ink-light dark:text-husk/70">{lastClassification.reason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="What is it? (e.g. Vegetable biryani, 40 plates)" value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

          <textarea placeholder="Description (helps our classifier route it correctly)" value={form.description}
            onChange={(e) => update("description", e.target.value)} rows={2}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.foodState} onChange={(e) => update("foodState", e.target.value)}
              className="border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5">
              <option value="cooked">Cooked</option>
              <option value="raw">Raw / uncooked</option>
            </select>
            <div className="flex gap-2">
              <input required type="number" min="0" placeholder="Qty" value={form.quantityValue}
                onChange={(e) => update("quantityValue", e.target.value)}
                className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5" />
              <select value={form.quantityUnit} onChange={(e) => update("quantityUnit", e.target.value)}
                className="border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-2 py-2.5">
                <option value="plates">plates</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="packets">packets</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-light dark:text-husk/60">
              Prepared at
              <input type="datetime-local" value={form.preparedAt} onChange={(e) => update("preparedAt", e.target.value)}
                className="w-full mt-1 border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2" />
            </label>
            <label className="text-xs text-ink-light dark:text-husk/60">
              Pickup by (expiry)
              <input required type="datetime-local" value={form.expiryTime} onChange={(e) => update("expiryTime", e.target.value)}
                className="w-full mt-1 border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2" />
            </label>
          </div>

          <div>
            <input required placeholder="Pickup address" value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
            <div className="flex gap-3 mt-2 items-center text-sm">
              <button type="button" onClick={useMyLocation} className="text-mango-dark font-medium">
                Use my current location
              </button>
              {form.lat && <span className="text-ink-light dark:text-husk/60">Pinned ✓</span>}
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Photo (helps NGOs assess quality)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files))}
              className="text-sm" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => update("isRecurring", e.target.checked)} />
            This is a recurring donation (e.g. daily restaurant surplus)
          </label>
          {form.isRecurring && (
            <select value={form.frequency} onChange={(e) => update("frequency", e.target.value)}
              className="border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          )}

          <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            {busy ? "Posting…" : "Post listing"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your listings</h2>
        <div className="space-y-3">
          {listings.length === 0 && <p className="text-ink-light dark:text-husk/60 text-sm">No listings yet — your first post appears here.</p>}
          {listings.map((l) => <FoodCard key={l._id} listing={l} action={<StatusBadge status={l.status} />} />)}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-banyan/10 text-banyan dark:text-mango capitalize">{status.replace("_", " ")}</span>;
}

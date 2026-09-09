import { useEffect, useState } from "react";
import api from "../api/api.js";

export default function RecipientDashboard() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ peopleToFeed: "", urgency: "medium", note: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/recipients/requests/mine").then(({ data }) => setRequests(data.requests));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/recipients/requests", { ...form, peopleToFeed: Number(form.peopleToFeed) });
      setForm({ peopleToFeed: "", urgency: "medium", note: "" });
      load();
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Request food</h1>
      <p className="text-ink-light dark:text-husk/70 mb-6">
        Tell nearby NGOs and volunteers who you're feeding — we'll flag urgent needs immediately.
      </p>

      <form onSubmit={submit} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-5 space-y-4 mb-10">
        <input required type="number" min="1" placeholder="People to feed" value={form.peopleToFeed}
          onChange={(e) => setForm((f) => ({ ...f, peopleToFeed: e.target.value }))}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
        <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5">
          <option value="low">Low urgency</option>
          <option value="medium">Medium urgency</option>
          <option value="high">High urgency — needed today</option>
        </select>
        <textarea placeholder="Anything NGOs should know?" value={form.note} rows={2}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
        <button disabled={busy} className="px-6 py-2.5 rounded-full bg-banyan text-husk font-medium">
          {busy ? "Sending…" : "Submit request"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-4">Your requests</h2>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r._id} className="border border-banyan/10 dark:border-husk/10 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{r.peopleToFeed} people · {r.urgency} urgency</p>
              {r.note && <p className="text-sm text-ink-light dark:text-husk/70">{r.note}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-banyan/10 text-banyan dark:text-mango capitalize">{r.status}</span>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-ink-light dark:text-husk/60">No requests yet.</p>}
      </div>
    </div>
  );
}

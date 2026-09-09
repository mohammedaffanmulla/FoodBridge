import { useEffect, useState } from "react";
import api from "../api/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [flagged, setFlagged] = useState([]);

  const load = () => {
    api.get("/admin/stats").then(({ data }) => setStats(data));
    api.get("/admin/ngos/pending").then(({ data }) => setPending(data.ngos));
    api.get("/admin/fraud-flags").then(({ data }) => setFlagged(data.flagged));
  };
  useEffect(() => { load(); }, []);

  const verify = (id, decision) => api.patch(`/admin/ngos/${id}/verify`, { decision }).then(load);

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-6">Platform overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats && [
            ["Total users", stats.totalUsers],
            ["Verified NGOs", stats.totalVerifiedNGOs],
            ["Listings posted", stats.totalListings],
            ["Meals saved", stats.mealsSaved],
          ].map(([label, value]) => (
            <div key={label} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4">
              <div className="font-display text-3xl text-banyan dark:text-mango">{value}</div>
              <p className="text-sm text-ink-light dark:text-husk/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">NGOs pending verification</h2>
        <div className="space-y-3">
          {pending.map((ngo) => (
            <div key={ngo._id} className="border border-banyan/10 dark:border-husk/10 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{ngo.name}</p>
                <p className="text-sm text-ink-light dark:text-husk/70">{ngo.email || ngo.phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => verify(ngo._id, "verified")} className="px-3 py-1.5 rounded-full bg-banyan text-husk text-sm">Approve</button>
                <button onClick={() => verify(ngo._id, "rejected")} className="px-3 py-1.5 rounded-full border border-clay text-clay text-sm">Reject</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-ink-light dark:text-husk/60">Nothing pending review.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Fraud flags</h2>
        <div className="space-y-3">
          {flagged.map((f) => (
            <div key={f._id} className="border border-clay/30 bg-clay/5 rounded-lg p-4">
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-ink-light dark:text-husk/70">Donor: {f.donor?.name} · Flags: {f.fraudFlags.join(", ")}</p>
            </div>
          ))}
          {flagged.length === 0 && <p className="text-sm text-ink-light dark:text-husk/60">No flagged listings.</p>}
        </div>
      </div>
    </div>
  );
}

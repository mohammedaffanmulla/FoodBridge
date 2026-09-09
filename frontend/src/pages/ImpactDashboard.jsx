import { useEffect, useState } from "react";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ImpactDashboard() {
  const { user } = useAuth();
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    if (user) api.get("/impact/me").then(({ data }) => setImpact(data));
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Your impact</h1>
      <p className="text-ink-light dark:text-husk/70 mb-8">Every completed donation adds up here.</p>

      {!user && <p className="text-sm">Log in to see your personal impact.</p>}

      {impact && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Stat label="Meals saved" value={impact.stats.mealsSaved} />
            <Stat label="Donations" value={impact.stats.totalDonations} />
            <Stat label="Pickups done" value={impact.stats.pickupsCompleted} />
          </div>

          <div className="border border-banyan/10 dark:border-husk/10 rounded-xl p-5">
            <p className="font-medium mb-2">{impact.points} points</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {impact.badges.length === 0 && <span className="text-sm text-ink-light dark:text-husk/60">No badges yet — your first donation earns one.</span>}
              {impact.badges.map((b) => (
                <span key={b} className="text-xs px-3 py-1 rounded-full bg-mango/20 text-mango-dark font-medium">{b}</span>
              ))}
            </div>
            {impact.nextBadge && (
              <p className="text-sm text-ink-light dark:text-husk/70">
                {impact.nextBadge.points - impact.points} points to <strong>{impact.nextBadge.badge}</strong>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4">
      <div className="font-display text-3xl text-banyan dark:text-mango">{value}</div>
      <p className="text-sm text-ink-light dark:text-husk/70">{label}</p>
    </div>
  );
}

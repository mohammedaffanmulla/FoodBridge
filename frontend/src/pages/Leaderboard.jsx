import { useEffect, useState } from "react";
import api from "../api/api.js";

const categoryLabel = {
  human_edible: "For people",
  animal_feed: "Animal feed",
  compost_waste: "Compost / waste",
};

export default function Leaderboard() {
  const [role, setRole] = useState("donor");
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get(`/impact/leaderboard?role=${role}`).then(({ data }) => setList(data.leaderboard));
  }, [role]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Leaderboard</h1>
      <p className="text-ink-light dark:text-husk/70 mb-6">Top contributors, ranked by impact points.</p>

      <div className="flex gap-2 mb-6 text-sm">
        {["donor", "ngo", "volunteer"].map((r) => (
          <button key={r} onClick={() => setRole(r)}
            className={`px-3 py-1.5 rounded-full capitalize ${role === r ? "bg-banyan text-husk" : "border border-banyan/20"}`}>
            {r}s
          </button>
        ))}
      </div>

      <ol className="space-y-2">
        {list.map((u, i) => (
          <li key={u._id} className="border border-banyan/10 dark:border-husk/10 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-display text-lg text-mango-dark w-6">{i + 1}</span>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink-light dark:text-husk/60">{u.stats?.mealsSaved || 0} meals · {u.badges?.length || 0} badges</p>
                </div>
              </div>
              <span className="font-medium text-banyan dark:text-mango">{u.points} pts</span>
            </div>

            {/* Recent food donated / picked up — the detail that was missing */}
            {u.recentListings?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-banyan/5 dark:border-husk/10 space-y-1.5">
                {u.recentListings.map((l) => (
                  <div key={l._id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-light dark:text-husk/70">
                      {l.title} — {l.quantity?.value} {l.quantity?.unit} ({l.foodState})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-banyan/10 text-banyan dark:text-mango whitespace-nowrap ml-2">
                      {categoryLabel[l.classification?.category] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-ink-light dark:text-husk/60">No entries yet.</p>}
      </ol>
    </div>
  );
}
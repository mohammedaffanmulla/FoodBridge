import { useEffect, useState } from "react";
import api from "../api/api.js";

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
          <li key={u._id} className="flex items-center justify-between border border-banyan/10 dark:border-husk/10 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-mango-dark w-6">{i + 1}</span>
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-ink-light dark:text-husk/60">{u.stats?.mealsSaved || 0} meals · {u.badges?.length || 0} badges</p>
              </div>
            </div>
            <span className="font-medium text-banyan dark:text-mango">{u.points} pts</span>
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-ink-light dark:text-husk/60">No entries yet.</p>}
      </ol>
    </div>
  );
}

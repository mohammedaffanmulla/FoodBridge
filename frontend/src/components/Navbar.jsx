import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const roleHome = {
  donor: "/donor",
  ngo: "/ngo",
  volunteer: "/ngo",
  recipient: "/recipient",
  admin: "/admin",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("fb_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fb_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="border-b border-banyan/10 dark:border-husk/10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-xl font-semibold text-banyan dark:text-mango">
          FoodBridge
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link to="/map" className="hover:text-mango-dark">Live map</Link>
          <Link to="/impact" className="hover:text-mango-dark">Impact</Link>
          <Link to="/leaderboard" className="hover:text-mango-dark">Leaderboard</Link>

          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className="w-9 h-9 grid place-items-center rounded-full border border-banyan/20 dark:border-husk/20"
          >
            {dark ? "☀" : "☾"}
          </button>

          {user && <NotificationBell />}

          {user ? (
            <div className="flex items-center gap-3">
              <Link to={roleHome[user.role] || "/"} className="font-medium text-banyan dark:text-mango">
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="text-ink-light dark:text-husk/70 hover:text-clay"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

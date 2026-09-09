import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-banyan/10 dark:border-husk/10 mt-10">
      <div className="max-w-6xl mx-auto px-5 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <p className="font-display text-lg text-banyan dark:text-mango mb-2">FoodBridge</p>
          <p className="text-ink-light dark:text-husk/70">
            Connecting surplus food with the people, animals, and processes that can still use it.
          </p>
        </div>
        <div>
          <p className="font-medium mb-2">Platform</p>
          <ul className="space-y-1.5 text-ink-light dark:text-husk/70">
            <li><Link to="/map" className="hover:text-mango-dark">Live map</Link></li>
            <li><Link to="/impact" className="hover:text-mango-dark">Impact dashboard</Link></li>
            <li><Link to="/leaderboard" className="hover:text-mango-dark">Leaderboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Get involved</p>
          <ul className="space-y-1.5 text-ink-light dark:text-husk/70">
            <li><Link to="/register?role=donor" className="hover:text-mango-dark">Become a donor</Link></li>
            <li><Link to="/register?role=ngo" className="hover:text-mango-dark">Register an NGO</Link></li>
            <li><Link to="/register?role=recipient" className="hover:text-mango-dark">Request food</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Company</p>
          <ul className="space-y-1.5 text-ink-light dark:text-husk/70">
            <li><a href="#" className="hover:text-mango-dark">About</a></li>
            <li><a href="#" className="hover:text-mango-dark">Contact</a></li>
            <li><a href="#" className="hover:text-mango-dark">Privacy</a></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-ink-light dark:text-husk/50 pb-6">
        © {new Date().getFullYear()} FoodBridge. Built to reduce food waste, one pickup at a time.
      </p>
    </footer>
  );
}

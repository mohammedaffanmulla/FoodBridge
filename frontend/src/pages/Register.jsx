import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { donor: "/donor", ngo: "/ngo", volunteer: "/ngo", recipient: "/recipient", admin: "/admin" };

const roles = [
  { value: "donor", label: "Donor", hint: "Restaurant, home kitchen, canteen, event or individual" },
  { value: "ngo", label: "NGO / Shelter", hint: "Orphanage, old-age home, shelter — needs admin verification" },
  { value: "volunteer", label: "Volunteer", hint: "Help pick up and deliver donations" },
  { value: "recipient", label: "Recipient", hint: "Register a need on behalf of people you support" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "", role: params.get("role") || "donor", donorType: "restaurant",
    recipientType: "shelter", email: "", phone: "", password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const user = await register(form);
      navigate(roleHome[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Join FoodBridge</h1>
      <p className="text-ink-light dark:text-husk/70 mb-8">Every account starts here — we'll route you to the right dashboard.</p>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium block mb-2">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                type="button" key={r.value}
                onClick={() => update("role", r.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm ${
                  form.role === r.value ? "border-banyan bg-banyan/5 dark:bg-mango/10" : "border-banyan/15 dark:border-husk/15"
                }`}
              >
                <span className="font-medium block">{r.label}</span>
                <span className="text-xs text-ink-light dark:text-husk/60">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {form.role === "donor" && (
          <div>
            <label className="text-sm font-medium block mb-1">Donor type</label>
            <select value={form.donorType} onChange={(e) => update("donorType", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5">
              <option value="restaurant">Restaurant</option>
              <option value="wedding_hall">Wedding hall / banquet</option>
              <option value="caterer">Caterer</option>
              <option value="event">Event / function</option>
              <option value="individual">Individual / home kitchen</option>
            </select>
          </div>
        )}

        {form.role === "recipient" && (
          <div>
            <label className="text-sm font-medium block mb-1">Organization type</label>
            <select value={form.recipientType} onChange={(e) => update("recipientType", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-3 py-2.5">
              <option value="orphanage">Orphanage</option>
              <option value="old_age_home">Old-age home</option>
              <option value="shelter">Shelter</option>
              <option value="individual_in_need">Individual in need</option>
            </select>
          </div>
        )}

        <input required placeholder="Full name / organization name" value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

        <input placeholder="Email" type="email" value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

        <input placeholder="Phone (for OTP + SMS alerts)" value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

        <input required placeholder="Password" type="password" value={form.password}
          onChange={(e) => update("password", e.target.value)}
          className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

        {form.role === "ngo" && (
          <p className="text-xs text-ink-light dark:text-husk/60">
            NGO accounts are reviewed by an admin before you can accept donations. You'll be notified once verified.
          </p>
        )}

        <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-light dark:text-husk/70">
        Already have an account? <Link to="/login" className="text-mango-dark dark:text-mango font-medium">Log in</Link>
      </p>
    </div>
  );
}

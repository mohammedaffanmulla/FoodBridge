import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { UtensilsCrossed, Building2, Bike, Users, MapPin, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { donor: "/donor", ngo: "/ngo", volunteer: "/ngo", recipient: "/recipient", admin: "/admin" };

const roles = [
  { value: "donor", label: "Donor", icon: UtensilsCrossed, hint: "Restaurant, home kitchen, canteen, event or individual" },
  { value: "ngo", label: "NGO / Shelter", icon: Building2, hint: "Orphanage, old-age home, shelter — needs admin verification" },
  { value: "volunteer", label: "Volunteer", icon: Bike, hint: "Help pick up and deliver donations" },
  { value: "recipient", label: "Recipient", icon: Users, hint: "Register a need on behalf of people you support" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", role: params.get("role") || "donor", donorType: "restaurant",
    recipientType: "shelter", email: "", phone: "", password: "",
    address: "", lat: "", lng: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedRole = roles.find((r) => r.value === form.role);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location. Enter your address manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("lat", pos.coords.latitude);
        update("lng", pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — check browser permissions, or enter your address and we'll still save it.");
        setLocating(false);
      }
    );
  };

  const goToStep2 = () => {
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // NGOs and volunteers MUST have a real location, or the "notify nearby
    // partners when a donor posts" feature has nothing to match against.
    if ((form.role === "ngo" || form.role === "volunteer") && (!form.lat || !form.lng)) {
      setError("Please share your location so nearby donations can reach you — tap \"Use my current location\" below.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        location: form.lat && form.lng
          ? { coordinates: [Number(form.lng), Number(form.lat)], address: form.address }
          : undefined,
      };
      const user = await register(payload);
      navigate(roleHome[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Join FoodBridge</h1>
      <p className="text-ink-light dark:text-husk/70 mb-6">Two quick steps — we'll route you to the right dashboard.</p>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <StepDot active={step >= 1} done={step > 1} label="1" />
        <div className={`h-0.5 flex-1 rounded ${step > 1 ? "bg-banyan dark:bg-mango" : "bg-banyan/15 dark:bg-husk/15"}`} />
        <StepDot active={step >= 2} done={false} label="2" />
      </div>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      {/* STEP 1 — role selection, big tappable cards */}
      {step === 1 && (
        <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
          <label className="text-sm font-medium block">I am a…</label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = form.role === r.value;
              return (
                <button
                  type="button" key={r.value}
                  onClick={() => update("role", r.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    active
                      ? "border-banyan bg-banyan/5 dark:border-mango dark:bg-mango/10 scale-[1.02]"
                      : "border-banyan/10 dark:border-husk/10 hover:border-banyan/30 dark:hover:border-mango/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full grid place-items-center mb-2 ${active ? "bg-banyan dark:bg-mango" : "bg-banyan/10 dark:bg-husk/10"}`}>
                    <Icon size={18} className={active ? "text-husk dark:text-ink" : "text-banyan dark:text-mango"} />
                  </div>
                  <span className="font-medium block text-sm">{r.label}</span>
                  <span className="text-xs text-ink-light dark:text-husk/60">{r.hint}</span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={goToStep2}
            className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            Continue as a {selectedRole?.label}
          </button>
        </div>
      )}

      {/* STEP 2 — details form */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <button type="button" onClick={() => setStep(1)} className="text-sm text-ink-light dark:text-husk/70 hover:text-mango-dark mb-1">
            ← Change role ({selectedRole?.label})
          </button>

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

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Email" type="email" value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
            <input placeholder="Phone" value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
          </div>
          <p className="text-xs text-ink-light dark:text-husk/50 -mt-2">Phone is used for OTP login and SMS pickup alerts.</p>

          <input required placeholder="Password" type="password" value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />

          {/* Location */}
          <div className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-mango-dark" />
              <span className="text-sm font-medium">Location</span>
              {(form.role === "ngo" || form.role === "volunteer") && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-clay/10 text-clay">Required</span>
              )}
            </div>
            <input placeholder="Address (city / area)" value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5" />
            <div className="flex items-center gap-3 mt-2 text-sm">
              <button type="button" onClick={useMyLocation} disabled={locating} className="text-mango-dark font-medium">
                {locating ? "Locating…" : "Use my current location"}
              </button>
              {form.lat && (
                <span className="text-banyan dark:text-mango flex items-center gap-1 text-xs font-medium">
                  <Check size={14} /> Pinned
                </span>
              )}
            </div>
            {(form.role === "ngo" || form.role === "volunteer") && (
              <p className="text-xs text-ink-light dark:text-husk/60 mt-2">
                This is how we match you to donations near you — without it, you won't be notified of anything nearby.
              </p>
            )}
          </div>

          {form.role === "ngo" && (
            <p className="text-xs text-ink-light dark:text-husk/60">
              NGO accounts are reviewed by an admin before you can accept donations. You'll be notified once verified.
            </p>
          )}

          <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-ink-light dark:text-husk/70">
        Already have an account? <Link to="/login" className="text-mango-dark dark:text-mango font-medium">Log in</Link>
      </p>
    </div>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-medium flex-shrink-0 ${
      active ? "bg-banyan text-husk dark:bg-mango dark:text-ink" : "bg-banyan/10 text-ink-light dark:bg-husk/10 dark:text-husk/60"
    }`}>
      {done ? <Check size={14} /> : label}
    </div>
  );
}

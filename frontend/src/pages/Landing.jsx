import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed, Home, PartyPopper, Building2, ChefHat, ShoppingBasket,
  Baby, Users, Heart, Tractor, Recycle, MapPin, Bell, ShieldCheck,
  ChevronDown, Sparkles,
} from "lucide-react";
import api from "../api/api.js";

const donorSources = [
  { icon: UtensilsCrossed, label: "Restaurants & cafes", detail: "Daily unsold or over-prepped food" },
  { icon: Home, label: "Home kitchens", detail: "Cooked more than your family needs" },
  { icon: PartyPopper, label: "Weddings & events", detail: "Function halls, parties, celebrations" },
  { icon: Building2, label: "Office & school canteens", detail: "Bulk catering with daily leftovers" },
  { icon: ChefHat, label: "Caterers", detail: "Post-event surplus, ready to move fast" },
  { icon: ShoppingBasket, label: "Grocers & individuals", detail: "Raw produce nearing its sell-by date" },
];

const recipientRouting = [
  { icon: Baby, label: "Orphanages", note: "Human-edible" },
  { icon: Users, label: "Shelters & old-age homes", note: "Human-edible" },
  { icon: Heart, label: "Individuals in need", note: "Human-edible" },
  { icon: Tractor, label: "Farms & animal shelters", note: "Animal feed" },
  { icon: Recycle, label: "Compost & waste partners", note: "Compost / waste" },
];

const testimonials = [
  {
    name: "Priya", role: "Restaurant owner",
    quote: "We used to throw out whatever didn't sell by closing. Now it's picked up within the hour most nights.",
  },
  {
    name: "Ravi", role: "Shelter coordinator",
    quote: "The pickup alerts mean we know exactly when food is coming and how many plates to expect.",
  },
  {
    name: "Meera", role: "Home cook, weekend volunteer",
    quote: "I posted extra biryani from a family gathering on a whim. It was picked up in twenty minutes.",
  },
];

const faqs = [
  {
    q: "Does my food have to come from a restaurant or big event?",
    a: "No — donors range from restaurants and catering halls to home kitchens, office canteens, and individuals with a single extra dish. Any surplus, cooked or raw, can be listed.",
  },
  {
    q: "What if my food isn't safe for people to eat anymore?",
    a: "That's what the auto-classification is for. Based on food type, prep time, and expiry, listings are automatically routed to animal-feed partners or compost/waste partners instead of being wasted entirely.",
  },
  {
    q: "Do I need to be a registered NGO to receive food?",
    a: "To accept donations directly, yes — NGOs and shelters go through a quick admin verification step first. Individuals can still register a need and be matched by a verified NGO nearby.",
  },
  {
    q: "Is there a cost to donate or receive food?",
    a: "Donating and receiving food is free. NGOs that need help covering transport costs can optionally accept donations toward that through their profile.",
  },
  {
    q: "How fast does a listing get picked up?",
    a: "It depends on your area's NGO/volunteer density, but nearby verified partners are notified the moment you post, and expiry countdowns keep pickup windows visible to everyone involved.",
  },
];

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => setStats(null));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-16 grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <p className="text-clay font-medium mb-3 flex items-center gap-2">
            <Sparkles size={16} /> Surplus food, redirected — not wasted
          </p>
          <h1 className="text-4xl md:text-5xl leading-tight font-semibold text-banyan dark:text-mango">
            Any extra food, from anywhere, can be someone's next meal.
          </h1>
          <p className="mt-5 text-ink-light dark:text-husk/70 max-w-lg">
            Restaurants, home kitchens, canteens, caterers, weddings and
            everyday individuals all have one thing in common: sometimes
            there's more food than people to eat it. FoodBridge finds the
            nearest verified NGO, shelter or volunteer to pick it up before it
            goes to waste — no matter where it came from.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register?role=donor" className="px-6 py-3 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
              Donate surplus food
            </Link>
            <Link to="/register?role=ngo" className="px-6 py-3 rounded-full border border-banyan text-banyan dark:text-mango dark:border-mango font-medium hover:bg-banyan/5 transition">
              Register as NGO / volunteer
            </Link>
          </div>
        </div>

        <div className="border-2 border-dashed border-banyan/25 dark:border-mango/25 rounded-2xl p-8 bg-white/40 dark:bg-white/5">
          <p className="text-sm uppercase tracking-wide text-ink-light dark:text-husk/60 mb-1">Since launch</p>
          <div className="font-display text-6xl text-mango-dark dark:text-mango">
            {stats?.mealsSaved ?? "—"}
          </div>
          <p className="text-ink-light dark:text-husk/70 mb-6">meals put on a plate instead of in a bin</p>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-banyan/10 dark:border-husk/10 pt-4">
            <div>
              <div className="font-display text-2xl text-banyan dark:text-mango">{stats?.co2SavedKg ?? "—"}</div>
              <p className="text-ink-light dark:text-husk/70">kg CO₂e avoided</p>
            </div>
            <div>
              <div className="font-display text-2xl text-banyan dark:text-mango">{stats?.totalVerifiedNGOs ?? "—"}</div>
              <p className="text-ink-light dark:text-husk/70">verified NGO partners</p>
            </div>
            <div>
              <div className="font-display text-2xl text-banyan dark:text-mango">{stats?.totalDonors ?? "—"}</div>
              <p className="text-ink-light dark:text-husk/70">registered donors</p>
            </div>
            <div>
              <div className="font-display text-2xl text-banyan dark:text-mango">{stats?.deliveredListings ?? "—"}</div>
              <p className="text-ink-light dark:text-husk/70">deliveries completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who can donate — deliberately source-agnostic */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-semibold mb-2 text-banyan dark:text-mango">Food comes from everywhere — so do donors</h2>
        <p className="text-ink-light dark:text-husk/70 mb-8 max-w-2xl">
          There's no minimum size and no fixed category. If it's edible and
          you have more than you need, it belongs here.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {donorSources.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-5 flex gap-4 items-start hover:border-mango/40 transition">
              <div className="w-10 h-10 rounded-full bg-banyan/10 dark:bg-mango/10 grid place-items-center flex-shrink-0">
                <Icon size={20} className="text-banyan dark:text-mango" />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-ink-light dark:text-husk/70">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Where it goes — mirrors the classification logic */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-semibold mb-2 text-banyan dark:text-mango">Where every listing ends up</h2>
        <p className="text-ink-light dark:text-husk/70 mb-8 max-w-2xl">
          Every donation is auto-classified the moment it's posted, so it's
          routed to the right partner — not just the nearest one.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
          {recipientRouting.map(({ icon: Icon, label, note }) => (
            <div key={label} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-mango/15 grid place-items-center mb-3">
                <Icon size={18} className="text-mango-dark" />
              </div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-ink-light dark:text-husk/60 mt-1">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-semibold mb-8 text-banyan dark:text-mango">How a donation moves</h2>
        <ol className="grid md:grid-cols-4 gap-6">
          {[
            ["List it", "Log quantity, type and pickup window with a photo — from a restaurant's kitchen or your own, in under a minute."],
            ["We route it", "Auto-classified: safe for people, animal feed, or compost — matched to the right partner nearby."],
            ["Volunteer picks up", "A verified NGO or volunteer accepts, tracked live on the map until pickup."],
            ["Delivery confirmed", "Recipient confirms, meals and CO₂ saved are logged to the donor's impact."],
          ].map(([title, body], i) => (
            <li key={title} className="border-l-2 border-mango pl-4">
              <span className="text-mango-dark font-display text-xl">{i + 1}</span>
              <h3 className="font-medium mt-1">{title}</h3>
              <p className="text-sm text-ink-light dark:text-husk/70 mt-1">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            [MapPin, "Live map", "See available donations and NGOs near you in real time."],
            [Bell, "Expiry alerts", "Countdown notifications so nothing sits past its safe pickup window."],
            [ShieldCheck, "Verified NGOs only", "Every organization accepting donations is reviewed by an admin first."],
          ].map(([Icon, title, body]) => (
            <div key={title} className="rounded-xl p-5 bg-banyan/5 dark:bg-mango/5">
              <Icon size={20} className="text-banyan dark:text-mango mb-3" />
              <p className="font-medium">{title}</p>
              <p className="text-sm text-ink-light dark:text-husk/70 mt-1">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-semibold mb-8 text-banyan dark:text-mango">From people already using it</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="border border-banyan/10 dark:border-husk/10 rounded-xl p-5">
              <p className="text-ink-light dark:text-husk/80 italic">"{t.quote}"</p>
              <p className="mt-4 text-sm font-medium">{t.name}</p>
              <p className="text-xs text-ink-light dark:text-husk/60">{t.role}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-light dark:text-husk/50 mt-4">Illustrative example users, not verified live testimonials.</p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-semibold mb-8 text-banyan dark:text-mango">Common questions</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={f.q} className="border border-banyan/10 dark:border-husk/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium"
              >
                {f.q}
                <ChevronDown size={18} className={`transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="px-5 pb-4 text-sm text-ink-light dark:text-husk/70">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-2xl bg-banyan dark:bg-banyan-dark text-husk px-8 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Got extra food right now?</h2>
          <p className="text-husk/80 mb-6 max-w-md mx-auto">
            It takes under a minute to list — whatever the source, whatever the amount.
          </p>
          <Link to="/register?role=donor" className="inline-block px-6 py-3 rounded-full bg-mango text-ink font-medium hover:bg-mango-dark transition">
            Post a listing
          </Link>
        </div>
      </section>
    </div>
  );
}

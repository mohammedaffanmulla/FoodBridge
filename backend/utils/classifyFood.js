/**
 * Food edibility classifier.
 *
 * This is a transparent, explainable RULES ENGINE, not a black-box model —
 * intentionally, because routing food to humans vs. animals vs. waste is a
 * safety-critical decision and every decision should be auditable by an
 * admin. It runs in <1ms and needs no ML infra to ship an MVP.
 *
 * Upgrade path: swap `classifyFood()`'s body for a call to a vision model
 * (photo) + this same rule set as a fallback/sanity-check layer. Keep the
 * rules as a hard safety floor even if you add ML — e.g. never let a model
 * route food past its hard expiry into "human_edible".
 */

const HOURS = 60 * 60 * 1000;

// Foods that spoil fast and are risky to redistribute to humans after a
// few hours even if "not yet expired" per donor input (dairy, seafood, etc).
const HIGH_RISK_KEYWORDS = [
  "dairy", "milk", "paneer", "seafood", "fish", "prawn", "shellfish",
  "mayonnaise", "cream", "egg curry", "raw egg",
];

// Foods generally unsafe/unsuitable for animal feed too (spoiled, moldy, chemical-laden)
const UNSAFE_FOR_ANIMALS_KEYWORDS = [
  "moldy", "mold", "spoiled", "rotten", "burnt", "chemical", "expired",
  "contaminated", "rancid",
];

export function classifyFood({ title = "", description = "", foodState, preparedAt, expiryTime }) {
  const text = `${title} ${description}`.toLowerCase();
  const now = new Date();
  const expiry = new Date(expiryTime);
  const prepared = preparedAt ? new Date(preparedAt) : null;

  const hoursUntilExpiry = (expiry - now) / HOURS;
  const hoursSincePrepared = prepared ? (now - prepared) / HOURS : null;

  const flaggedUnsafe = UNSAFE_FOR_ANIMALS_KEYWORDS.some((kw) => text.includes(kw));
  const isHighRisk = HIGH_RISK_KEYWORDS.some((kw) => text.includes(kw));

  // Rule 1: already past expiry, or explicitly flagged unsafe -> compost/waste
  if (hoursUntilExpiry <= 0 || flaggedUnsafe) {
    return {
      category: "compost_waste",
      routedTo: "waste_partner",
      reason: flaggedUnsafe
        ? "Description indicates spoilage/contamination risk."
        : "Listing is past its expiry time.",
      confidence: 0.95,
    };
  }

  // Rule 2: cooked food, high-risk perishable, prepared >4h ago -> too risky
  // for direct human consumption but generally fine for animal feed if <8h.
  if (foodState === "cooked" && isHighRisk && hoursSincePrepared !== null && hoursSincePrepared > 4) {
    if (hoursSincePrepared <= 8) {
      return {
        category: "animal_feed",
        routedTo: "farm_animal_shelter",
        reason: "Perishable cooked item prepared 4-8h ago: outside safe human-consumption window, still viable as animal feed.",
        confidence: 0.75,
      };
    }
    return {
      category: "compost_waste",
      routedTo: "waste_partner",
      reason: "Perishable cooked item prepared over 8h ago: unsafe for human or animal consumption.",
      confidence: 0.85,
    };
  }

  // Rule 3: cooked food within a safe window and enough time before expiry -> humans
  if (foodState === "cooked" && hoursUntilExpiry >= 1) {
    return {
      category: "human_edible",
      routedTo: "ngo_shelter",
      reason: "Cooked food within safe consumption window and before expiry.",
      confidence: 0.9,
    };
  }

  // Rule 4: raw ingredients (vegetables, grains, packaged) with reasonable shelf life -> humans
  if (foodState === "raw" && hoursUntilExpiry >= 2) {
    return {
      category: "human_edible",
      routedTo: "ngo_shelter",
      reason: "Raw/uncooked ingredients with sufficient shelf life before expiry.",
      confidence: 0.85,
    };
  }

  // Rule 5: expiry too close (<1h) but not yet expired -> fast-track to whichever
  // partner can act fastest; default to animal feed as a safe middle ground.
  if (hoursUntilExpiry < 1) {
    return {
      category: "animal_feed",
      routedTo: "farm_animal_shelter",
      reason: "Very short window before expiry; routed to nearest animal-feed partner for fastest pickup.",
      confidence: 0.6,
    };
  }

  // Fallback
  return {
    category: "animal_feed",
    routedTo: "farm_animal_shelter",
    reason: "Could not confidently classify as safe for human consumption; defaulted to animal feed.",
    confidence: 0.5,
  };
}

// Rough meals/CO2 estimate for the impact dashboard.
export function estimateImpact({ value, unit }) {
  const KG_PER_MEAL = 0.4; // ~400g per meal, standard NGO estimate
  const CO2_PER_KG_FOOD_WASTE = 2.5; // kg CO2e avoided per kg food diverted from landfill

  let kg = value;
  if (unit === "plates") kg = value * 0.35;
  if (unit === "packets") kg = value * 0.3;
  if (unit === "liters") kg = value * 1; // approx 1kg/L for most liquids

  return {
    estimatedMeals: Math.round(kg / KG_PER_MEAL),
    estimatedCo2SavedKg: Math.round(kg * CO2_PER_KG_FOOD_WASTE * 10) / 10,
  };
}

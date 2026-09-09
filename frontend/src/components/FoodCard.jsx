import { formatDistanceToNow } from "date-fns";

const categoryStyle = {
  human_edible: "bg-banyan/10 text-banyan dark:text-mango",
  animal_feed: "bg-mango/15 text-mango-dark",
  compost_waste: "bg-clay/10 text-clay",
};

const categoryLabel = {
  human_edible: "For people",
  animal_feed: "Animal feed",
  compost_waste: "Compost / waste",
};

export default function FoodCard({ listing, action }) {
  return (
    <div className="border border-banyan/10 dark:border-husk/10 rounded-xl p-4 flex gap-4">
      <div className="w-20 h-20 rounded-lg bg-banyan/5 dark:bg-mango/10 flex-shrink-0 overflow-hidden">
        {listing.photos?.[0] && (
          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium truncate">{listing.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${categoryStyle[listing.classification?.category]}`}>
            {categoryLabel[listing.classification?.category]}
          </span>
        </div>
        <p className="text-sm text-ink-light dark:text-husk/70 mt-0.5">
          {listing.quantity?.value} {listing.quantity?.unit} · {listing.foodState}
        </p>
        <p className="text-xs text-ink-light dark:text-husk/60 mt-1">
          {listing.pickupLocation?.address}
        </p>
        <p className="text-xs text-mango-dark mt-1">
          Expires {formatDistanceToNow(new Date(listing.expiryTime), { addSuffix: true })}
        </p>
        {action}
      </div>
    </div>
  );
}

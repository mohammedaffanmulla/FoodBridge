import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api.js";

const pinColor = {
  human_edible: "#234D35", // banyan
  animal_feed: "#E3A72E",  // mango
  compost_waste: "#B5432B", // clay
};

// Recenters the map whenever `center` changes (e.g. once geolocation resolves)
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center]);
  return null;
}

export default function MapView() {
  const [center, setCenter] = useState([20.5937, 78.9629]); // India centroid fallback
  const [listings, setListings] = useState([]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const c = [pos.coords.latitude, pos.coords.longitude];
      setCenter(c);
      api
        .get(`/food/nearby?lng=${c[1]}&lat=${c[0]}&radiusKm=25`)
        .then(({ data }) => setListings(data.listings))
        .catch(() => setListings([]));
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Live food map</h1>
      <p className="text-ink-light dark:text-husk/70 mb-6">
        Available donations near you, colour-coded by routing. No API key required — powered by OpenStreetMap.
      </p>

      <div className="rounded-xl overflow-hidden border border-banyan/10 dark:border-husk/10" style={{ height: "70vh" }}>
        <MapContainer center={center} zoom={12} style={{ width: "100%", height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          {listings.map((l) => (
            <CircleMarker
              key={l._id}
              center={[l.pickupLocation.coordinates[1], l.pickupLocation.coordinates[0]]}
              radius={9}
              pathOptions={{
                color: pinColor[l.classification.category],
                fillColor: pinColor[l.classification.category],
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm">{l.quantity.value} {l.quantity.unit}</p>
                <p className="text-xs text-ink-light">{l.pickupLocation.address}</p>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="flex gap-6 mt-4 text-sm">
        <Legend color={pinColor.human_edible} label="For people" />
        <Legend color={pinColor.animal_feed} label="Animal feed" />
        <Legend color={pinColor.compost_waste} label="Compost / waste" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

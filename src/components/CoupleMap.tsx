import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { OrbitState, UserRole, UserLocation } from "../types";
import { 
  MapPin, 
  Navigation, 
  Heart, 
  Battery, 
  Clock, 
  Sparkles, 
  Send, 
  Compass, 
  RefreshCw, 
  Radio, 
  Search, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Key, 
  Globe
} from "lucide-react";

interface CoupleMapProps {
  state: OrbitState;
  activeUser: UserRole;
  onUpdateLocation: (data: Partial<UserLocation>) => void;
  onSendPing: () => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Haversine formula to compute distance in miles and km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R_miles = 3958.8;
  const R_km = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    miles: Math.round(R_miles * c),
    km: Math.round(R_km * c),
  };
}

// Estimate time difference based on longitude
function estimateTimeDiffHours(lngA: number, lngB: number) {
  const diff = Math.round((lngB - lngA) / 15);
  return diff;
}

// Polyline component to draw connection curve between partner A and B
function PartnerPolyline({ posA, posB }: { posA: { lat: number; lng: number }; posB: { lat: number; lng: number } }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 3,
    };

    const polyline = new mapsLib.Polyline({
      path: [posA, posB],
      geodesic: true,
      strokeColor: "#F43F5E",
      strokeOpacity: 0,
      strokeWeight: 3,
      icons: [
        {
          icon: lineSymbol,
          offset: "0",
          repeat: "20px",
        },
      ],
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, posA.lat, posA.lng, posB.lat, posB.lng]);

  return null;
}

// Controller component to center/fit map bounds
function MapController({
  posA,
  posB,
  triggerFit,
  centerOnUser,
}: {
  posA: { lat: number; lng: number };
  posB: { lat: number; lng: number };
  triggerFit: number;
  centerOnUser: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (centerOnUser) {
      map.panTo(centerOnUser);
      map.setZoom(13);
      return;
    }

    if (window.google?.maps?.LatLngBounds) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(posA);
      bounds.extend(posB);
      map.fitBounds(bounds, { top: 70, bottom: 70, left: 70, right: 70 });
    }
  }, [map, triggerFit, centerOnUser]);

  return null;
}

export const CoupleMap: React.FC<CoupleMapProps> = ({
  state,
  activeUser,
  onUpdateLocation,
  onSendPing,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isAutoWatching, setIsAutoWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [selectedMarkerUser, setSelectedMarkerUser] = useState<UserRole | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [pingHearts, setPingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Manual city search state
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualCityInput, setManualCityInput] = useState("");
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  const meKey = activeUser === "User_A" ? "user_a" : "user_b";
  const partnerKey = activeUser === "User_A" ? "user_b" : "user_a";

  const myProfile = state.users[meKey];
  const partnerProfile = state.users[partnerKey];

  // Default coordinates if location not yet shared
  const locA = state.users.user_a.location || {
    lat: 37.7749,
    lng: -122.4194,
    updated_at: new Date().toISOString(),
    city_or_place: "San Francisco, CA",
    battery_level: 88,
    is_sharing: true,
  };

  const locB = state.users.user_b.location || {
    lat: 51.5074,
    lng: -0.1278,
    updated_at: new Date().toISOString(),
    city_or_place: "London, UK",
    battery_level: 92,
    is_sharing: true,
  };

  const distanceInfo = calculateDistance(locA.lat, locA.lng, locB.lat, locB.lng);
  const timeDiffHours = estimateTimeDiffHours(locA.lng, locB.lng);

  // Get Battery Level helper
  const getBatteryLevel = async (): Promise<number | undefined> => {
    try {
      if ("getBattery" in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round((battery.level || 1) * 100);
      }
    } catch (e) {
      console.warn("Battery API unavailable:", e);
    }
    return undefined;
  };

  // Reverse Geocode helper (BigDataCloud Free reverse geocode API)
  const getCityName = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const country = data.countryName;
        if (city && country) return `${city}, ${country}`;
        if (city) return city;
      }
    } catch (e) {
      console.warn("Reverse geocode notice:", e);
    }
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  };

  // Update current user location via GPS
  const handleUpdateCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    const battery = await getBatteryLevel();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const city_or_place = await getCityName(lat, lng);

        onUpdateLocation({
          lat,
          lng,
          city_or_place,
          battery_level: battery,
          updated_at: new Date().toISOString(),
          is_sharing: true,
        });

        setPanTarget({ lat, lng });
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        alert(`Could not fetch GPS location: ${err.message}. You can also type your city manually below.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Toggle Live Auto Tracking
  const toggleAutoTracking = () => {
    if (isAutoWatching) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsAutoWatching(false);
    } else {
      if (!navigator.geolocation) return;
      setIsAutoWatching(true);
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const city_or_place = await getCityName(lat, lng);
          const battery = await getBatteryLevel();

          onUpdateLocation({
            lat,
            lng,
            city_or_place,
            battery_level: battery,
            updated_at: new Date().toISOString(),
            is_sharing: true,
          });
        },
        (err) => console.warn("Watch position error:", err),
        { enableHighAccuracy: true }
      );
      setWatchId(id);
    }
  };

  // Handle Manual City Search
  const handleManualCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCityInput.trim()) return;

    setIsLocating(true);
    setSearchNotice(null);

    try {
      // Nominatim OpenStreetMap Geocoding endpoint
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualCityInput.trim())}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const city_or_place = data[0].display_name.split(",").slice(0, 2).join(",");

          onUpdateLocation({
            lat,
            lng,
            city_or_place,
            updated_at: new Date().toISOString(),
            is_sharing: true,
          });

          setPanTarget({ lat, lng });
          setShowManualSearch(false);
          setManualCityInput("");
        } else {
          setSearchNotice("City not found. Please try another name.");
        }
      }
    } catch (err) {
      console.error("City lookup error:", err);
      setSearchNotice("Failed to look up city.");
    } finally {
      setIsLocating(false);
    }
  };

  // Trigger Ping animation
  const handleTriggerLovePing = () => {
    onSendPing();
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
    }));
    setPingHearts(newHearts);
    setTimeout(() => setPingHearts([]), 2500);
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // If no valid Google Maps API Key provided, display Constitution-compliant setup screen
  if (!hasValidKey) {
    return (
      <div className="min-h-[600px] w-full flex items-center justify-center p-4 bg-[#0D071E] text-white">
        <div className="max-w-xl w-full bg-white/5 border border-pink-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30">
            <Globe className="w-8 h-8 text-white animate-pulse" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
              Google Maps API Key Required
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              To unlock the real-time couple map, distance calculator, and live GPS sharing, please add a Google Maps Platform key.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-left space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-pink-300 font-semibold text-sm">
              <Key className="w-4 h-4 text-pink-400" />
              <span>Easy Setup Instructions:</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Get a free API key from{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 underline hover:text-pink-300 font-medium"
                >
                  Google Maps Console
                </a>
              </li>
              <li>
                Open <strong>Settings</strong> (⚙️ gear icon in the top-right corner of AI Studio) → <strong>Secrets</strong>
              </li>
              <li>
                Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, then press <strong>Enter</strong>
              </li>
              <li>Paste your Google Maps API key as the value, then press <strong>Enter</strong></li>
              <li>The application will build automatically and render the live couple map!</li>
            </ol>
          </div>

          <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-xs text-pink-300 flex items-center gap-2 justify-center">
            <ShieldCheck className="w-4 h-4 shrink-0 text-pink-400" />
            <span>Map automatically activates upon saving your key secret in AI Studio Settings.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24 text-white">
      {/* Top Banner & LDR Metrics Bar */}
      <div className="bg-gradient-to-r from-[#170B38] via-[#1A0E42] to-[#0E0626] border border-pink-500/30 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Floating animated love hearts when ping triggered */}
        {pingHearts.map((h) => (
          <div
            key={h.id}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            className="absolute z-50 animate-ping pointer-events-none text-rose-400"
          >
            <Heart className="w-8 h-8 fill-rose-500 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]" />
          </div>
        ))}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-2xl shadow-lg shadow-pink-500/20">
                <Compass className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
                Orbit Live Couple Map
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Real-time location sync, flight distance calculator, and love pings between{" "}
              <span className="text-pink-300 font-bold">{state.users.user_a.name}</span> &{" "}
              <span className="text-indigo-300 font-bold">{state.users.user_b.name}</span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUpdateCurrentLocation}
              disabled={isLocating}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-pink-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLocating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Navigation className="w-4 h-4 fill-white text-white" />
              )}
              <span>{isLocating ? "Locating GPS..." : "Update My GPS"}</span>
            </button>

            <button
              onClick={toggleAutoTracking}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                isAutoWatching
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              <Radio className={`w-4 h-4 ${isAutoWatching ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{isAutoWatching ? "Auto Live Tracking ON" : "Live Auto Tracking"}</span>
            </button>

            <button
              onClick={() => setShowManualSearch(!showManualSearch)}
              className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>Set City</span>
            </button>

            <button
              onClick={handleTriggerLovePing}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-400 animate-bounce" />
              <span>Send Love Ping ❤️</span>
            </button>
          </div>
        </div>

        {/* Manual City Lookup Modal Bar */}
        {showManualSearch && (
          <form
            onSubmit={handleManualCitySubmit}
            className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn"
          >
            <input
              type="text"
              placeholder="Type city name (e.g., Tokyo, Paris, New York)..."
              value={manualCityInput}
              onChange={(e) => setManualCityInput(e.target.value)}
              className="flex-1 w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={isLocating}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              Set My Location
            </button>
            {searchNotice && <span className="text-xs text-amber-300">{searchNotice}</span>}
          </form>
        )}

        {/* LDR Real-time Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Straight Line Distance
            </span>
            <div className="text-lg sm:text-xl font-black text-pink-300 font-mono mt-0.5">
              {distanceInfo.miles.toLocaleString()} mi
            </div>
            <span className="text-[10px] text-slate-400">{distanceInfo.km.toLocaleString()} km apart</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Timezone Offset
            </span>
            <div className="text-lg sm:text-xl font-black text-purple-300 font-mono mt-0.5">
              {timeDiffHours === 0
                ? "Same Time Zone"
                : `${Math.abs(timeDiffHours)} hr${Math.abs(timeDiffHours) > 1 ? "s" : ""} ${timeDiffHours > 0 ? "Ahead" : "Behind"}`}
            </div>
            <span className="text-[10px] text-slate-400">Sun & Moon Sync</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" /> {state.users.user_a.name}
            </span>
            <div className="text-xs font-bold text-slate-200 truncate mt-1">
              {locA.city_or_place || "Location set"}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              {locA.battery_level !== undefined && (
                <span className="flex items-center gap-0.5 text-emerald-300">
                  <Battery className="w-3 h-3 text-emerald-400" /> {locA.battery_level}%
                </span>
              )}
              <span>•</span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{new Date(locA.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> {state.users.user_b.name}
            </span>
            <div className="text-xs font-bold text-slate-200 truncate mt-1">
              {locB.city_or_place || "Location set"}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              {locB.battery_level !== undefined && (
                <span className="flex items-center gap-0.5 text-emerald-300">
                  <Battery className="w-3 h-3 text-emerald-400" /> {locB.battery_level}%
                </span>
              )}
              <span>•</span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{new Date(locB.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative h-[550px] w-full rounded-3xl overflow-hidden border border-pink-500/30 shadow-2xl bg-slate-950">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: (locA.lat + locB.lat) / 2, lng: (locA.lng + locB.lng) / 2 }}
            defaultZoom={3}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {/* Fit bounds and Pan controller */}
            <MapController
              posA={{ lat: locA.lat, lng: locA.lng }}
              posB={{ lat: locB.lat, lng: locB.lng }}
              triggerFit={fitTrigger}
              centerOnUser={panTarget}
            />

            {/* Connecting Polyline Arc */}
            <PartnerPolyline posA={{ lat: locA.lat, lng: locA.lng }} posB={{ lat: locB.lat, lng: locB.lng }} />

            {/* Marker User A */}
            <AdvancedMarker
              position={{ lat: locA.lat, lng: locA.lng }}
              onClick={() => setSelectedMarkerUser("User_A")}
            >
              <div className="relative group cursor-pointer active:scale-90 transition-transform">
                <div className="absolute -inset-2 bg-pink-500/40 rounded-full blur-md animate-pulse" />
                <div className="relative w-12 h-12 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-rose-600 border-2 border-white shadow-xl flex items-center justify-center">
                  {state.users.user_a.photo_url ? (
                    <img
                      src={state.users.user_a.photo_url}
                      alt={state.users.user_a.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black text-white uppercase">
                      {state.users.user_a.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow">
                    A
                  </span>
                </div>
                <div className="mt-1 bg-slate-900/95 text-pink-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-pink-500/40 shadow text-center whitespace-nowrap">
                  {state.users.user_a.name}
                </div>
              </div>
            </AdvancedMarker>

            {/* Marker User B */}
            <AdvancedMarker
              position={{ lat: locB.lat, lng: locB.lng }}
              onClick={() => setSelectedMarkerUser("User_B")}
            >
              <div className="relative group cursor-pointer active:scale-90 transition-transform">
                <div className="absolute -inset-2 bg-indigo-500/40 rounded-full blur-md animate-pulse" />
                <div className="relative w-12 h-12 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-white shadow-xl flex items-center justify-center">
                  {state.users.user_b.photo_url ? (
                    <img
                      src={state.users.user_b.photo_url}
                      alt={state.users.user_b.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black text-white uppercase">
                      {state.users.user_b.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow">
                    B
                  </span>
                </div>
                <div className="mt-1 bg-slate-900/95 text-indigo-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/40 shadow text-center whitespace-nowrap">
                  {state.users.user_b.name}
                </div>
              </div>
            </AdvancedMarker>

            {/* InfoWindow for Selected Partner */}
            {selectedMarkerUser && (
              <InfoWindow
                position={
                  selectedMarkerUser === "User_A"
                    ? { lat: locA.lat, lng: locA.lng }
                    : { lat: locB.lat, lng: locB.lng }
                }
                onCloseClick={() => setSelectedMarkerUser(null)}
              >
                <div className="p-2 max-w-xs text-slate-900 font-sans">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedMarkerUser === "User_A" ? "bg-pink-500" : "bg-indigo-500"
                      }`}
                    />
                    <strong className="text-sm font-bold">
                      {selectedMarkerUser === "User_A" ? state.users.user_a.name : state.users.user_b.name}
                    </strong>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {selectedMarkerUser}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-1">
                    📍{" "}
                    {selectedMarkerUser === "User_A"
                      ? locA.city_or_place || "Coordinates set"
                      : locB.city_or_place || "Coordinates set"}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-0.5 bg-slate-50 p-2 rounded-lg">
                    <div>
                      Mood:{" "}
                      <strong>
                        {selectedMarkerUser === "User_A" ? state.users.user_a.mood : state.users.user_b.mood}
                      </strong>
                    </div>
                    <div>
                      Last Action:{" "}
                      <span>
                        {selectedMarkerUser === "User_A"
                          ? state.users.user_a.last_action
                          : state.users.user_b.last_action}
                      </span>
                    </div>
                    <div>
                      Updated:{" "}
                      <span>
                        {new Date(
                          selectedMarkerUser === "User_A" ? locA.updated_at : locB.updated_at
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleTriggerLovePing();
                      setSelectedMarkerUser(null);
                    }}
                    className="mt-2.5 w-full py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs rounded-lg shadow hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Send Love Heart</span>
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* Quick Floating Controls overlay on Map */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[#0E0626]/90 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => {
                setPanTarget(null);
                setFitTrigger((prev) => prev + 1);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-pink-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Fit both partners in map frame"
            >
              <Compass className="w-3.5 h-3.5 text-pink-400" />
              <span>Fit Both</span>
            </button>

            <button
              onClick={() => {
                const myLoc = activeUser === "User_A" ? locA : locB;
                setPanTarget({ lat: myLoc.lat, lng: myLoc.lng });
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-purple-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Focus map on my position"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>Focus Me</span>
            </button>

            <button
              onClick={() => {
                const partnerLoc = activeUser === "User_A" ? locB : locA;
                setPanTarget({ lat: partnerLoc.lat, lng: partnerLoc.lng });
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Focus map on partner position"
            >
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              <span>Focus {partnerProfile.name.split(" ")[0]}</span>
            </button>
          </div>
        </APIProvider>
      </div>
    </div>
  );
};

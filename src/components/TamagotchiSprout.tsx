import React, { useState } from "react";
import { TamagotchiState, UserRole, UserProfile, MinigameType } from "../types";
import { Utensils, Smile, Zap, Heart, Sparkles, Gamepad2, Moon, Edit3, Check, HeartHandshake, UserCheck, Shirt, Palette, ShieldCheck } from "lucide-react";
import darkHoodieImg from "../assets/skins/dark_hoodie.jpg";
import kissHoodieImg from "../assets/skins/kiss_hoodie.jpg";

interface TamagotchiSproutProps {
  tamagotchi: TamagotchiState;
  userA: UserProfile;
  userB: UserProfile;
  activeUser: UserRole;
  onDirectAction: (actionType: "feed_sprout" | "play_sprout" | "rest_sprout" | "pet_sprout") => void;
  onSetMood: (mood: string, customStatus?: string) => void;
  onChangeSkin?: (skinId: string) => void;
  onOpenMinigame?: (type: MinigameType) => void;
  isLoading: boolean;
}

const MOOD_PRESETS = [
  { label: "🥰 Missing You", value: "Missing You" },
  { label: "✨ Excited", value: "Excited" },
  { label: "☕ Cozy", value: "Cozy" },
  { label: "😴 Sleepy", value: "Sleepy" },
  { label: "💖 Needs Hugs", value: "Needs Hugs" },
  { label: "🍲 Hungry", value: "Hungry" },
  { label: "🥳 Happy", value: "Happy" },
];

const SKINS_CATALOG = [
  {
    id: "sprout",
    name: "Classic Sprout 🌱",
    tagline: "Original Interactive Pet",
    description: "The adorable green sprout pet with reactive mood eyes and leaf cap.",
    type: "svg",
  },
  {
    id: "dark_hoodie",
    name: "Chibi Dark Hoodie ✨",
    tagline: "Custom Sticker Skin",
    description: "Cute dark skin tone chibi character wearing a charcoal hoodie & navy jeans.",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    fallbackUrl: "/skins/dark_hoodie.jpg",
    type: "image",
  },
  {
    id: "kiss_hoodie",
    name: "Chibi KISS Rock Hoodie 🎸",
    tagline: "Custom Sticker Skin",
    description: "Tan skin tone chibi character with fluffy black hair & KISS rock band hoodie.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    fallbackUrl: "/skins/kiss_hoodie.jpg",
    type: "image",
  },
];

export const TamagotchiSprout: React.FC<TamagotchiSproutProps> = ({
  tamagotchi,
  userA,
  userB,
  activeUser,
  onDirectAction,
  onSetMood,
  onChangeSkin,
  onOpenMinigame,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"care" | "skins">("care");
  const [actionEffect, setActionEffect] = useState<string | null>(null);
  const [isEditingMood, setIsEditingMood] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const me = activeUser === "User_A" ? userA : userB;
  const partner = activeUser === "User_A" ? userB : userA;
  const partnerFirstName = partner.name.split(" ")[0];
  const myFirstName = me.name.split(" ")[0];

  const currentSkinId = tamagotchi.selected_skin || "sprout";

  const handleCareAction = (type: "feed_sprout" | "play_sprout" | "rest_sprout" | "pet_sprout") => {
    let effectText = "❤️";
    if (type === "feed_sprout") effectText = `🍎 Fed ${partnerFirstName}!`;
    if (type === "play_sprout") effectText = `🎾 Played with ${partnerFirstName}!`;
    if (type === "rest_sprout") effectText = `💤 Tucked ${partnerFirstName} in!`;
    if (type === "pet_sprout") effectText = `💖 Petted & cuddled ${partnerFirstName}!`;

    setActionEffect(effectText);
    setTimeout(() => setActionEffect(null), 2000);

    onDirectAction(type);
  };

  const handleSaveMood = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalMood = selectedMood || me.mood || "Happy";
    onSetMood(finalMood, customStatusInput.trim() || undefined);
    setIsEditingMood(false);
    setCustomStatusInput("");
  };

  const handleSelectSkin = (skinId: string) => {
    if (onChangeSkin) {
      onChangeSkin(skinId);
    }
    setActionEffect(`✨ Equipped ${SKINS_CATALOG.find((s) => s.id === skinId)?.name}!`);
    setTimeout(() => setActionEffect(null), 2500);
  };

  // Face state logic based on partner's mood & stats
  let faceState = "happy";
  if (partner.mood?.toLowerCase().includes("sleep") || tamagotchi.energy < 35) {
    faceState = "sleepy";
  } else if (partner.mood?.toLowerCase().includes("hungr") || tamagotchi.hunger < 35) {
    faceState = "hungry";
  } else if (partner.mood?.toLowerCase().includes("excit") || tamagotchi.happiness > 80) {
    faceState = "ecstatic";
  }

  return (
    <div id="tamagotchi-sprout-card" className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-pink-300 border border-pink-500/40 flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_rgba(236,72,153,0.25)]">
            {currentSkinId === "kiss_hoodie" ? "🎸" : currentSkinId === "dark_hoodie" ? "✨" : "🌱"}
          </div>
          <div>
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <span>Partner Pet: {partnerFirstName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                Caring for {partnerFirstName}
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              {partnerFirstName}'s current status: <span className="text-pink-300 font-semibold">{partner.mood || "Happy"}</span>
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMood(!isEditingMood)}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>Set My Mood</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Care & Stats vs Skins Gallery */}
      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 max-w-sm">
        <button
          onClick={() => setActiveTab("care")}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === "care"
              ? "bg-pink-500/30 text-pink-200 border border-pink-500/40 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-pink-400" />
          <span>Care & Play</span>
        </button>

        <button
          onClick={() => setActiveTab("skins")}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === "skins"
              ? "bg-purple-500/30 text-purple-200 border border-purple-500/40 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Shirt className="w-4 h-4 text-purple-400" />
          <span>Skins Gallery ({SKINS_CATALOG.length})</span>
        </button>
      </div>

      {/* Mood Setting Collapsible Form */}
      {isEditingMood && (
        <form onSubmit={handleSaveMood} className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Update My Status for {partnerFirstName}</span>
            </span>
            <span className="text-[10px] text-slate-400">Updates Sprout & Partner Sync</span>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1.5">Quick Mood Preset</label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_PRESETS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedMood === m.value || (me.mood === m.value && !selectedMood)
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md"
                      : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Custom Message / Status for Sprout</label>
            <input
              type="text"
              value={customStatusInput}
              onChange={(e) => setCustomStatusInput(e.target.value)}
              placeholder={`e.g. Thinking of ${partnerFirstName} and missing your warm hugs!`}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingMood(false)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Broadcast Mood to {partnerFirstName}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: CARE & PLAY */}
      {activeTab === "care" && (
        <>
          {/* Main Character Showcase Container */}
          <div className="flex flex-col items-center justify-center py-6 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden">
            {/* Floating Action Effect Overlay */}
            {actionEffect && (
              <div className="absolute top-3 z-20 animate-bounce bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-xl border border-pink-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{actionEffect}</span>
              </div>
            )}

            {/* Partner Speech Bubble */}
            <div className="relative mb-3 max-w-sm px-5 py-3 bg-white/10 backdrop-blur-md text-slate-100 rounded-2xl text-xs sm:text-sm text-center border border-white/15 shadow-xl">
              <p className="font-medium text-pink-200">
                {partnerFirstName}: <span className="italic text-white">"{tamagotchi.status_message}"</span>
              </p>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 border-r border-b border-white/15 transform rotate-45" />
            </div>

            {/* Avatar Render: Custom Image Skin or Classic SVG Sprout */}
            <div
              onClick={() => handleCareAction("pet_sprout")}
              className="relative w-36 h-36 flex items-center justify-center my-2 cursor-pointer group"
              title={`Click to cuddle ${partnerFirstName}!`}
            >
              <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-2xl animate-pulse group-hover:bg-pink-400/30 transition-all" />

              {currentSkinId === "dark_hoodie" || currentSkinId === "kiss_hoodie" ? (
                <div className={`relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-pink-400/60 shadow-[0_0_25px_rgba(236,72,153,0.4)] group-hover:scale-105 transition-all duration-300 bg-black/60 ${actionEffect ? "animate-bounce" : ""}`}>
                  <img
                    src={imageErrors[currentSkinId] ? (currentSkinId === "dark_hoodie" ? "/skins/dark_hoodie.jpg" : "/skins/kiss_hoodie.jpg") : (currentSkinId === "dark_hoodie" ? darkHoodieImg : kissHoodieImg)}
                    alt="Chibi Partner Skin"
                    className="w-full h-full object-contain p-1"
                    onError={() => setImageErrors((prev) => ({ ...prev, [currentSkinId]: true }))}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-pink-500/80 text-white font-bold text-[9px] px-2 py-0.5 rounded-full border border-pink-300 flex items-center gap-1 shadow">
                    <Sparkles className="w-2.5 h-2.5" /> Custom Skin
                  </div>
                </div>
              ) : (
                <svg
                  viewBox="0 0 100 100"
                  className={`w-28 h-28 drop-shadow-[0_10px_20px_rgba(236,72,153,0.4)] transform transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                    actionEffect ? "animate-bounce" : ""
                  }`}
                >
                  {/* Leaf Headpiece */}
                  <path
                    d="M 50 22 C 40 10 25 18 35 28 C 45 35 50 25 50 25 C 50 25 55 35 65 28 C 75 18 60 10 50 22 Z"
                    fill="#34d399"
                  />
                  <path d="M 50 22 L 50 35" stroke="#059669" strokeWidth="3" strokeLinecap="round" />

                  {/* Body */}
                  <circle cx="50" cy="62" r="28" fill="#10b981" />
                  <ellipse cx="50" cy="86" rx="20" ry="5" fill="rgba(0,0,0,0.4)" />

                  {/* Rosy Cheeks */}
                  <circle cx="38" cy="66" r="4" fill="#f43f5e" opacity="0.7" />
                  <circle cx="62" cy="66" r="4" fill="#f43f5e" opacity="0.7" />

                  {/* Eyes */}
                  {faceState === "sleepy" ? (
                    <>
                      <path d="M 38 60 Q 42 64 46 60" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                      <path d="M 54 60 Q 58 64 62 60" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                    </>
                  ) : faceState === "hungry" ? (
                    <>
                      <circle cx="42" cy="60" r="3" fill="#064e3b" />
                      <circle cx="58" cy="60" r="3" fill="#064e3b" />
                      <path d="M 44 68 Q 50 64 56 68" stroke="#064e3b" strokeWidth="2" fill="none" />
                    </>
                  ) : (
                    <>
                      <circle cx="42" cy="59" r="3.5" fill="#064e3b" />
                      <circle cx="58" cy="59" r="3.5" fill="#064e3b" />
                      <circle cx="43.5" cy="57.5" r="1" fill="#ffffff" />
                      <circle cx="59.5" cy="57.5" r="1" fill="#ffffff" />
                      <path d="M 45 66 Q 50 71 55 66" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </>
                  )}
                </svg>
              )}
            </div>

            <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white font-semibold">
                {partnerFirstName}'s Mood: {partner.mood || "Happy"}
              </span>
              <span className="text-pink-400 text-[11px] hover:underline cursor-pointer" onClick={() => handleCareAction("pet_sprout")}>
                (Tap to cuddle!)
              </span>
            </div>
          </div>

          {/* Stat Progress Bars for Partner Sprout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hunger */}
            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-300 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" /> Food & Care
                </span>
                <span className="font-mono text-slate-300">{tamagotchi.hunger} / 100</span>
              </div>
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  style={{ width: `${tamagotchi.hunger}%` }}
                />
              </div>
            </div>

            {/* Happiness */}
            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-300 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5" /> Joy & Happiness
                </span>
                <span className="font-mono text-slate-300">{tamagotchi.happiness} / 100</span>
              </div>
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-rose-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,113,133,0.5)]"
                  style={{ width: `${tamagotchi.happiness}%` }}
                />
              </div>
            </div>

            {/* Energy */}
            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Energy & Sleep
                </span>
                <span className="font-mono text-slate-300">{tamagotchi.energy} / 100</span>
              </div>
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${tamagotchi.energy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Direct Interactive Tamagotchi Care Buttons */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-pink-400" />
              <span>Care Actions for {partnerFirstName}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleCareAction("feed_sprout")}
                disabled={isLoading}
                className="p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 border border-amber-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md group"
              >
                <Utensils className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Feed {partnerFirstName}</span>
                <span className="text-[10px] text-amber-300/80 font-mono font-normal">+25 Hunger</span>
              </button>

              <button
                onClick={() => handleCareAction("play_sprout")}
                disabled={isLoading}
                className="p-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-200 border border-rose-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md group"
              >
                <Smile className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Play Game</span>
                <span className="text-[10px] text-rose-300/80 font-mono font-normal">+25 Joy</span>
              </button>

              <button
                onClick={() => handleCareAction("rest_sprout")}
                disabled={isLoading}
                className="p-3.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-200 border border-sky-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md group"
              >
                <Moon className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Tuck In Nap</span>
                <span className="text-[10px] text-sky-300/80 font-mono font-normal">+35 Energy</span>
              </button>

              <button
                onClick={() => handleCareAction("pet_sprout")}
                disabled={isLoading}
                className="p-3.5 rounded-2xl bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 text-pink-200 border border-pink-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md group"
              >
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400 group-hover:scale-110 transition-transform" />
                <span>Pet & Cuddle</span>
                <span className="text-[10px] text-pink-300/80 font-mono font-normal">+15 Love</span>
              </button>
            </div>

            {/* Minigame arcade option */}
            {onOpenMinigame && (
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={() => onOpenMinigame("feed")}
                  className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors underline underline-offset-2"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Optional: Play minigames together for extra affection points</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: SKINS GALLERY */}
      {activeTab === "skins" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h4 className="font-bold text-base text-purple-200 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <span>Character & Sticker Skins</span>
              </h4>
              <p className="text-xs text-slate-300">Choose how Sprout appears to both you and {partnerFirstName}</p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
              Active: {SKINS_CATALOG.find((s) => s.id === currentSkinId)?.name || "Classic Sprout"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SKINS_CATALOG.map((skin) => {
              const isEquipped = currentSkinId === skin.id;
              return (
                <div
                  key={skin.id}
                  className={`bg-black/50 rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isEquipped
                      ? "border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "border-white/10 hover:border-purple-500/40"
                  }`}
                >
                  {isEquipped && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <ShieldCheck className="w-3 h-3" /> Equipped
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Skin Preview Box */}
                    <div className="aspect-square w-full rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-2 overflow-hidden relative">
                      {skin.type === "image" ? (
                        <img
                          src={imageErrors[skin.id] ? skin.fallbackUrl : skin.imageUrl}
                          alt={skin.name}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          onError={() => setImageErrors((prev) => ({ ...prev, [skin.id]: true }))}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
                            <path d="M 50 22 C 40 10 25 18 35 28 C 45 35 50 25 50 25 C 50 25 55 35 65 28 C 75 18 60 10 50 22 Z" fill="#34d399" />
                            <circle cx="50" cy="62" r="28" fill="#10b981" />
                            <circle cx="42" cy="59" r="3.5" fill="#064e3b" />
                            <circle cx="58" cy="59" r="3.5" fill="#064e3b" />
                            <path d="M 45 66 Q 50 71 55 66" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold text-sm text-white">{skin.name}</h5>
                      <p className="text-[10px] text-purple-300 font-semibold">{skin.tagline}</p>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{skin.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectSkin(skin.id)}
                    disabled={isEquipped || isLoading}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                      isEquipped
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                        : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white active:scale-95"
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Equipped</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Wear Skin</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

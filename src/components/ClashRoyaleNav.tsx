import React from "react";
import { Users, Image, Sparkles, Lock, Mail, Crown, MapPin } from "lucide-react";

export type NavTabType = "partner" | "memories" | "pet" | "vault" | "letters" | "map";

interface ClashRoyaleNavProps {
  currentTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  memoryCount?: number;
  vaultCount?: number;
  letterCount?: number;
  partnerFirstName?: string;
}

export const ClashRoyaleNav: React.FC<ClashRoyaleNavProps> = ({
  currentTab,
  onSelectTab,
  memoryCount = 0,
  vaultCount = 0,
  letterCount = 0,
  partnerFirstName = "Partner",
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
      {/* Clash Royale Textured Gold/Metallic Frame Container */}
      <div className="relative bg-gradient-to-b from-[#1E113A]/95 via-[#130A29]/98 to-[#090315] border-t-2 border-amber-500/50 backdrop-blur-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.85)] px-2 sm:px-4 py-1.5 sm:py-2">
        {/* Golden metallic accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-600/20 via-amber-400 to-amber-600/20 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

        <div className="max-w-md mx-auto flex items-end justify-between relative px-1">
          {/* TAB 1: PARTNER */}
          <button
            onClick={() => onSelectTab("partner")}
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all relative rounded-2xl active:scale-95 ${
              currentTab === "partner"
                ? "text-amber-300 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {/* Active Indicator Pillar */}
            {currentTab === "partner" && (
              <div className="absolute -top-2.5 w-8 h-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" />
            )}

            <div
              className={`p-2 rounded-2xl transition-all ${
                currentTab === "partner"
                  ? "bg-gradient-to-b from-amber-500/30 to-amber-700/30 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === "partner" ? "text-amber-300" : "text-slate-400"}`} />
            </div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-1">
              Partner
            </span>
          </button>

          {/* TAB 2: MEMORIES */}
          <button
            onClick={() => onSelectTab("memories")}
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all relative rounded-2xl active:scale-95 ${
              currentTab === "memories"
                ? "text-sky-300 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {currentTab === "memories" && (
              <div className="absolute -top-2.5 w-8 h-1 bg-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
            )}

            <div
              className={`p-2 rounded-2xl transition-all relative ${
                currentTab === "memories"
                  ? "bg-gradient-to-b from-sky-500/30 to-sky-700/30 border border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-110"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <Image className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === "memories" ? "text-sky-300" : "text-slate-400"}`} />
              {memoryCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                  {memoryCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-1">
              Memories
            </span>
          </button>

          {/* TAB 3: PET / SPROUT (PROMINENT CENTER CLASH ROYALE BATTLE BUTTON) */}
          <div className="relative -top-4 px-1">
            <button
              onClick={() => onSelectTab("pet")}
              className={`relative group flex flex-col items-center justify-center transition-all active:scale-90 ${
                currentTab === "pet" ? "scale-105" : "hover:scale-105"
              }`}
            >
              {/* Golden Battle Crown / Crown Ornament */}
              <div className="absolute -top-3 z-20 flex items-center justify-center bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 p-1 rounded-full border border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-bounce">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
              </div>

              {/* Main Outer Raised Battle Ring */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-[3px] shadow-[0_8px_25px_rgba(245,158,11,0.6)] border-2 border-amber-200">
                <div
                  className={`w-full h-full rounded-[20px] flex flex-col items-center justify-center transition-all ${
                    currentTab === "pet"
                      ? "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-800 text-white shadow-inner"
                      : "bg-gradient-to-b from-slate-800 via-slate-900 to-emerald-950 text-emerald-300"
                  }`}
                >
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-amber-200 font-mono drop-shadow">
                    SPROUT
                  </span>
                </div>
              </div>

              {/* Center Tab Label */}
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold mt-1 ${
                currentTab === "pet" ? "text-emerald-300" : "text-slate-300"
              }`}>
                Partner Pet
              </span>
            </button>
          </div>

          {/* TAB 4: VAULT */}
          <button
            onClick={() => onSelectTab("vault")}
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all relative rounded-2xl active:scale-95 ${
              currentTab === "vault"
                ? "text-purple-300 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {currentTab === "vault" && (
              <div className="absolute -top-2.5 w-8 h-1 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(192,132,252,0.9)] animate-pulse" />
            )}

            <div
              className={`p-2 rounded-2xl transition-all relative ${
                currentTab === "vault"
                  ? "bg-gradient-to-b from-purple-500/30 to-purple-700/30 border border-purple-400/60 shadow-[0_0_15px_rgba(192,132,252,0.3)] scale-110"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <Lock className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === "vault" ? "text-purple-300" : "text-slate-400"}`} />
              {vaultCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                  {vaultCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-1">
              Vault
            </span>
          </button>

          {/* TAB 5: LETTERS */}
          <button
            onClick={() => onSelectTab("letters")}
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all relative rounded-2xl active:scale-95 ${
              currentTab === "letters"
                ? "text-rose-300 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {currentTab === "letters" && (
              <div className="absolute -top-2.5 w-8 h-1 bg-rose-400 rounded-full shadow-[0_0_10px_rgba(251,113,133,0.9)] animate-pulse" />
            )}

            <div
              className={`p-2 rounded-2xl transition-all relative ${
                currentTab === "letters"
                  ? "bg-gradient-to-b from-rose-500/30 to-rose-700/30 border border-rose-400/60 shadow-[0_0_15px_rgba(251,113,133,0.3)] scale-110"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <Mail className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === "letters" ? "text-rose-300" : "text-slate-400"}`} />
              {letterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                  {letterCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-1">
              Letters
            </span>
          </button>

          {/* TAB 6: MAP */}
          <button
            onClick={() => onSelectTab("map")}
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all relative rounded-2xl active:scale-95 ${
              currentTab === "map"
                ? "text-emerald-300 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {currentTab === "map" && (
              <div className="absolute -top-2.5 w-8 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            )}

            <div
              className={`p-2 rounded-2xl transition-all relative ${
                currentTab === "map"
                  ? "bg-gradient-to-b from-emerald-500/30 to-emerald-700/30 border border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.3)] scale-110"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === "map" ? "text-emerald-300" : "text-slate-400"}`} />
            </div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-1">
              Live Map
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { CountdownState, UserProfile, UserRole } from "../types";
import { Calendar, Sparkles, Heart, Edit3, X, Check, Users, Clock, Flame, Smile, ShieldCheck } from "lucide-react";

interface PartnerTabProps {
  countdown: CountdownState;
  userA: UserProfile;
  userB: UserProfile;
  activeUser: UserRole;
  onUpdateTargetDate: (newTargetDateStr: string) => void;
  onSetMood: (mood: string, customStatus?: string) => void;
  isLoading: boolean;
}

export const PartnerTab: React.FC<PartnerTabProps> = ({
  countdown,
  userA,
  userB,
  activeUser,
  onUpdateTargetDate,
  onSetMood,
  isLoading,
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  
  // Format target date for date input (YYYY-MM-DD)
  const initialDateVal = countdown.target_date
    ? new Date(countdown.target_date).toISOString().split("T")[0]
    : "2026-09-16";

  const [dateInputVal, setDateInputVal] = useState(initialDateVal);
  const [moodInput, setMoodInput] = useState("");

  const activeProfile = activeUser === "User_A" ? userA : userB;
  const partnerProfile = activeUser === "User_A" ? userB : userA;

  const formattedTargetDate = countdown.target_date
    ? new Date(countdown.target_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "September 16, 2026";

  const totalLdrDays = 259;
  const daysPassed = Math.max(0, totalLdrDays - countdown.days_remaining);
  const progressPercent = Math.min(100, Math.round((daysPassed / totalLdrDays) * 100));

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInputVal) return;
    // Append time to ensure valid ISO string
    const isoDate = new Date(`${dateInputVal}T00:00:00Z`).toISOString();
    onUpdateTargetDate(isoDate);
    setIsEditingDate(false);
  };

  const handleCancelEdit = () => {
    setDateInputVal(initialDateVal);
    setIsEditingDate(false);
  };

  const handleApplyPreset = (daysToAdd: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    const dateStr = futureDate.toISOString().split("T")[0];
    setDateInputVal(dateStr);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Reunion Countdown & Configurator */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 text-white shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>Reunion Target: {formattedTargetDate}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Partner Reunion Countdown</span>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </h2>
            </div>

            <button
              onClick={() => setIsEditingDate(!isEditingDate)}
              disabled={isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 text-purple-200 border border-purple-500/40 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-pink-400" />
              <span>Configure Target Date</span>
            </button>
          </div>

          {/* Date Configuration Form (When Active) */}
          {isEditingDate && (
            <div className="p-5 rounded-3xl bg-black/60 border-2 border-pink-500/40 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-400" />
                  <h3 className="font-bold text-sm text-white">Configure Countdown Date</h3>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select New Reunion / Meeting Date
                  </label>
                  <input
                    type="date"
                    value={dateInputVal}
                    onChange={(e) => setDateInputVal(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-pink-500/40 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-400 font-mono shadow-inner"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">Quick Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(30)}
                      className="px-3 py-1 bg-white/5 hover:bg-pink-500/20 text-xs text-pink-200 border border-white/10 rounded-xl"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(60)}
                      className="px-3 py-1 bg-white/5 hover:bg-pink-500/20 text-xs text-pink-200 border border-white/10 rounded-xl"
                    >
                      +60 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(90)}
                      className="px-3 py-1 bg-white/5 hover:bg-pink-500/20 text-xs text-pink-200 border border-white/10 rounded-xl"
                    >
                      +90 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateInputVal("2026-09-16")}
                      className="px-3 py-1 bg-white/5 hover:bg-pink-500/20 text-xs text-pink-200 border border-white/10 rounded-xl"
                    >
                      Sept 16, 2026
                    </button>
                  </div>
                </div>

                {/* Action Buttons Row with EXPLICIT CANCEL BUTTON */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save New Target Date</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Countdown Clock Display */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            {/* Days */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-5xl font-black text-pink-400 font-mono tracking-tight">
                {countdown.days_remaining}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-5xl font-black text-purple-400 font-mono tracking-tight">
                {String(countdown.hours_remaining).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
                {String(countdown.minutes_remaining ?? 0).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
                Minutes
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
                <span>Reunion Journey Progress</span>
              </span>
              <span className="text-pink-300 font-bold font-mono">{progressPercent}% Completed</span>
            </div>
            <div className="w-full bg-black/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Partner Connection & Live Status Card */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">Partner Profiles & Mood Sync</h3>
              <p className="text-xs text-slate-300">Live connection state between you and your partner</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User A Card */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              activeUser === "User_A"
                ? "bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/50 shadow-xl"
                : "bg-black/30 border-white/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md border border-indigo-400/30">
                  {userA.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{userA.name}</span>
                    {activeUser === "User_A" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                    <Smile className="w-3.5 h-3.5" />
                    <span>Mood: {userA.mood}</span>
                  </p>
                  {userA.location?.city_or_place && (
                    <p className="text-[11px] text-pink-300 flex items-center gap-1 mt-0.5">
                      <span>📍 Location: {userA.location.city_or_place}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Action:</span>
              </span>
              <span className="text-slate-200 font-medium">{userA.last_action}</span>
            </div>
          </div>

          {/* User B Card */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              activeUser === "User_B"
                ? "bg-gradient-to-br from-pink-950/60 to-rose-950/60 border-pink-500/50 shadow-xl"
                : "bg-black/30 border-white/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-bold text-lg text-white shadow-md border border-pink-400/30">
                  {userB.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{userB.name}</span>
                    {activeUser === "User_B" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-500/40">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-pink-300 flex items-center gap-1 mt-0.5">
                    <Smile className="w-3.5 h-3.5" />
                    <span>Mood: {userB.mood}</span>
                  </p>
                  {userB.location?.city_or_place && (
                    <p className="text-[11px] text-purple-300 flex items-center gap-1 mt-0.5">
                      <span>📍 Location: {userB.location.city_or_place}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Action:</span>
              </span>
              <span className="text-slate-200 font-medium">{userB.last_action}</span>
            </div>
          </div>
        </div>

        {/* Quick Mood Broadcast for Active User */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Set Your Current Mood ({activeProfile.name})
          </label>
          <div className="flex flex-wrap gap-2">
            {["Loved 🥰", "Cozy ☕", "Missing You 🥺", "Excited 🚀", "Sleepy 😴"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSetMood(m)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-pink-500/20 text-xs text-slate-200 rounded-xl border border-white/10 hover:border-pink-500/40 transition-all active:scale-95"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

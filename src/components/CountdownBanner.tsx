import React from "react";
import { CountdownState } from "../types";
import { Calendar, Sparkles, Heart } from "lucide-react";

interface CountdownBannerProps {
  countdown: CountdownState;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({ countdown }) => {
  const totalLdrDays = 259;
  const daysPassed = Math.max(0, totalLdrDays - countdown.days_remaining);
  const progressPercent = Math.min(100, Math.round((daysPassed / totalLdrDays) * 100));

  return (
    <div id="reunion-countdown-banner" className="relative overflow-hidden rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 text-white shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Title and Target Info */}
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>Target Reunion: September 16, 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
            <span>Reunion Countdown</span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Counting down every second until we wrap our arms around each other again.
          </p>
        </div>

        {/* Counter Displays */}
        <div className="flex items-center gap-3 sm:gap-4 text-center">
          {/* Days */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[76px] sm:min-w-[90px] shadow-lg">
            <span className="text-3xl sm:text-4xl font-black text-pink-400 tracking-tight font-mono">
              {countdown.days_remaining}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              Days
            </span>
          </div>

          <span className="text-2xl font-bold text-slate-500">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[76px] sm:min-w-[90px] shadow-lg">
            <span className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight font-mono">
              {String(countdown.hours_remaining).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              Hours
            </span>
          </div>

          <span className="text-2xl font-bold text-slate-500">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[76px] sm:min-w-[90px] shadow-lg">
            <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
              {String(countdown.minutes_remaining ?? 0).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              Mins
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
            <span>Distance Journey Progress</span>
          </span>
          <span className="text-pink-300 font-bold font-mono">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

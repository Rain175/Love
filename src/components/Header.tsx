import React, { useState } from "react";
import { UserRole, OrbitState } from "../types";
import { User } from "firebase/auth";
import { Heart, ShieldCheck, Copy, Check, Users, KeyRound, LogOut } from "lucide-react";

interface HeaderProps {
  activeUser: UserRole;
  onUserSwitch: (role: UserRole) => void;
  onOpenOnboarding: () => void;
  onLeaveRoom: () => void;
  state: OrbitState;
  roomCode: string | null;
  user: User | null;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onUserSwitch,
  onOpenOnboarding,
  onLeaveRoom,
  state,
  roomCode,
  user,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0518]/80 backdrop-blur-2xl border-b border-white/10 px-4 py-3 text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Room Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 shadow-lg shadow-pink-500/20">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
                Orbit
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Live LDR
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Live Database Engine</span>
            </p>
          </div>

          {/* Room Code Pill & Leave Room Button */}
          {roomCode ? (
            <div className="ml-2 flex items-center gap-1.5">
              <button
                onClick={copyRoomCode}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full text-xs font-mono font-semibold text-pink-300 flex items-center gap-1.5 transition-all active:scale-95 shadow"
                title="Click to copy room code"
              >
                <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                <span>Room: {roomCode}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                onClick={onLeaveRoom}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-full text-xs font-medium flex items-center gap-1 transition-all active:scale-95 shadow cursor-pointer"
                title="Leave current room"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Leave Room</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenOnboarding}
              className="ml-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Link Partner</span>
            </button>
          )}
        </div>

        {/* Active Partner Identity Badge (Locked to authenticated user) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <div className="bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2 shadow-inner">
            <div className={`w-2.5 h-2.5 rounded-full ${activeUser === "User_A" ? "bg-pink-400" : "bg-indigo-400"}`} />
            <span className="text-xs font-bold text-white">
              {activeUser === "User_A" ? state.users.user_a.name : state.users.user_b.name}
            </span>
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
              {activeUser === "User_A" ? "Partner A" : "Partner B"}
            </span>
          </div>

          {/* Partner Link / Room Settings */}
          <button
            onClick={onOpenOnboarding}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            title="Manage Partner Code & Account"
          >
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Partner Link</span>
          </button>
        </div>
      </div>
    </header>
  );
};


import React, { useState } from "react";
import { User } from "firebase/auth";
import { logoutUser } from "../lib/firebase";
import { Sparkles, KeyRound, Copy, Check, LogOut, ArrowRight, ShieldCheck, HeartHandshake, Users } from "lucide-react";

interface RoomGateProps {
  user: User;
  onJoinRoom: (code: string) => Promise<boolean>;
  onCreateRoom: (partnerName?: string) => Promise<string>;
}

export const RoomGate: React.FC<RoomGateProps> = ({ user, onJoinRoom, onCreateRoom }) => {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inputCode, setInputCode] = useState("");
  const [partnerNameInput, setPartnerNameInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await onCreateRoom(partnerNameInput.trim());
    } catch (err) {
      setErrorMsg("Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await onJoinRoom(inputCode.trim().toUpperCase());
      if (!success) {
        setErrorMsg("Room code not found. Please verify with your partner and try again.");
      }
    } catch (err) {
      setErrorMsg("Error joining room. Please check your network or code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0518] text-white flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/30 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-violet-500 p-0.5 mx-auto shadow-2xl shadow-pink-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#0A0518] rounded-[22px] flex items-center justify-center">
              <HeartHandshake className="w-8 h-8 text-pink-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-widest uppercase">
            Connect Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">Orbit Room</span>
          </h2>
          <p className="text-xs text-slate-300">
            Create a new room for you and your partner, or join using an existing code.
          </p>
        </div>

        {/* User Profile Info Pill */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-9 h-9 rounded-full border border-pink-400/50 shadow"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user.displayName || user.email || "Logged in User"}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Authenticated
              </p>
            </div>
          </div>

          <button
            onClick={() => logoutUser()}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors text-xs flex items-center gap-1"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[10px]">Sign Out</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Room Choice Flow */}
        <div className="space-y-4">
          {mode === "choose" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode("create")}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-pink-500/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-white block">Create Orbit Room</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Generate a room code to invite partner</span>
                </div>
              </button>

              <button
                onClick={() => setMode("join")}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-white block">Link Partner Code</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Enter room code shared by partner</span>
                </div>
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Partner's Name (Optional)
                </label>
                <input
                  type="text"
                  value={partnerNameInput}
                  onChange={(e) => setPartnerNameInput(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-medium"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {loading ? "Generating Code..." : "Create Room & Enter"}
                </button>
              </div>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoinSubmit} className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter Partner's 6-Character Room Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ORB123"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-pink-300 placeholder-slate-600 focus:outline-none focus:border-pink-500 uppercase"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {loading ? "Linking..." : "Link Partner & Connect"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

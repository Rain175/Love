import React, { useState } from "react";
import { User } from "firebase/auth";
import { signInWithGoogle, logoutUser } from "../lib/firebase";
import { Sparkles, Heart, Users, KeyRound, Copy, Check, LogOut, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";

interface OnboardingModalProps {
  user: User | null;
  roomCode: string | null;
  onJoinRoom: (code: string) => Promise<boolean>;
  onCreateRoom: (partnerName?: string) => Promise<string>;
  onCompleteOnboarding: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  roomCode,
  onJoinRoom,
  onCreateRoom,
  onCompleteOnboarding,
}) => {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inputCode, setInputCode] = useState("");
  const [partnerNameInput, setPartnerNameInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Sign in failed. You can proceed with standard partner setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const newCode = await onCreateRoom(partnerNameInput.trim());
      setMode("choose");
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
      if (success) {
        onCompleteOnboarding();
      } else {
        setErrorMsg("Room code not found. Check with your partner and try again.");
      }
    } catch (err) {
      setErrorMsg("Error joining room. Please verify the code.");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Mesh Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[350px] h-[350px] bg-purple-900 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-900 rounded-full blur-[120px] opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6 my-auto">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 p-0.5 mx-auto shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center">
            <div className="w-full h-full bg-[#0A0518]/80 rounded-full flex items-center justify-center">
              <HeartHandshake className="w-8 h-8 text-pink-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-widest uppercase">
            Welcome to <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">Orbit</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            A private, encrypted real-time space for two hearts staying connected in orbit.
          </p>
        </div>

        {/* Step 1: Google Auth Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center gap-3 overflow-hidden">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-10 h-10 rounded-full border border-pink-400/50 shadow"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                  {user.displayName?.[0] || user.email?.[0] || "U"}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {user.displayName || "Logged in User"}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Google Account Sync
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">Sign in with Google</p>
                <p className="text-[10px] text-slate-400">Sync live stats & memories</p>
              </div>
            </div>
          )}

          {!user ? (
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => logoutUser()}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors text-xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step 2: Room Linking Section */}
        {roomCode ? (
          /* Active Linked Room Card */
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-pink-500/30 rounded-2xl p-5 space-y-4 text-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300">
                Your Shared Orbit Room
              </span>
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="font-mono text-3xl font-extrabold tracking-widest text-white bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                  {roomCode}
                </span>
                <button
                  onClick={copyCodeToClipboard}
                  className="p-3 bg-white/10 hover:bg-white/20 text-pink-300 rounded-xl border border-white/10 transition-all active:scale-95"
                  title="Copy Link Code"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Share code <code className="text-pink-300 font-bold font-mono">{roomCode}</code> with your partner so they can enter this room from their device!
            </p>

            <button
              onClick={onCompleteOnboarding}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Enter Orbit Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Room Choice/Create/Join Flow */
          <div className="space-y-4">
            {mode === "choose" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("create")}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-pink-500/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-white block">Create Orbit Room</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Generate a code to invite partner</span>
                  </div>
                </button>

                <button
                  onClick={() => setMode("join")}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-white block">Link Partner Code</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Enter code shared by partner</span>
                  </div>
                </button>
              </div>
            )}

            {mode === "create" && (
              <form onSubmit={handleCreateSubmit} className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Partner's Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    placeholder="e.g. Sam"
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
                    {loading ? "Generating Code..." : "Create Room & Get Code"}
                  </button>
                </div>
              </form>
            )}

            {mode === "join" && (
              <form onSubmit={handleJoinSubmit} className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Enter Partner's 6-Character Orbit Code
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
        )}

        <div className="text-center pt-2">
          <button
            onClick={onCompleteOnboarding}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-4"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

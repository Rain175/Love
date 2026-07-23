import React, { useState } from "react";
import { auth, signInWithGoogle, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../lib/firebase";
import { Heart, Sparkles, ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Globe } from "lucide-react";

interface AuthGateProps {
  onSuccess?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<"google" | "email_login" | "email_signup">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setUnauthorizedDomain(true);
        setErrorMsg("This domain is not authorized in Firebase Console.");
      } else if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in popup closed before completion. Please try again.");
      } else {
        setErrorMsg(err?.message || "Google Sign-In failed. Try Email & Password login below.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(false);

    try {
      if (authMode === "email_signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setUnauthorizedDomain(true);
        setErrorMsg("Domain authorization required in Firebase Console.");
      } else if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password. Please check your credentials.");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("An account with this email already exists. Try logging in instead.");
      } else if (err?.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters long.");
      } else {
        setErrorMsg(err?.message || "Authentication failed. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "your-domain.vercel.app";

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0518] text-white flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/30 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Orbit Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 p-0.5 mx-auto shadow-2xl shadow-pink-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#0A0518] rounded-[22px] flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
                Orbit
              </h1>
              <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Private Real-Time Space for Long-Distance Couples
            </p>
          </div>
        </div>

        {/* Security / Sign In Notice */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Sign in required to access your encrypted couple room and live pet.</span>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Authentication Notice</span>
            </div>
            <p className="leading-relaxed">{errorMsg}</p>

            {unauthorizedDomain && (
              <div className="pt-2 border-t border-rose-500/30 text-[11px] text-rose-100 space-y-2">
                <p className="font-semibold text-amber-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Vercel Deployment Domain Authorization:</span>
                </p>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300 text-[10px]">Your Vercel domain:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentDomain);
                        alert(`Copied "${currentDomain}" to clipboard!`);
                      }}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Copy Domain</span>
                    </button>
                  </div>
                  <code className="block bg-black/60 px-2 py-1 rounded font-mono text-amber-300 text-[11px] break-all select-all">
                    {currentDomain}
                  </code>
                </div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <p className="font-semibold text-slate-200">How to fix in 30 seconds:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-pink-300 underline font-semibold">Firebase Console</a> (Project: <strong className="text-white">orbit-love-68a0a</strong>)</li>
                    <li>Click <strong className="text-white">Authentication</strong> → <strong className="text-white">Settings</strong> → <strong className="text-white">Authorized domains</strong></li>
                    <li>Click <strong className="text-white">Add domain</strong> and paste <code className="text-amber-300 font-mono">{currentDomain}</code></li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Sign-In Buttons & Form */}
        <div className="space-y-4">
          {/* Primary Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Signing in..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email / Password Options */}
          {authMode === "google" ? (
            <button
              onClick={() => setAuthMode("email_login")}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-medium text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-pink-400" />
              <span>Sign in with Email & Password</span>
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3 bg-black/40 border border-white/10 p-4 rounded-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-pink-300">
                  {authMode === "email_signup" ? "Create Orbit Account" : "Email Sign In"}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthMode("google")}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{loading ? "Processing..." : authMode === "email_signup" ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-1">
                {authMode === "email_login" ? (
                  <button
                    type="button"
                    onClick={() => setAuthMode("email_signup")}
                    className="text-[11px] text-pink-300 hover:underline"
                  >
                    Don't have an account? Sign Up
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode("email_login")}
                    className="text-[11px] text-pink-300 hover:underline"
                  >
                    Already have an account? Sign In
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 border-t border-white/10 pt-4">
          <span>Protected by Firebase E2E encrypted room database</span>
        </div>
      </div>
    </div>
  );
};

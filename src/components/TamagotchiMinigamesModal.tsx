import React, { useState, useEffect, useRef } from "react";
import { MinigameType } from "../types";
import { X, Heart, Sparkles, Utensils, Moon, Smile, Trophy, Zap, RefreshCw } from "lucide-react";

interface MinigameModalProps {
  type: MinigameType;
  sproutName: string;
  onClose: () => void;
  onGameWin: (actionType: MinigameType, statDeltas: { hunger?: number; happiness?: number; energy?: number }) => void;
}

export const TamagotchiMinigamesModal: React.FC<MinigameModalProps> = ({
  type,
  sproutName,
  onClose,
  onGameWin,
}) => {
  const [gameState, setGameState] = useState<"ready" | "playing" | "won">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loveMeter, setLoveMeter] = useState(0);
  
  // Game 1: Catching falling items
  const [fallingItems, setFallingItems] = useState<{ id: number; x: number; y: number; icon: string; speed: number }[]>([]);
  const [sproutPos, setSproutPos] = useState(50); // percentage

  // Game 2: Heart Pop
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; dx: number; dy: number; size: number }[]>([]);

  // Game 3: Star constellation
  const [stars, setStars] = useState<{ id: number; x: number; y: number; active: boolean; tapped: boolean }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Targets
  const targetScore = type === "feed" ? 5 : type === "play" ? 6 : type === "rest" ? 5 : 100;

  // Initialize Minigame
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(15);
    setLoveMeter(0);

    if (type === "feed") {
      // Spawn falling items loop
      setFallingItems([]);
    } else if (type === "play") {
      // Spawn initial floating hearts
      const initialHearts = Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5,
        size: Math.floor(Math.random() * 20) + 40,
      }));
      setHearts(initialHearts);
    } else if (type === "rest") {
      // Spawn constellations
      const initialStars = [
        { id: 1, x: 20, y: 30, active: true, tapped: false },
        { id: 2, x: 45, y: 20, active: false, tapped: false },
        { id: 3, x: 75, y: 35, active: false, tapped: false },
        { id: 4, x: 35, y: 65, active: false, tapped: false },
        { id: 5, x: 80, y: 70, active: false, tapped: false },
      ];
      setStars(initialStars);
    }
  };

  // Timer Effect for Feed & Play
  useEffect(() => {
    if (gameState !== "playing") return;
    if (type === "pet") return; // Pet uses love meter holding/tapping

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, type]);

  // Feed Game Animation Loop
  useEffect(() => {
    if (gameState !== "playing" || type !== "feed") return;

    const interval = setInterval(() => {
      // Move items down
      setFallingItems((prev) => {
        const updated = prev
          .map((item) => ({ ...item, y: item.y + item.speed }))
          .filter((item) => item.y < 95);

        // Spawn new item if needed
        if (Math.random() < 0.4 && updated.length < 5) {
          const icons = ["🍎", "🍓", "🍉", "🫐", "💧", "🌟"];
          updated.push({
            id: Date.now() + Math.random(),
            x: Math.random() * 80 + 10,
            y: 0,
            icon: icons[Math.floor(Math.random() * icons.length)],
            speed: Math.random() * 1.5 + 1.2,
          });
        }
        return updated;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [gameState, type]);

  // Play Game Animation Loop (Bouncing hearts)
  useEffect(() => {
    if (gameState !== "playing" || type !== "play") return;

    const interval = setInterval(() => {
      setHearts((prev) =>
        prev.map((h) => {
          let nx = h.x + h.dx;
          let ny = h.y + h.dy;
          let ndx = h.dx;
          let ndy = h.dy;

          if (nx <= 5 || nx >= 85) ndx *= -1;
          if (ny <= 10 || ny >= 80) ndy *= -1;

          return { ...h, x: nx, y: ny, dx: ndx, dy: ndy };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, type]);

  // Check Win Condition
  useEffect(() => {
    if (gameState === "playing") {
      if (type === "feed" && score >= targetScore) {
        handleWin();
      } else if (type === "play" && score >= targetScore) {
        handleWin();
      } else if (type === "rest" && score >= targetScore) {
        handleWin();
      } else if (type === "pet" && loveMeter >= 100) {
        handleWin();
      }
    }
  }, [score, loveMeter, gameState, type]);

  const handleCatchItem = (id: number) => {
    setFallingItems((prev) => prev.filter((item) => item.id !== id));
    setScore((prev) => prev + 1);
  };

  const handlePopHeart = (id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
    setScore((prev) => prev + 1);
  };

  const handleTapStar = (id: number) => {
    setStars((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, tapped: true } : s));
      const nextStar = updated.find((s) => !s.tapped);
      if (nextStar) {
        nextStar.active = true;
      }
      return updated;
    });
    setScore((prev) => prev + 1);
  };

  const handlePetSprout = () => {
    if (gameState !== "playing") return;
    setLoveMeter((prev) => Math.min(100, prev + 12));
  };

  const handleWin = () => {
    setGameState("won");
    let deltas = {};
    if (type === "feed") deltas = { hunger: 25, happiness: 10 };
    if (type === "play") deltas = { happiness: 25, energy: -10 };
    if (type === "rest") deltas = { energy: 35, hunger: -10 };
    if (type === "pet") deltas = { happiness: 15 };

    onGameWin(type, deltas);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Container with Frosted Glass Styling */}
      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 text-white shadow-2xl flex flex-col items-center justify-between min-h-[460px] overflow-hidden">
        
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {type === "feed" && <Utensils className="w-5 h-5 text-emerald-400" />}
            {type === "play" && <Smile className="w-5 h-5 text-pink-400" />}
            {type === "rest" && <Moon className="w-5 h-5 text-indigo-400" />}
            {type === "pet" && <Heart className="w-5 h-5 text-rose-400" />}
            <span className="font-semibold text-sm uppercase tracking-wider text-slate-200">
              {type === "feed" && "Catch Treats"}
              {type === "play" && "Pop Playful Hearts"}
              {type === "rest" && "Star Lullaby"}
              {type === "pet" && "Love Headpats"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Arena / Viewport */}
        <div
          ref={containerRef}
          className="relative w-full h-[280px] my-4 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center select-none"
        >
          {gameState === "ready" && (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-3xl shadow-lg">
                {type === "feed" && "🍓"}
                {type === "play" && "💖"}
                {type === "rest" && "✨"}
                {type === "pet" && "🌱"}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {type === "feed" && `Feed ${sproutName}`}
                  {type === "play" && `Play with ${sproutName}`}
                  {type === "rest" && `Tuck in ${sproutName}`}
                  {type === "pet" && `Pet ${sproutName}`}
                </h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  {type === "feed" && "Catch falling delicious treats before time runs out!"}
                  {type === "play" && "Tap bouncing hearts to cheer up Sprout!"}
                  {type === "rest" && "Tap the sparkling constellation stars to play a lullaby."}
                  {type === "pet" && "Tap Sprout repeatedly to fill the Love Meter!"}
                </p>
              </div>

              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                Start Minigame
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full h-full relative">
              {/* Top Status Bar in Arena */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20 pointer-events-none">
                <div className="px-3 py-1 bg-black/60 border border-white/10 rounded-full text-xs font-mono font-semibold text-pink-300">
                  {type === "pet" ? `Love: ${loveMeter}%` : `Score: ${score}/${targetScore}`}
                </div>
                {type !== "pet" && (
                  <div className="px-3 py-1 bg-black/60 border border-white/10 rounded-full text-xs font-mono text-amber-300">
                    ⏱️ {timeLeft}s
                  </div>
                )}
              </div>

              {/* Feed Minigame */}
              {type === "feed" && (
                <>
                  {fallingItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleCatchItem(item.id)}
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      className="absolute p-2 text-2xl animate-bounce hover:scale-125 transition-transform cursor-pointer"
                    >
                      {item.icon}
                    </button>
                  ))}
                  {/* Sprout Character at Bottom */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl animate-pulse">
                    🌱
                  </div>
                </>
              )}

              {/* Play Minigame */}
              {type === "play" && (
                <>
                  {hearts.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handlePopHeart(h.id)}
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      className="absolute p-2 text-3xl transition-transform active:scale-75 hover:scale-110 cursor-pointer drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    >
                      💖
                    </button>
                  ))}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl">
                    🐶
                  </div>
                </>
              )}

              {/* Rest Minigame */}
              {type === "rest" && (
                <div className="w-full h-full relative bg-gradient-to-b from-indigo-950/80 to-black/60">
                  {stars.map((s) => (
                    <button
                      key={s.id}
                      disabled={s.tapped || !s.active}
                      onClick={() => handleTapStar(s.id)}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      className={`absolute p-3 rounded-full border transition-all ${
                        s.tapped
                          ? "bg-amber-400 text-amber-100 border-amber-300 scale-110"
                          : s.active
                          ? "bg-amber-400/30 text-amber-300 border-amber-400 animate-ping cursor-pointer hover:scale-125"
                          : "bg-white/5 border-white/10 text-slate-600 opacity-50"
                      }`}
                    >
                      ✨
                    </button>
                  ))}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl opacity-80">
                    💤 🌱
                  </div>
                </div>
              )}

              {/* Pet Minigame */}
              {type === "pet" && (
                <div
                  onClick={handlePetSprout}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none space-y-4"
                >
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-pink-500/10 border-2 border-pink-400/40 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-transform active:scale-90 group-hover:scale-105">
                      🌱
                    </div>
                    {/* Heart Floating Particles */}
                    <div className="absolute -top-2 right-0 text-xl animate-bounce">💗</div>
                    <div className="absolute top-1/2 -left-4 text-xl animate-pulse">💕</div>
                  </div>

                  {/* Love Progress Bar */}
                  <div className="w-3/4 bg-black/60 border border-white/10 h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${loveMeter}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-pink-300 font-medium">
                    Tap Sprout's head to give love!
                  </p>
                </div>
              )}
            </div>
          )}

          {gameState === "won" && (
            <div className="text-center p-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-300">Minigame Complete!</h3>
                <p className="text-xs text-slate-300">
                  {sproutName} loved playing with you! Sprout's stats have synced live to your Orbit Room.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                Back to Orbit
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-[10px] text-slate-400 text-center font-light">
          Winning minigames instantly updates Sprout's live state in Firestore!
        </p>
      </div>
    </div>
  );
};

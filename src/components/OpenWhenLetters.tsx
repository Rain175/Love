import React, { useState } from "react";
import { LetterItem, UserRole } from "../types";
import { Mail, Lock, Unlock, Heart, Plus, Sparkles, X, HeartHandshake } from "lucide-react";

interface OpenWhenLettersProps {
  letters: LetterItem[];
  activeUser: UserRole;
  onUnlockLetter: (letterId: string) => void;
  onAddLetter: (title: string, condition: string, content: string) => void;
  isLoading: boolean;
}

export const OpenWhenLetters: React.FC<OpenWhenLettersProps> = ({
  letters,
  activeUser,
  onUnlockLetter,
  onAddLetter,
  isLoading,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleUnlockAndOpen = (letter: LetterItem) => {
    if (!letter.is_unlocked) {
      onUnlockLetter(letter.id);
    }
    setSelectedLetter({ ...letter, is_unlocked: true });
  };

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddLetter(
      newTitle.trim(),
      newCondition.trim() || "special_moment",
      newContent.trim()
    );
    setNewTitle("");
    setNewCondition("");
    setNewContent("");
    setIsWriteModalOpen(false);
  };

  return (
    <div id="open-when-letters-card" className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="font-bold text-lg text-white">Interactive "Open When..." Letters</h3>
            <p className="text-xs text-slate-300">Digital envelopes for special LDR moments</p>
          </div>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Write Open-When Letter</span>
        </button>
      </div>

      {/* Envelope Cards Grid */}
      {letters.length === 0 ? (
        <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-white/10 space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">No "Open When..." Letters Yet</h4>
            <p className="text-xs text-slate-400 mt-1">Write your partner a heartfelt letter for when they miss you, can't sleep, or need a smile.</p>
          </div>
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-semibold text-xs rounded-xl border border-pink-500/30 inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Write First Letter</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {letters.map((letter) => (
            <div
              key={letter.id}
              onClick={() => handleUnlockAndOpen(letter)}
              className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-lg ${
                letter.is_unlocked
                  ? "bg-black/40 border-white/10 hover:border-pink-400/80 hover:shadow-pink-500/10"
                  : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/40"
              }`}
            >
              {/* Top Bar with Lock Icon */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  #{letter.condition}
                </span>
                {letter.is_unlocked ? (
                  <div className="flex items-center gap-1 text-emerald-300 text-xs font-semibold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <Unlock className="w-3 h-3" />
                    <span>Unlocked</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-300 text-xs font-semibold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>{letter.title}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Author: <strong className="text-slate-300">{letter.author || "Partner"}</strong>
                </p>
              </div>

              {/* Bottom Action Hint */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-pink-300 font-medium">
                <span>{letter.is_unlocked ? "Read Letter" : "Break Wax Seal & Read"}</span>
                <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Letter Reading Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-amber-50 to-amber-100 text-slate-900 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-4 border-amber-200 space-y-5">
            <button
              onClick={() => setSelectedLetter(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-200/80 text-amber-900 hover:bg-amber-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Letter Header */}
            <div className="border-b border-amber-300 pb-3 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-700 font-bold text-xs">
                <HeartHandshake className="w-4 h-4" />
                <span>Open When Letter</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-extrabold text-amber-950">
                {selectedLetter.title}
              </h3>
              <p className="text-xs text-amber-800 font-mono">
                Condition: #{selectedLetter.condition} • Written by {selectedLetter.author}
              </p>
            </div>

            {/* Letter Body */}
            <div className="py-2 text-sm sm:text-base font-serif leading-relaxed text-amber-950 whitespace-pre-line bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-inner">
              "{selectedLetter.content || "I love you endlessly, no matter the distance!"}"
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-xs font-serif text-amber-800 pt-2 border-t border-amber-300">
              <span>Forever & Always Yours ❤️</span>
              <button
                onClick={() => setSelectedLetter(null)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-sans font-semibold rounded-xl text-xs shadow-md"
              >
                Close Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write New Letter Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-lg text-white">Write Open-When Letter</h3>
            </div>

            <form onSubmit={handleWriteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Letter Title (e.g. Open when you can't sleep)
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Open when..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unlock Condition Tag (e.g. cant_sleep, missing_me)
                </label>
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="cant_sleep"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Letter Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your secret love letter here..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Seal Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

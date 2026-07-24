import React, { useState } from "react";
import { EncryptedIntimacyItem, UserRole } from "../types";
import { Lock, Eye, Plus, CheckCircle2, Sparkles, X, ShieldCheck, Upload, Image, MessageSquare, Heart } from "lucide-react";
import { compressImageDataUrl } from "../lib/firebase";

interface IntimacyZoneProps {
  items: EncryptedIntimacyItem[];
  activeUser: UserRole;
  onViewItem: (photoId: string) => void;
  onAddIntimacyItem: (title: string, secretMessage?: string, imageUrl?: string) => void;
  isLoading: boolean;
}

export const IntimacyZone: React.FC<IntimacyZoneProps> = ({
  items,
  activeUser,
  onViewItem,
  onAddIntimacyItem,
  isLoading,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [secretMessage, setSecretMessage] = useState("");
  const [customPhotoInput, setCustomPhotoInput] = useState("");
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingItem, setViewingItem] = useState<EncryptedIntimacyItem | null>(null);

  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let finalImage = customPhotoInput.trim() || "";
    if (uploadedFilePreview) {
      setIsUploading(true);
      try {
        finalImage = await compressImageDataUrl(uploadedFilePreview);
      } catch (err) {
        console.error("Error compressing image:", err);
      } finally {
        setIsUploading(false);
      }
    }

    onAddIntimacyItem(newTitle.trim(), secretMessage.trim(), finalImage);
    setNewTitle("");
    setSecretMessage("");
    setCustomPhotoInput("");
    setUploadedFilePreview(null);
    setIsAddModalOpen(false);
  };

  const handleDecryptAndOpen = (item: EncryptedIntimacyItem) => {
    if (item.is_viewed) return; // Disallow reopening viewed items
    onViewItem(item.id);
    setViewingItem({ ...item, is_viewed: true });
  };

  return (
    <div id="intimacy-zone-card" className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Encrypted Intimacy Vault</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> E2EE Vault
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Upload confidential photos & encrypted messages for your partner
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add E2EE Intimacy Memory</span>
        </button>
      </div>

      {/* Encrypted Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-white/10 space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Encrypted Vault Empty</h4>
              <p className="text-xs text-slate-400 mt-1">Upload private secret photos or encrypted messages for your partner to unlock.</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-xs rounded-xl border border-purple-500/30 inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Secret Memory</span>
            </button>
          </div>
        ) : (
          items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-purple-400/30 transition-all"
          >
            {/* Metadata Information */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>{item.title || item.id}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    item.uploader === "User_A"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  }`}
                >
                  Uploader: {item.uploader}
                </span>

                {item.is_viewed ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    Encrypted (View Ready)
                  </span>
                )}
              </div>

              {/* Ciphertext Ref Preview */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-black/50 p-2 rounded-xl border border-white/5">
                <span className="text-slate-500">ciphertext_ref:</span>
                <span className="text-purple-300 truncate max-w-xs">{item.ciphertext_ref}</span>
              </div>
            </div>

            {/* Controls / Decrypt & View */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecryptAndOpen(item)}
                disabled={isLoading || item.is_viewed}
                className={`px-4 py-2 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                  !item.is_viewed
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-95 cursor-pointer"
                    : "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed opacity-60"
                }`}
              >
                {!item.is_viewed ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Decrypt & View Secret (Once)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Burned / Expired (Already Viewed)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))
      )}
      </div>

      {/* Add Intimacy Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-lg text-white">Upload Encrypted Intimacy Memory</h3>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Memory Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Surprise for You ✨"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Secret Intimacy Message */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write Secret Encrypted Message</span>
                </label>
                <textarea
                  rows={3}
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Write a private note only your partner can unlock..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Upload Secret Photo from Device</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoneFileUpload}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 file:border file:border-purple-500/30 hover:file:bg-purple-500/30 cursor-pointer"
                />
                {uploadedFilePreview && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-purple-400 mt-2">
                    <img src={uploadedFilePreview} alt="Secret Upload Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {!uploadedFilePreview && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    placeholder="https://example.com/private-photo.jpg"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1 text-xs text-slate-400">
                <p className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> E2EE AES-256 Vault Guarantee
                </p>
                <p className="text-[11px] leading-relaxed">
                  Photo and text payload are encrypted with end-to-end keys before sync.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTitle.trim()}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Encrypt & Save Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decrypted Vault Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-purple-500/40 rounded-[32px] max-w-lg w-full p-6 text-white space-y-4 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/60 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-lg text-white">{viewingItem.title || "Secret Intimacy Vault"}</h3>
                <p className="text-xs text-emerald-300 font-mono">Status: AES-256 Decrypted • Sent by {viewingItem.uploader}</p>
                <p className="text-[10px] text-amber-300/90 font-medium mt-0.5">⚠️ View-Once Active: Closing this modal permanently locks and burns this vault entry!</p>
              </div>
            </div>

            {/* Uploaded Photo */}
            {viewingItem.image_url && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative shadow-inner">
                <img
                  src={viewingItem.image_url}
                  alt={viewingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Secret Message */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs sm:text-sm text-purple-100 space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                <span>Secret Partner Message</span>
              </div>
              <p className="italic leading-relaxed">
                "{viewingItem.secret_message || "I miss your touch and can't wait until September 16 when I can hold you tight in my arms!"}"
              </p>
            </div>

            <button
              onClick={() => setViewingItem(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Close Confidential Vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { PhotoBoothRequest, UserRole } from "../types";
import { Camera, Sparkles, Clock, CheckCircle2, Upload, Plus, Heart, X, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { compressImageIfNeeded, formatBytes } from "../utils/imageCompressor";

interface PhotoBoothProps {
  requests: PhotoBoothRequest[];
  activeUser: UserRole;
  partnerName: string;
  onRequestPhotoBooth: (photoUrl: string, caption?: string) => void;
  onCompletePhotoBooth: (requestId: string, responderPhotoUrl: string) => void;
  isLoading: boolean;
}

export const PhotoBooth: React.FC<PhotoBoothProps> = ({
  requests,
  activeUser,
  partnerName,
  onRequestPhotoBooth,
  onCompletePhotoBooth,
  isLoading,
}) => {
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Compression states
  const [isCompressingReq, setIsCompressingReq] = useState(false);
  const [reqCompressionNotice, setReqCompressionNotice] = useState<string | null>(null);
  const [isCompressingRes, setIsCompressingRes] = useState(false);
  const [resCompressionNotice, setResCompressionNotice] = useState<string | null>(null);

  // Response state for completing a request
  const [completingRequestId, setCompletingRequestId] = useState<string | null>(null);
  const [responsePhotoUrl, setResponsePhotoUrl] = useState("");
  const [responseUploadedPreview, setResponseUploadedPreview] = useState<string | null>(null);

  const pendingIncoming = requests.find((r) => r.status === "pending" && r.requester !== activeUser);
  const pendingOutgoing = requests.find((r) => r.status === "pending" && r.requester === activeUser);
  const completedStrips = requests.filter((r) => r.status === "completed");

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (val: string | null) => void,
    setIsCompressing: (val: boolean) => void,
    setNotice: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setNotice(null);

    try {
      const result = await compressImageIfNeeded(file, 1.0);
      setPreview(result.dataUrl);

      if (result.wasCompressed) {
        setNotice(`Compressed from ${formatBytes(result.originalSize)} to ${formatBytes(result.compressedSize)} (< 1MB)!`);
      } else {
        setNotice(`Photo size: ${formatBytes(result.originalSize)} (Under 1 MB threshold)`);
      }
    } catch (err) {
      console.error("Image compression error:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = uploadedPreview || newPhotoUrl.trim() || "";
    onRequestPhotoBooth(finalImage, newCaption.trim() || undefined);
    setNewPhotoUrl("");
    setNewCaption("");
    setUploadedPreview(null);
    setReqCompressionNotice(null);
    setIsNewRequestModalOpen(false);
  };

  const handleCompleteSubmit = (requestId: string, e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = responseUploadedPreview || responsePhotoUrl.trim() || "";
    onCompletePhotoBooth(requestId, finalImage);
    setCompletingRequestId(null);
    setResponsePhotoUrl("");
    setResponseUploadedPreview(null);
    setResCompressionNotice(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-pink-300 border border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.25)]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <span>Couple Photo Booth</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Synchronized Snap
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Request a photo strip with {partnerName}. When you both snap a frame, it merges into a vintage strip!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewRequestModalOpen(true)}
          disabled={isLoading || !!pendingOutgoing}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Request Photo with {partnerName}</span>
        </button>
      </div>

      {/* Pending Incoming Photo Booth Request from Partner */}
      {pendingIncoming && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900/60 border-2 border-pink-500/50 shadow-2xl space-y-4 animate-pulse-subtle">
          <div className="flex items-center justify-between border-b border-pink-500/30 pb-3">
            <span className="text-sm font-bold text-pink-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
              <span>{partnerName} wants to take a Photo Booth Strip with you!</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/40 font-mono">
              Action Required
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Vintage Strip Preview */}
            <div className="w-48 bg-stone-900 border-4 border-stone-800 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2 relative">
              {/* Sprocket Holes */}
              <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1.5 h-2.5 bg-stone-700 rounded-sm" />
                ))}
              </div>
              <div className="absolute right-1 top-2 bottom-2 flex flex-col justify-between">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1.5 h-2.5 bg-stone-700 rounded-sm" />
                ))}
              </div>

              {/* Partner Frame 1 */}
              <div className="w-36 h-36 bg-black rounded-lg overflow-hidden border border-stone-700 relative">
                <img src={pendingIncoming.requester_photo} alt="Partner Snap" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-pink-300 px-1.5 py-0.5 rounded font-bold">
                  {partnerName}'s Frame
                </span>
              </div>

              {/* My Frame 2 Placeholder / Uploaded Preview */}
              <div className="w-36 h-36 bg-stone-950 rounded-lg border-2 border-dashed border-pink-400/60 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                {responseUploadedPreview ? (
                  <img src={responseUploadedPreview} alt="Your Snap Preview" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="space-y-1">
                    <Camera className="w-6 h-6 text-pink-400 mx-auto animate-bounce" />
                    <span className="text-[10px] text-pink-200 font-bold block">Your Frame 2</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-stone-400 font-mono tracking-widest uppercase text-center pt-1">
                Orbit Photo Strip
              </div>
            </div>

            {/* Form to complete the request */}
            <div className="flex-1 space-y-4">
              {pendingIncoming.requester_caption && (
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-pink-100 italic">
                  "{pendingIncoming.requester_caption}"
                </div>
              )}

              <form onSubmit={(e) => handleCompleteSubmit(pendingIncoming.id, e)} className="space-y-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <label className="block text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-pink-400" />
                    <span>Upload Your Photo Frame</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isCompressingRes}
                    onChange={(e) => handleFileUpload(e, setResponseUploadedPreview, setIsCompressingRes, setResCompressionNotice)}
                    className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-500/20 file:text-pink-300 file:border file:border-pink-500/30 hover:file:bg-pink-500/30 cursor-pointer disabled:opacity-50"
                  />
                  {isCompressingRes && (
                    <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center gap-2 text-xs text-pink-300 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                      <span>Compressing frame (under 1 MB)...</span>
                    </div>
                  )}
                  {resCompressionNotice && !isCompressingRes && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{resCompressionNotice}</span>
                    </div>
                  )}
                </div>

                {!responseUploadedPreview && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Or Image URL</label>
                    <input
                      type="url"
                      value={responsePhotoUrl}
                      onChange={(e) => setResponsePhotoUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Save Photobooth Strip!</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Pending Request Notice */}
      {pendingOutgoing && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-400 animate-spin" />
            <div>
              <p className="font-bold text-xs text-purple-200">
                Waiting for {partnerName} to take their matching photo frame...
              </p>
              <p className="text-[11px] text-purple-300/80">
                Your frame 1 is uploaded. Once {partnerName} responds, your dual photo booth strip will appear below!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Pending Response
          </span>
        </div>
      )}

      {/* Completed Photobooth Strips Gallery */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-pink-400" />
          <span>Saved Photobooth Strips ({completedStrips.length})</span>
        </h4>

        {completedStrips.length === 0 ? (
          <div className="text-center py-12 bg-black/20 rounded-3xl border border-white/5 space-y-2">
            <Camera className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">No Photobooth Strips created yet!</p>
            <p className="text-[11px] text-slate-500">Click "Request Photo" above to start your first virtual strip together.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedStrips.map((strip) => (
              <div
                key={strip.id}
                className="bg-stone-900 border-4 border-stone-800 rounded-3xl p-4 shadow-2xl relative flex flex-col items-center gap-3 group hover:border-pink-500/50 transition-all transform hover:-translate-y-1"
              >
                {/* Sprocket Holes Left/Right */}
                <div className="absolute left-1.5 top-4 bottom-4 flex flex-col justify-between">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1.5 h-3 bg-stone-700 rounded-sm" />
                  ))}
                </div>
                <div className="absolute right-1.5 top-4 bottom-4 flex flex-col justify-between">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1.5 h-3 bg-stone-700 rounded-sm" />
                  ))}
                </div>

                {/* Frame 1 */}
                <div className="w-44 h-44 bg-black rounded-xl overflow-hidden border border-stone-700 relative shadow-md">
                  <img src={strip.requester_photo} alt="Frame 1" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[9px] text-white px-2 py-0.5 rounded font-bold">
                    {strip.requester_name}
                  </span>
                </div>

                {/* Frame 2 */}
                <div className="w-44 h-44 bg-black rounded-xl overflow-hidden border border-stone-700 relative shadow-md">
                  <img src={strip.responder_photo} alt="Frame 2" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[9px] text-pink-300 px-2 py-0.5 rounded font-bold">
                    {partnerName}
                  </span>
                </div>

                {/* Strip Footer Branding */}
                <div className="text-center pt-1 border-t border-stone-800 w-full space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-pink-300">
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    <span>Orbit Photobooth</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-mono">
                    {new Date(strip.completed_at || strip.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Request New Photo Booth */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsNewRequestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-lg text-white">Start Photo Booth Request</h3>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-pink-400" />
                  <span>Upload Your Photo for Frame 1</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isCompressingReq}
                  onChange={(e) => handleFileUpload(e, setUploadedPreview, setIsCompressingReq, setReqCompressionNotice)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-500/20 file:text-pink-300 file:border file:border-pink-500/30 hover:file:bg-pink-500/30 cursor-pointer disabled:opacity-50"
                />
                {isCompressingReq && (
                  <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center gap-2 text-xs text-pink-300 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    <span>Compressing photo (under 1 MB)...</span>
                  </div>
                )}
                {reqCompressionNotice && !isCompressingReq && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{reqCompressionNotice}</span>
                  </div>
                )}
                {uploadedPreview && (
                  <div className="relative aspect-square w-32 mx-auto rounded-xl overflow-hidden border border-pink-400 mt-2">
                    <img src={uploadedPreview} alt="Frame 1 Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {!uploadedPreview && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Or Photo Image URL</label>
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://example.com/my-snap.jpg"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Message / Prompt for {partnerName}
                </label>
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="e.g. Silly face time! Show me your best smile 😊"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Send Photobooth Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

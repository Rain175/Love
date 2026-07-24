import React, { useState } from "react";
import { ScrapbookItem, UserRole } from "../types";
import { Image, Plus, Calendar, X, Sparkles, Upload, Check } from "lucide-react";

interface ScrapbookProps {
  items: ScrapbookItem[];
  activeUser: UserRole;
  onAddMemory: (caption: string, imageUrl?: string, tags?: string[]) => void;
  isLoading: boolean;
}

export const Scrapbook: React.FC<ScrapbookProps> = ({
  items,
  activeUser,
  onAddMemory,
  isLoading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [customPhotoInput, setCustomPhotoInput] = useState("");
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ScrapbookItem | null>(null);

  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  );

  const filteredItems = activeTagFilter
    ? items.filter((item) => item.tags?.includes(activeTagFilter))
    : items;

  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedFilePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    const finalUrl = uploadedFilePreview || customPhotoInput.trim() || "";
    const tagsArray = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    onAddMemory(caption.trim(), finalUrl, tagsArray.length > 0 ? tagsArray : ["memory"]);
    setCaption("");
    setCustomPhotoInput("");
    setUploadedFilePreview(null);
    setTagInput("");
    setIsModalOpen(false);
  };

  return (
    <div id="scrapbook-card" className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Image className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-lg text-white">Memories Scrapbook</h3>
            <p className="text-xs text-slate-300">Upload photos from your phone & save keepsake moments</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Phone Photo Memory</span>
        </button>
      </div>

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
          <button
            onClick={() => setActiveTagFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              activeTagFilter === null
                ? "bg-sky-500 text-white border-sky-400 shadow-sm"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            All ({items.length})
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTagFilter(t === activeTagFilter ? null : t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeTagFilter === t
                  ? "bg-sky-500 text-white border-sky-400 shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Photo Memory Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-black/30 rounded-3xl border border-dashed border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
            <Image className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">No Photo Memories Yet</h4>
            <p className="text-xs text-slate-400 mt-1">Upload a photo from your phone or device to save your first memory together.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold text-xs rounded-xl border border-sky-500/30 inline-flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload First Memory</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setViewingItem(item)}
              className="group relative bg-black/40 rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all cursor-pointer shadow-lg hover:shadow-sky-500/10 flex flex-col justify-between"
            >
              {/* Card Image */}
              <div className="aspect-video w-full overflow-hidden bg-black/60 relative">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-sky-400">
                    <Image className="w-8 h-8 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-md ${
                      item.author === "User_A"
                        ? "bg-pink-500/80 text-white border-pink-400"
                        : "bg-indigo-500/80 text-white border-indigo-400"
                    }`}
                  >
                    {item.author}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                  {item.caption}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <span className="text-sky-300 font-mono truncate max-w-[120px]">
                      #{item.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-lg text-white">Add Photo Memory</h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Memory Caption
                </label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Sunset video call & matching mugs 🌅"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Phone / Device Gallery Image Upload */}
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Upload Photo from Phone / Device</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoneFileUpload}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 file:border file:border-sky-500/30 hover:file:bg-sky-500/30 cursor-pointer"
                />
                {uploadedFilePreview && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-sky-400 mt-2">
                    <img src={uploadedFilePreview} alt="Phone Upload Preview" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 bg-emerald-500/90 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Photo Loaded from Phone
                    </span>
                  </div>
                )}
              </div>

              {!uploadedFilePreview && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Image URL
                  </label>
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="coffee, date_night, memories"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !caption.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Memory Viewer Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-[#0A0518]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] max-w-lg w-full overflow-hidden text-white shadow-2xl relative">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 p-2 rounded-full text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full bg-black/60 relative">
              <img
                src={viewingItem.image_url}
                alt={viewingItem.caption}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                  Uploaded by {viewingItem.author}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(viewingItem.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100">{viewingItem.caption}</p>

              {viewingItem.tags && viewingItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {viewingItem.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

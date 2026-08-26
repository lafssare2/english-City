import React, { useState } from "react";
import { PlayerProfile, WardrobeItem, Achievement } from "../types";
import { INITIAL_WARDROBE_ITEMS, INITIAL_ACHIEVEMENTS } from "../data/initialData";
import { sound } from "../utils/audioSynthesizer";
import confetti from "canvas-confetti";
import {
  Home,
  X,
  Shirt,
  Trophy,
  Coins,
  Sparkles,
  Check,
  Lock,
  Flame,
  Award,
  Palette,
} from "lucide-react";

interface PlayerHomeModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onUpdatePlayer: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const PlayerHomeModal: React.FC<PlayerHomeModalProps> = ({
  player,
  onClose,
  onUpdatePlayer,
}) => {
  const [activeTab, setActiveTab] = useState<"loft" | "wardrobe" | "trophies">("wardrobe");

  // Buy or Equip Wardrobe item
  const handleItemAction = (item: WardrobeItem) => {
    const isUnlocked = item.purchased || player.wardrobe?.some((w) => w.id === item.id && w.purchased);
    const isEquipped = item.equipped || player.wardrobe?.some((w) => w.id === item.id && w.equipped);

    if (isEquipped) return;

    if (isUnlocked) {
      // Equip item
      sound.playClick();
      onUpdatePlayer((prev) => ({
        ...prev,
        wardrobe: prev.wardrobe.map((w) => ({
          ...w,
          equipped: w.category === item.category ? w.id === item.id : w.equipped,
        })),
      }));
    } else {
      // Check if player has enough coins
      if (player.coins < item.price) {
        alert("Not enough English Coins! Complete dialogue missions to earn more.");
        return;
      }

      sound.playCoin();
      try {
        confetti({ particleCount: 30 });
      } catch (_) {}

      onUpdatePlayer((prev) => ({
        ...prev,
        coins: prev.coins - item.price,
        wardrobe: prev.wardrobe.map((w) =>
          w.id === item.id
            ? { ...w, purchased: true, equipped: true }
            : w.category === item.category
            ? { ...w, equipped: false }
            : w
        ),
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Home className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Player Loft & Wardrobe</span>
                <span className="text-xs font-arabic text-amber-300">
                  (شقة اللاعب والخزانة)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customize your avatar appearance, spend English Coins, and view trophies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins indicator */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono-code text-amber-300">
                {player.coins} Coins
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("wardrobe");
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "wardrobe"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Wardrobe Shop & Outfits
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("trophies");
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "trophies"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Trophy Showcase & Stats
          </button>
        </div>

        {/* Main Tab View Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "wardrobe" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Avatar Preview */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl ring-4 ring-purple-500/40"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.avatarStyle === "explorer" ? "🧭" : "🎓"}
                </div>

                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg text-white">
                    {player.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    Immersion Level: {player.level}
                  </span>
                </div>

                {/* Avatar Color Picker */}
                <div className="flex items-center gap-2 mt-2">
                  {["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        sound.playClick();
                        onUpdatePlayer((prev) => ({ ...prev, avatarColor: color }));
                      }}
                      className="w-6 h-6 rounded-full border-2 border-white/20 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Wardrobe Store Cards */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INITIAL_WARDROBE_ITEMS.map((item) => {
                  const isUnlocked = item.purchased || player.wardrobe?.some((w) => w.id === item.id && w.purchased);
                  const isEquipped = item.equipped || player.wardrobe?.some((w) => w.id === item.id && w.equipped);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        isEquipped
                          ? "bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/40"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{item.icon}</span>
                        {isEquipped ? (
                          <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">
                            EQUIPPED
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                            OWNED
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1 font-mono-code">
                            <Coins className="w-3 h-3" />
                            {item.price}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {item.category}
                        </span>
                      </div>

                      <button
                        onClick={() => handleItemAction(item)}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                          isEquipped
                            ? "bg-slate-800 text-slate-400 cursor-default"
                            : isUnlocked
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                        }`}
                      >
                        {isEquipped ? "Currently Wearing" : isUnlocked ? "Equip Outfit" : `Buy for ${item.price} Coins`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Trophies & Stats View */
            <div className="flex flex-col gap-6">
              {/* Daily Streak & Immersion Banner */}
              <div className="bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-950 border border-rose-500/30 rounded-3xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
                    <Flame className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display font-bold text-xl text-white">
                      {player.streakDays} Day Learning Immersion Streak
                    </h3>
                    <p className="text-xs text-slate-400">
                      Keep practicing daily in English City to maintain your fluency momentum!
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-slate-400">Total Speaking Time</span>
                  <span className="font-display font-bold text-xl text-amber-400">
                    {Math.round(player.totalSpeakingSeconds / 60)} Minutes
                  </span>
                </div>
              </div>

              {/* Achievements Showcase */}
              <div className="flex flex-col gap-3">
                <h4 className="font-display font-bold text-sm text-slate-200">
                  Achievements & Trophies ({INITIAL_ACHIEVEMENTS.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {INITIAL_ACHIEVEMENTS.map((ach) => {
                    const isUnlocked = ach.unlocked || player.achievements?.some((a) => a.id === ach.id && a.unlocked);

                    return (
                      <div
                        key={ach.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                          isUnlocked
                            ? "bg-amber-950/20 border-amber-500/40"
                            : "bg-slate-950/60 border-slate-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{ach.icon === "MessageSquare" ? "💬" : ach.icon === "Plane" ? "✈️" : ach.icon === "Coffee" ? "☕" : ach.icon === "BookMarked" ? "📖" : ach.icon === "Flame" ? "🔥" : "🏆"}</span>
                          <span className="text-[10px] text-amber-400 font-mono-code font-bold">
                            +{ach.xpReward} XP
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">{ach.title}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            {ach.description}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                          <span className="text-slate-400 capitalize">{ach.category}</span>
                          {isUnlocked && <span className="text-emerald-400 font-bold">UNLOCKED</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

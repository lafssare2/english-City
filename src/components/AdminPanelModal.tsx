import React, { useState } from "react";
import { PlayerProfile, CEFRLevel, NPC, Mission } from "../types";
import { sound, speakText } from "../utils/audioSynthesizer";
import { apiPost } from "../lib/apiClient";
import {
  Settings,
  X,
  UserPlus,
  Coins,
  Zap,
  RotateCcw,
  Volume2,
  CheckCircle2,
} from "lucide-react";

interface AdminPanelModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onUpdatePlayer: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  player,
  onClose,
  onUpdatePlayer,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(player.level);

  const handleApplyLevel = (lvl: CEFRLevel) => {
    sound.playClick();
    setSelectedLevel(lvl);
    onUpdatePlayer((prev) => ({ ...prev, level: lvl }));
  };

  const handleAddCurrency = async () => {
    sound.playCoin();
    try {
      const res = await apiPost<{ xp: number; level: number; coins: number }>("/api/player/reward-xp", {
        xp: 1000,
        coins: 500,
        reason: "Developer sandbox testing boost",
        source: "admin_panel",
      });
      if (res && res.xp !== undefined) {
        onUpdatePlayer((prev) => ({
          ...prev,
          coins: res.coins ?? (prev.coins + 500),
          xp: res.xp,
          level: res.level ?? prev.level,
        }));
      }
    } catch (e) {
      onUpdatePlayer((prev) => ({
        ...prev,
        coins: prev.coins + 500,
        xp: prev.xp + 1000,
      }));
    }
  };

  const handleTestAudio = () => {
    sound.playLevelUp();
    speakText("Welcome to the administrative control engine of English City.", { rate: 1.0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-base text-white">
                Admin & Simulation Controls
              </h2>
              <p className="text-xs text-slate-400">
                Developer tools for tuning CEFR difficulty, testing audio, and managing sandbox state.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* CEFR Difficulty Modifier */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Adjust Player CEFR Immersion Level
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(["A1", "A2", "B1", "B2", "C1"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleApplyLevel(lvl)}
                  className={`py-3 rounded-2xl font-bold text-xs font-mono-code transition-all ${
                    player.level === lvl
                      ? "bg-amber-500 text-slate-950 shadow-md scale-105"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">
              Changes NPC vocabulary complexity and prompt criteria across the city instantly.
            </span>
          </div>

          {/* Currency & Rewards Booster */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sandbox Currency Booster
            </label>
            <button
              onClick={handleAddCurrency}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Grant +500 Coins & +1,000 XP for Testing</span>
            </button>
          </div>

          {/* Audio Engine Diagnostic */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Synthesizer & Speech Diagnostic
            </label>
            <button
              onClick={handleTestAudio}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>Play Synthesizer Test Chime + TTS Speech</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

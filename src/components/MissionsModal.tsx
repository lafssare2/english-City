import React, { useState } from "react";
import { Mission, PlayerProfile, CEFRLevel } from "../types";
import { INITIAL_MISSIONS } from "../data/initialData";
import { sound } from "../utils/audioSynthesizer";
import {
  Sparkles,
  X,
  CheckCircle2,
  Compass,
  Coins,
  Award,
  Zap,
  BookOpen,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";

interface MissionsModalProps {
  missions: Mission[];
  player: PlayerProfile;
  activeMissionId?: string;
  onClose: () => void;
  onSelectActiveMission: (mission: Mission) => void;
  onAddNewMission: (mission: Mission) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  player,
  activeMissionId,
  onClose,
  onSelectActiveMission,
  onAddNewMission,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "story" | "district" | "daily" | "dynamic">("all");
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | "ALL">("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredMissions = missions.filter((m) => {
    const matchesTab = activeTab === "all" || m.category === activeTab;
    const matchesLevel = levelFilter === "ALL" || m.level === levelFilter;
    return matchesTab && matchesLevel;
  });

  // Call server to generate a dynamic personalized AI mission
  const handleGenerateDynamicMission = async () => {
    sound.playClick();
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/dynamic-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player,
          weakSkills: ["Polite Requests", "Past Tense", "Cafe Ordering"],
          targetDistrict: player.currentDistrictId,
        }),
      });

      const data = await res.json();
      const newMission: Mission = {
        id: data.id || `dyn_${Date.now()}`,
        title: data.title || "Custom English Immersion Challenge",
        category: "dynamic",
        districtId: player.currentDistrictId,
        locationId: player.currentLocationId,
        level: data.level || player.level,
        description: data.description || "Communicate with residents to solve an unexpected city problem.",
        objectives: (data.objectives || []).map((o: any) => ({
          id: o.id || `obj_${Math.random()}`,
          text: o.text || "Speak with local resident",
          completed: false,
        })),
        targetVocabulary: data.targetVocabulary || ["recommend", "receipt", "total"],
        targetGrammar: ["Present Simple", "Polite Inquiries"],
        xpReward: data.xpReward || 300,
        coinReward: data.coinReward || 100,
        status: "available",
        progressPercent: 0,
      };

      onAddNewMission(newMission);
      onSelectActiveMission(newMission);
      sound.playXpSuccess();
    } catch (err) {
      console.error("Error generating mission:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Quests & Learning Missions</span>
                <span className="text-xs font-arabic text-amber-300">
                  (المهام التعليمية والمغامرات)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete real-world situations, speak with NPCs, and unlock districts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate Dynamic AI Quest Button */}
            <button
              id="btn_generate_ai_mission"
              onClick={handleGenerateDynamicMission}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isGenerating ? "Generating..." : "Generate AI Quest"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: "all", label: "All Quests" },
                { id: "story", label: "Main Story" },
                { id: "district", label: "District Tasks" },
                { id: "daily", label: "Daily Goals" },
                { id: "dynamic", label: "Dynamic AI" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CEFR Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">CEFR Level:</span>
            {(["ALL", "A1", "A2", "B1", "B2", "C1"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  sound.playClick();
                  setLevelFilter(lvl);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-mono-code font-bold transition-all ${
                  levelFilter === lvl
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Missions Cards List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMissions.map((mission) => {
            const isActive = activeMissionId === mission.id;
            const completedCount = mission.objectives.filter((o) => o.completed).length;

            return (
              <div
                key={mission.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between gap-4 transition-all ${
                  isActive
                    ? "bg-slate-850 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  {/* Top Metadata Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 font-mono-code text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        CEFR {mission.level}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 capitalize">
                        {mission.category}
                      </span>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full animate-pulse">
                        ACTIVE ON HUD
                      </span>
                    )}
                  </div>

                  {/* Title & Arabic subtitle */}
                  <div className="flex flex-col">
                    <h3 className="font-display font-bold text-base text-white">
                      {mission.title}
                    </h3>
                    {mission.arabicTitle && (
                      <span className="text-xs font-arabic text-amber-300 mt-0.5">
                        {mission.arabicTitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mission.description}
                  </p>

                  {/* Objectives Checklist */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Objectives ({completedCount}/{mission.objectives.length})
                    </span>
                    {mission.objectives.map((obj) => (
                      <div key={obj.id} className="flex items-start gap-2 text-xs">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            obj.completed ? "text-emerald-400" : "text-slate-600"
                          }`}
                        />
                        <div className="flex flex-col">
                          <span
                            className={
                              obj.completed ? "text-emerald-300 line-through" : "text-slate-300"
                            }
                          >
                            {obj.text}
                          </span>
                          {obj.arabicText && (
                            <span className="text-[10px] text-slate-400 font-arabic">
                              {obj.arabicText}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Target Vocabulary */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold">Target Words:</span>
                    {mission.targetVocabulary.map((word) => (
                      <span
                        key={word}
                        className="bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[10px] px-2 py-0.5 rounded-md font-mono-code"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rewards & Track Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>+{mission.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{mission.coinReward} Coins</span>
                    </div>
                  </div>

                  {isActive ? (
                    <button
                      disabled
                      className="text-xs bg-slate-800 text-slate-400 font-semibold px-4 py-2 rounded-xl cursor-default"
                    >
                      Currently Tracking
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectActiveMission(mission);
                        onClose();
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Track Quest</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

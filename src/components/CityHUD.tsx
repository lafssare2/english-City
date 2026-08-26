import React, { useState } from "react";
import {
  PlayerProfile,
  TimeOfDay,
  WeatherType,
  Mission,
  DistrictId,
} from "../types";
import { DISTRICTS } from "../data/initialData";
import { sound } from "../utils/audioSynthesizer";
import {
  Map,
  BookMarked,
  Home,
  Bot,
  Sparkles,
  Briefcase,
  BarChart3,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  CloudRain,
  Moon,
  Compass,
  CheckCircle2,
  Flame,
  Coins,
  ChevronDown,
  Gamepad2,
  Cloud,
  UserCheck,
  User,
  Train,
} from "lucide-react";

interface CityHUDProps {
  player: PlayerProfile;
  activeMission?: Mission;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  currentDistrictId: DistrictId;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  onSetWeather: (weather: WeatherType) => void;
  onOpenModal: (
    modal:
      | "map"
      | "missions"
      | "vocabulary"
      | "home"
      | "tutor"
      | "minigames"
      | "career"
      | "analytics"
      | "admin"
      | "auth"
      | "transit"
  ) => void;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  player,
  activeMission,
  timeOfDay,
  weather,
  currentDistrictId,
  soundEnabled,
  onToggleSound,
  onSetTimeOfDay,
  onSetWeather,
  onOpenModal,
}) => {
  const [showMissionDropdown, setShowMissionDropdown] = useState(false);
  const [showEnvControls, setShowEnvControls] = useState(false);

  const currentDistrict =
    DISTRICTS.find((d) => d.id === currentDistrictId) || DISTRICTS[0];

  // Calculate XP progress to next level
  const xpForNextLevel = 1000;
  const currentLevelXp = player.xp % xpForNextLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100));

  const handleNavClick = (
    modal:
      | "map"
      | "missions"
      | "vocabulary"
      | "home"
      | "tutor"
      | "minigames"
      | "career"
      | "analytics"
      | "admin"
      | "auth"
      | "transit"
  ) => {
    sound.playClick();
    onOpenModal(modal);
  };

  const isCloudSynced = Boolean(player.userId && player.userId !== "guest");

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none p-3 sm:p-4 flex flex-col gap-2">
      {/* Top Main Status Bar */}
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        {/* Left: Player Profile & Level Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-3.5 py-2 shadow-2xl pointer-events-auto">
          {/* Avatar Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white shadow-inner ring-2 ring-white/10"
            style={{ backgroundColor: player.avatarColor }}
          >
            {player.avatarStyle === "explorer" ? "🧭" : "🎓"}
          </div>

          {/* Name & CEFR Level */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
                {player.name}
              </span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-display font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                {player.level}
              </span>
            </div>

            {/* XP Bar */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono-code text-slate-400">
                {currentLevelXp}/{xpForNextLevel} XP
              </span>
            </div>
          </div>

          {/* Coins & Streak */}
          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-800">
            {/* Coins */}
            <div
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-amber-500/20 transition-colors"
              onClick={() => handleNavClick("home")}
              title="English Coins - Spend in Wardrobe & Furniture"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold font-mono-code text-amber-300">
                {player.coins}
              </span>
            </div>

            {/* Streak */}
            <div
              className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl"
              title={`${player.streakDays} Day Learning Immersion Streak!`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="text-xs font-bold font-mono-code text-rose-300">
                {player.streakDays}d
              </span>
            </div>
          </div>

          {/* Cloud Identity / Auth Badge */}
          <button
            onClick={() => handleNavClick("auth")}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
              isCloudSynced
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title={isCloudSynced ? "Cloud Account Active & Synced" : "Guest Mode - Click to Sign In"}
          >
            {isCloudSynced ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Sync</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Current District Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2 shadow-2xl pointer-events-auto">
          <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Current District
            </span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              {currentDistrict.name}
              <span className="text-[10px] text-slate-400 font-arabic">
                ({currentDistrict.arabicName})
              </span>
            </span>
          </div>
        </div>

        {/* Right: Environment Toggles & System Menu */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
          {/* Environment controls dropdown toggle */}
          <button
            id="btn_hud_env_toggle"
            onClick={() => {
              sound.playClick();
              setShowEnvControls(!showEnvControls);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-xs font-medium"
            title="Time of Day & Weather Simulation"
          >
            {timeOfDay === "morning" || timeOfDay === "afternoon" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
            <span className="capitalize hidden sm:inline">{timeOfDay}</span>
            {weather === "rainy" && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
          </button>

          {/* Sound Toggle */}
          <button
            id="btn_hud_sound"
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            className={`p-2 rounded-xl transition-colors ${
              soundEnabled
                ? "text-blue-400 hover:bg-blue-500/10"
                : "text-slate-500 hover:bg-slate-800"
            }`}
            title={soundEnabled ? "Mute Game Audio" : "Enable Game Audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* 24/7 AI Tutor Coach Button */}
          <button
            id="btn_hud_ai_tutor"
            onClick={() => handleNavClick("tutor")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl font-medium text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            title="Ask AI English Tutor (Professor Lily)"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span className="hidden md:inline">AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Environment Selector Dropdown Panel (When toggled) */}
      {showEnvControls && (
        <div className="max-w-md mx-auto w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl pointer-events-auto flex flex-col gap-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              World Simulation Controls
            </span>
            <button
              onClick={() => setShowEnvControls(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>

          {/* Time of Day */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl">
            {(["morning", "afternoon", "evening", "night"] as TimeOfDay[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  sound.playClick();
                  onSetTimeOfDay(t);
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  timeOfDay === t
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Weather */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl">
            {(["sunny", "cloudy", "rainy", "windy", "foggy"] as WeatherType[]).map((w) => (
              <button
                key={w}
                onClick={() => {
                  sound.playClick();
                  onSetWeather(w);
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  weather === w
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Ribbon: Active Quest Banner & District Navigation Bar */}
      <div className="flex items-start justify-between gap-2 max-w-7xl mx-auto w-full">
        {/* Active Mission HUD Widget */}
        {activeMission ? (
          <div className="relative pointer-events-auto">
            <div
              onClick={() => {
                sound.playClick();
                setShowMissionDropdown(!showMissionDropdown);
              }}
              className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-850 backdrop-blur-md border border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-xl cursor-pointer transition-all max-w-[280px] sm:max-w-md group"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Active Mission
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono-code px-1.5 py-0.2 rounded-sm">
                    {activeMission.level}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-amber-200 transition-colors">
                  {activeMission.title}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showMissionDropdown ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Expanded Mission Checklist Card */}
            {showMissionDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-200">Mission Objectives</h4>
                  <button
                    onClick={() => handleNavClick("missions")}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    View All Quests
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {activeMission.description}
                </p>

                {/* Objectives */}
                <div className="flex flex-col gap-2 mb-3">
                  {activeMission.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs ${
                        obj.completed
                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-300"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          obj.completed ? "text-emerald-400" : "text-slate-600"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span>{obj.text}</span>
                        {obj.arabicText && (
                          <span className="text-[10px] text-slate-400 font-arabic mt-0.5">
                            {obj.arabicText}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Vocab preview */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-medium">Target Words:</span>
                  {activeMission.targetVocabulary.map((word) => (
                    <span
                      key={word}
                      className="bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[10px] px-2 py-0.5 rounded-md font-mono-code"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Right Floating Quick-Access Game Apps */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-1.5 shadow-xl pointer-events-auto">
          {/* Map */}
          <button
            id="btn_hud_nav_map"
            onClick={() => handleNavClick("map")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="City Map & Fast Travel (M)"
          >
            <Map className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden sm:inline">Map</span>
          </button>

          {/* Public Transit */}
          <button
            id="btn_hud_nav_transit"
            onClick={() => handleNavClick("transit")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Public Transit & Subway Network"
          >
            <Train className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden sm:inline">Transit</span>
          </button>

          {/* Quests / Missions */}
          <button
            id="btn_hud_nav_quests"
            onClick={() => handleNavClick("missions")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Quests & Story Progression"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden sm:inline">Missions</span>
          </button>

          {/* Vocabulary SRS Bank */}
          <button
            id="btn_hud_nav_vocab"
            onClick={() => handleNavClick("vocabulary")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Vocabulary Bank & Spaced Repetition Flashcards"
          >
            <BookMarked className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden sm:inline">Vocab</span>
          </button>

          {/* Mini-Games Arcade */}
          <button
            id="btn_hud_nav_games"
            onClick={() => handleNavClick("minigames")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Language Learning Mini-Games Arcade"
          >
            <Gamepad2 className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden md:inline">Games</span>
          </button>

          {/* Player Home */}
          <button
            id="btn_hud_nav_home"
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Player Home & Wardrobe"
          >
            <Home className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden md:inline">Loft</span>
          </button>

          {/* Career & Interviews */}
          <button
            id="btn_hud_nav_career"
            onClick={() => handleNavClick("career")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Career Center & AI Job Interviews"
          >
            <Briefcase className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden lg:inline">Careers</span>
          </button>

          {/* Analytics Dashboard */}
          <button
            id="btn_hud_nav_analytics"
            onClick={() => handleNavClick("analytics")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="CEFR Language Mastery Radar & Progress"
          >
            <BarChart3 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden lg:inline">Stats</span>
          </button>

          {/* Admin Panel */}
          <button
            id="btn_hud_nav_admin"
            onClick={() => handleNavClick("admin")}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all"
            title="Admin & Content Manager"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};

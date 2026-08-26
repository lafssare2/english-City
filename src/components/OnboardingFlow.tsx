import React, { useState } from "react";
import { PlayerProfile, CEFRLevel } from "../types";
import { DEFAULT_PLAYER_PROFILE } from "../data/initialData";
import { sound, speakText } from "../utils/audioSynthesizer";
import confetti from "canvas-confetti";
import {
  Plane,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Compass,
  Globe2,
  GraduationCap,
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: (profile: PlayerProfile) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [playerName, setPlayerName] = useState("Alex Morgan");
  const [avatarColor, setAvatarColor] = useState("#3b82f6");
  const [avatarStyle, setAvatarStyle] = useState<"explorer" | "scholar">("explorer");
  const [supportLanguage, setSupportLanguage] = useState<"Arabic" | "French" | "Spanish" | "German" | "Japanese">("Arabic");
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>("A2");

  const handleFinish = () => {
    sound.playLevelUp();
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}

    speakText(`Welcome to English City, ${playerName}! Your journey begins at the International Airport.`, {
      rate: 0.95,
    });

    const newProfile: PlayerProfile = {
      ...DEFAULT_PLAYER_PROFILE,
      name: playerName.trim() || "Alex Morgan",
      avatarColor,
      avatarStyle,
      level: selectedLevel,
      supportLanguage,
      skillScores: {
        ...DEFAULT_PLAYER_PROFILE.skillScores,
        speaking: selectedLevel === "A1" ? 40 : selectedLevel === "A2" ? 60 : 78,
        listening: selectedLevel === "A1" ? 45 : selectedLevel === "A2" ? 65 : 80,
        pronunciation: selectedLevel === "A1" ? 50 : selectedLevel === "A2" ? 62 : 75,
        grammar: selectedLevel === "A1" ? 42 : selectedLevel === "A2" ? 68 : 82,
        vocabulary: selectedLevel === "A1" ? 48 : selectedLevel === "A2" ? 64 : 80,
      },
    };

    onComplete(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 text-white overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-400" />
            <span className="font-display font-bold text-sm tracking-tight text-slate-200">
              English City Immersion • Flight Arrival
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-400">Step {step} of 3</span>
        </div>

        {step === 1 && (
          /* Step 1: Player Identity */
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Passport & Persona
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Create Your Citizen Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the name you want city residents and English tutors to call you.
              </p>
            </div>

            {/* Avatar Style & Color */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/60 p-5 rounded-3xl border border-slate-800">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl ring-4 ring-white/10"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarStyle === "explorer" ? "🧭" : "🎓"}
              </div>

              <div className="flex flex-col gap-3 flex-1 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2">
                  {["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-xl border-2 transition-transform ${
                        avatarColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setStep(2);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Continue to Language Settings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          /* Step 2: Native / Support Language */
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Globe2 className="w-3.5 h-3.5" />
                Translation Support
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Select Your Native Language
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                This language will be used for grammar explanations and instant dictionary translations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "Arabic" as const, name: "Arabic (العربية)", tag: "Primary Support", flag: "🇸🇦" },
                { id: "French" as const, name: "French (Français)", tag: "Supported", flag: "🇫🇷" },
                { id: "Spanish" as const, name: "Spanish (Español)", tag: "Supported", flag: "🇪🇸" },
                { id: "German" as const, name: "German (Deutsch)", tag: "Supported", flag: "🇩🇪" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    sound.playClick();
                    setSupportLanguage(lang.id);
                  }}
                  className={`p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    supportLanguage === lang.id
                      ? "bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40 shadow-lg"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-white">{lang.name}</span>
                      <span className="text-[10px] text-slate-400">{lang.tag}</span>
                    </div>
                  </div>
                  {supportLanguage === lang.id && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setStep(3);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Continue to Level Placement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          /* Step 3: CEFR Placement Selection */
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <GraduationCap className="w-3.5 h-3.5" />
                CEFR Placement
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Choose Your English Level
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                This configures the speaking speed and vocabulary complexity of all city NPCs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  level: "A1" as CEFRLevel,
                  title: "Beginner",
                  desc: "Basic words, simple phrases, slow and clear speech.",
                },
                {
                  level: "A2" as CEFRLevel,
                  title: "Elementary",
                  desc: "Ordering in cafes, asking directions, routine city tasks.",
                },
                {
                  level: "B1" as CEFRLevel,
                  title: "Intermediate",
                  desc: "Describing experiences, giving opinions, travel dialogue.",
                },
                {
                  level: "B2" as CEFRLevel,
                  title: "Upper-Int",
                  desc: "Job interviews, spontaneous debates, technical concepts.",
                },
                {
                  level: "C1" as CEFRLevel,
                  title: "Advanced",
                  desc: "Complex professional discussions, idioms, nuance.",
                },
              ].map((item) => (
                <button
                  key={item.level}
                  onClick={() => {
                    sound.playClick();
                    setSelectedLevel(item.level);
                  }}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-2 text-left transition-all ${
                    selectedLevel === item.level
                      ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-lg text-emerald-400">
                      {item.level}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                id="btn_onboarding_step_into_city"
                onClick={handleFinish}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-3.5 rounded-2xl text-xs shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Step into English City</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

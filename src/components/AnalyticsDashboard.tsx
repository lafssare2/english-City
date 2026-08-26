import React from "react";
import { PlayerProfile } from "../types";
import {
  BarChart3,
  X,
  TrendingUp,
  Award,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface AnalyticsDashboardProps {
  player: PlayerProfile;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ player, onClose }) => {
  const skills = [
    { label: "Spoken Fluency", score: player.skills.speaking, color: "from-blue-500 to-cyan-400" },
    { label: "Listening Comprehension", score: player.skills.listening, color: "from-emerald-500 to-teal-400" },
    { label: "Pronunciation & Phonetics", score: player.skills.pronunciation, color: "from-purple-500 to-indigo-400" },
    { label: "Grammar & Syntax", score: player.skills.grammar, color: "from-amber-500 to-orange-400" },
    { label: "Active Vocabulary", score: player.skills.vocabulary, color: "from-rose-500 to-pink-400" },
    { label: "Situational Confidence", score: player.skills.confidence, color: "from-indigo-500 to-blue-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>CEFR Language Mastery & Analytics</span>
                <span className="text-xs font-arabic text-amber-300">
                  (لوحة تحليلات المستوى اللغوي)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed diagnostic breakdown of your spoken fluency, vocabulary, and grammar.
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
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col">
              <span className="text-xs text-slate-400 font-medium">CEFR Level</span>
              <span className="font-display font-black text-2xl text-amber-400 mt-1">
                {player.level}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Independent User</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Speaking Time</span>
              <span className="font-display font-black text-2xl text-blue-400 mt-1">
                {Math.round(player.totalSpeakingSeconds / 60)} min
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Live Spoken Voice</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Conversations</span>
              <span className="font-display font-black text-2xl text-emerald-400 mt-1">
                {player.totalConversations}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">With City NPCs</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Daily Streak</span>
              <span className="font-display font-black text-2xl text-rose-500 mt-1 flex items-center gap-1">
                <Flame className="w-5 h-5 inline animate-pulse" />
                {player.streakDays}d
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Immersion Streak</span>
            </div>
          </div>

          {/* Skill Radar / Progress Bars */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">
              Core Competency Scores
            </h3>

            <div className="flex flex-col gap-4">
              {skills.map((skill) => (
                <div key={skill.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{skill.label}</span>
                    <span className="font-mono-code font-bold text-slate-200">
                      {skill.score}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${skill.color} transition-all duration-700`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Insights & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-5 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Key Linguistic Strengths
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                You excel at clear pronunciation of customer service phrases and asking polite questions using modal verbs ("Could I please...").
              </p>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/20 rounded-3xl p-5 flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Target Practice Areas
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice more past tense irregular verbs ("bought", "thought", "went") in dialogue scenarios at Oxford Library and St. Jude Hospital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

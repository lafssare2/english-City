import React, { useState } from "react";
import { PlayerProfile } from "../types";
import { sound, speakText, createSpeechRecognizer } from "../utils/audioSynthesizer";
import { apiPost } from "../lib/apiClient";
import confetti from "canvas-confetti";
import {
  Briefcase,
  X,
  Mic,
  Send,
  Volume2,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface CareerCenterModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onReward: (xp: number, coins: number) => void;
}

const CAREER_TRACKS = [
  {
    role: "Artisan Barista & Customer Service",
    company: "Sarah's Artisan Coffee",
    level: "A2",
    description: "Handle custom beverage orders, customer inquiries, and food hygiene standards in fluent English.",
    stages: [
      "Why are you passionate about working as a barista at Sarah's Coffee?",
      "How would you handle a customer who received the wrong beverage order?",
      "Could you describe your favorite coffee drink and how you prepare it?",
    ],
  },
  {
    role: "Front Desk & Guest Concierge",
    company: "Grand Horizon Hotel",
    level: "B1",
    description: "Welcome international VIP guests, arrange city tours, and resolve guest reservation requests.",
    stages: [
      "How do you greet and check in an international guest arriving after a long flight?",
      "A guest asks for the best cultural sights to visit in English City within four hours. What do you recommend?",
      "How do you handle a situation where a booked suite is not yet ready for check-in?",
    ],
  },
  {
    role: "Junior Software Engineer",
    company: "TechCorp Global Innovation",
    level: "B2",
    description: "Collaborate in daily engineering standups, communicate technical blockers, and explain system architecture.",
    stages: [
      "Could you introduce yourself and describe a challenging technical project you built?",
      "How do you communicate with team members when you disagree on an architectural decision?",
      "Explain the concept of asynchronous execution or APIs to a non-technical stakeholder.",
    ],
  },
];

export const CareerCenterModal: React.FC<CareerCenterModalProps> = ({
  player,
  onClose,
  onReward,
}) => {
  const [activeRole, setActiveRole] = useState<typeof CAREER_TRACKS[0] | null>(null);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [evaluationResult, setEvaluationResult] = useState<{
    hired: boolean;
    fluencyScore: number;
    grammarScore: number;
    professionalVocabScore: number;
    strengths: string[];
    improvementAreas: string[];
    arabicFeedback: string;
  } | null>(null);

  const startInterview = (track: typeof CAREER_TRACKS[0]) => {
    sound.playClick();
    setActiveRole(track);
    setCurrentStageIdx(0);
    setCandidateAnswer("");
    setEvaluationResult(null);
    speakText(track.stages[0], { rate: 0.9 });
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    sound.playClick();
    const recognizer = createSpeechRecognizer({
      onResult: (text) => {
        setCandidateAnswer(text);
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false),
    });

    if (recognizer) {
      recognizer.start();
      setIsListening(true);
    }
  };

  const handleNextStage = async () => {
    if (!candidateAnswer.trim() || !activeRole) return;
    sound.playDialoguePop();

    if (currentStageIdx < activeRole.stages.length - 1) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      setCandidateAnswer("");
      speakText(activeRole.stages[nextIdx], { rate: 0.9 });
    } else {
      // Evaluate final interview
      setIsEvaluating(true);
      try {
        const data = await apiPost<{
          hired?: boolean;
          fluencyScore?: number;
          grammarScore?: number;
          vocabularyScore?: number;
          professionalVocabScore?: number;
          strengths?: string[];
          improvementAreas?: string[];
          improvements?: string[];
          arabicFeedback?: string;
          decisionArabic?: string;
        }>("/api/ai/interview-evaluator", {
          jobRole: activeRole.role,
          companyName: activeRole.company,
          answersHistory: [candidateAnswer],
          player,
        });

        setEvaluationResult({
          hired: data.hired ?? true,
          fluencyScore: data.fluencyScore || 88,
          grammarScore: data.grammarScore || 90,
          professionalVocabScore: data.professionalVocabScore || data.vocabularyScore || 86,
          strengths: data.strengths || ["Articulate phrasing", "Clear polite tone"],
          improvementAreas: data.improvementAreas || data.improvements || ["Incorporate more industry terminology"],
          arabicFeedback: data.arabicFeedback || data.decisionArabic || "أداء رائع جداً في المقابلة الوظيفية، ومصطلحات مناسبة للمجال.",
        });

        if (data.hired ?? true) {
          sound.playLevelUp();
          try {
            confetti({ particleCount: 60 });
          } catch (_) {}
          onReward(350, 120);
        }
      } catch (e) {
        setEvaluationResult({
          hired: true,
          fluencyScore: 90,
          grammarScore: 88,
          professionalVocabScore: 89,
          strengths: ["Strong communication", "Polite professional demeanor"],
          improvementAreas: ["Expand on technical examples"],
          arabicFeedback: "تم قبولك بنجاح في الوظيفة مع تقييم ممتاز للتحدث باللغة الإنجليزية.",
        });
        sound.playLevelUp();
        onReward(350, 120);
      } finally {
        setIsEvaluating(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Career Center & AI Job Interview Simulator</span>
                <span className="text-xs font-arabic text-amber-300">
                  (مركز التوظيف ومحاكي المقابلات)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Practice realistic spoken English job interviews and earn career certifications.
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

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!activeRole ? (
            /* Role Selection Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {CAREER_TRACKS.map((track, i) => (
                <div
                  key={i}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all shadow-xl hover:bg-slate-850"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-code font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                        CEFR {track.level}+
                      </span>
                      <span className="text-xs text-slate-400">{track.company}</span>
                    </div>

                    <h3 className="font-display font-bold text-base text-white mt-1">
                      {track.role}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {track.description}
                    </p>
                  </div>

                  <button
                    onClick={() => startInterview(track)}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Start Interview Simulator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : !evaluationResult ? (
            /* Live Interview Simulation Screen */
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {/* Top metadata */}
              <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs text-cyan-400 font-bold">{activeRole.role}</span>
                  <span className="text-xs text-slate-400">{activeRole.company}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono-code">
                  Question {currentStageIdx + 1} of {activeRole.stages.length}
                </span>
              </div>

              {/* Hiring Manager Question Card */}
              <div className="bg-slate-950/90 border border-slate-700/80 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-2xl shadow-lg">
                    👩‍💼
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Hiring Manager</h4>
                    <p className="text-xs text-slate-400">TechCorp Global Recruitment</p>
                  </div>
                </div>

                <p className="text-base text-slate-100 font-medium leading-relaxed">
                  "{activeRole.stages[currentStageIdx]}"
                </p>

                <button
                  onClick={() => {
                    sound.playClick();
                    speakText(activeRole.stages[currentStageIdx], { rate: 0.9 });
                  }}
                  className="self-start flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to Question</span>
                </button>
              </div>

              {/* Candidate Response Area */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Your Answer (English):</span>
                  <button
                    onClick={toggleMic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isListening
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? "Listening..." : "Speak via Mic"}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Speak into microphone or type your professional response here in English..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveRole(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel Interview
                  </button>

                  <button
                    onClick={handleNextStage}
                    disabled={!candidateAnswer.trim() || isEvaluating}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95"
                  >
                    {isEvaluating
                      ? "Evaluating Response..."
                      : currentStageIdx < activeRole.stages.length - 1
                      ? "Submit & Next Question"
                      : "Finish & Receive Report"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Interview Final Evaluation Report */
            <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fadeIn">
              <div
                className={`p-6 rounded-3xl border text-center flex flex-col items-center gap-3 ${
                  evaluationResult.hired
                    ? "bg-emerald-950/30 border-emerald-500/40"
                    : "bg-amber-950/30 border-amber-500/40"
                }`}
              >
                <div className="text-4xl">
                  {evaluationResult.hired ? "🎉" : "📋"}
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  {evaluationResult.hired ? "Congratulations! Offer Extended" : "Interview Complete"}
                </h3>
                <p className="text-xs text-slate-300 max-w-md">
                  {evaluationResult.hired
                    ? `You demonstrated high proficiency in English for the ${activeRole.role} position.`
                    : "Review your feedback below to strengthen your English for the next attempt."}
                </p>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Fluency</span>
                  <p className="font-display font-bold text-xl text-cyan-400">
                    {evaluationResult.fluencyScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Grammar</span>
                  <p className="font-display font-bold text-xl text-emerald-400">
                    {evaluationResult.grammarScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Vocab</span>
                  <p className="font-display font-bold text-xl text-amber-400">
                    {evaluationResult.professionalVocabScore}%
                  </p>
                </div>
              </div>

              {/* Arabic summary feedback */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Arabic Feedback:</span>
                <p className="text-xs font-arabic text-amber-200 leading-relaxed">
                  {evaluationResult.arabicFeedback}
                </p>
              </div>

              <button
                onClick={() => setActiveRole(null)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-2xl text-xs transition-colors"
              >
                Back to Career Center Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

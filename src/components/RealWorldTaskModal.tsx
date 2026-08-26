import React, { useState } from "react";
import { RealWorldTask, PlayerProfile, CEFRLevel } from "../types";
import { RealWorldTaskEngine } from "../services/city/RealWorldTaskEngine";
import { speechService } from "../services/speechService";
import { sound } from "../utils/audioSynthesizer";
import {
  X,
  Volume2,
  CheckCircle2,
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  Coins,
  Compass,
} from "lucide-react";

interface RealWorldTaskModalProps {
  task: RealWorldTask | null;
  player: PlayerProfile;
  onClose: () => void;
  onTaskCompleted: (taskId: string, xpEarned: number, coinsEarned: number) => void;
}

export const RealWorldTaskModal: React.FC<RealWorldTaskModalProps> = ({
  task,
  player,
  onClose,
  onTaskCompleted,
}) => {
  const [userInput, setUserInput] = useState("");
  const [evalResult, setEvalResult] = useState<{
    completed: boolean;
    feedback: string;
    arabicFeedback: string;
    vocabMatches: string[];
    grammarBonus: boolean;
    earnedXp: number;
    earnedCoins: number;
  } | null>(null);

  if (!task) return null;

  const cefrPrompt = RealWorldTaskEngine.getCEFRAdaptedPrompt(
    task,
    player.cefrLevel
  );

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.95 });
  };

  const handleEvaluate = () => {
    if (!userInput.trim() || evalResult?.completed) return;

    const result = RealWorldTaskEngine.evaluateTaskAttempt(
      task,
      userInput,
      player.cefrLevel
    );

    setEvalResult(result);

    if (result.completed) {
      sound.playSuccess();
      onTaskCompleted(task.id, result.earnedXp, result.earnedCoins);
    } else {
      sound.playClick();
    }
  };

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="task-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {task.cefrLevel} Practical English Task
                </span>
                <span className="text-xs text-slate-400">📍 {task.roomName}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {task.title}
              </h2>
            </div>
          </div>
          <button
            id="close-task-modal-button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Scenario Context */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Scenario Context & Objective
            </span>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {task.scenarioContext}
            </p>
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">
                🎯 {task.objectiveText}
              </span>
              {task.arabicObjective && (
                <span className="text-slate-400" dir="rtl">
                  {task.arabicObjective}
                </span>
              )}
            </div>
          </div>

          {/* Sample Dialogue Exchanges */}
          {task.sampleExchanges && task.sampleExchanges.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Dialogue Context
              </span>
              {task.sampleExchanges.map((exc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                    <span>{exc.prompt}</span>
                    <button
                      onClick={() => handleSpeak(exc.prompt)}
                      className="p-1 hover:text-white"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-300 italic pl-3 border-l-2 border-indigo-500">
                    Expected: "{exc.expectedReply}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Target Vocabulary Badges */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Target Vocabulary & Phrasing:
            </span>
            <div className="flex flex-wrap gap-2">
              {task.targetVocab.map((vocab, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserInput((prev) =>
                      prev ? `${prev} ${vocab}` : `I need ${vocab}`
                    );
                    sound.playClick();
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 hover:border-blue-500 transition-all flex items-center gap-1"
                >
                  <span>{vocab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Hint */}
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-200">
            <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">CEFR {player.cefrLevel} Tip: </span>
              {cefrPrompt.hint}
            </div>
          </div>

          {/* User Input & Action */}
          {!evalResult?.completed && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Your Spoken / Written Utterance:
              </label>
              <div className="flex gap-2">
                <input
                  id="task-utterance-input"
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={`e.g. "${cefrPrompt.sampleResponse}"`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  id="submit-task-attempt-button"
                  onClick={handleEvaluate}
                  disabled={!userInput.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Perform
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Progression */}
          {evalResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                evalResult.completed
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/60 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {evalResult.completed ? "Task Successfully Accomplished!" : "Revise and Try Again"}
                </span>
                {evalResult.completed && (
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> +{evalResult.earnedXp} XP
                    </span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> +{evalResult.earnedCoins} Coins
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">{evalResult.feedback}</p>
              <p className="text-xs opacity-80" dir="rtl">
                {evalResult.arabicFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
          >
            {evalResult?.completed ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { CityEvent, PlayerProfile, CEFRLevel } from "../types";
import { CityEventEngine } from "../services/city/CityEventEngine";
import { speechService } from "../services/speechService";
import { sound } from "../utils/audioSynthesizer";
import {
  X,
  Volume2,
  Sparkles,
  AlertTriangle,
  Send,
  CheckCircle2,
  Coins,
  Compass,
  MessageSquare,
} from "lucide-react";

interface CityEventModalProps {
  event: CityEvent | null;
  player: PlayerProfile;
  onClose: () => void;
  onEventResolved: (eventId: string, xpEarned: number, coinsEarned: number) => void;
}

export const CityEventModal: React.FC<CityEventModalProps> = ({
  event,
  player,
  onClose,
  onEventResolved,
}) => {
  const [customInput, setCustomInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [evalResult, setEvalResult] = useState<{
    success: boolean;
    feedback: string;
    arabicFeedback: string;
    xpAward: number;
    coinsAward: number;
    cefrAssessment: CEFRLevel;
  } | null>(null);

  if (!event) return null;

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.95 });
  };

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    setCustomInput(event.sampleAnswers[index].text);
  };

  const handleSubmitResponse = () => {
    if (!customInput.trim() || evalResult?.success) return;

    const result = CityEventEngine.evaluateEventResponse(
      event,
      customInput,
      player.cefrLevel
    );

    setEvalResult(result);

    if (result.success) {
      sound.playSuccess();
      onEventResolved(event.id, result.xpAward, result.coinsAward);
    } else {
      sound.playClick();
    }
  };

  return (
    <div
      id="city-event-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="city-event-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                  {event.severity} City Situation
                </span>
                <span className="text-xs text-slate-400">
                  📍 {event.streetName || "Street Encounter"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {event.title}
              </h2>
            </div>
          </div>
          <button
            id="close-city-event-button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Situation Context Banner */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {event.description}
            </p>
            <p className="text-xs text-emerald-400" dir="rtl">
              {event.arabicDescription}
            </p>
          </div>

          {/* Interactive Prompt Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Live Conversational Encounter
              </span>
              <button
                onClick={() => handleSpeak(event.situationPrompt)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen
              </button>
            </div>
            <p className="text-base text-white font-semibold italic bg-slate-950/60 p-3.5 rounded-lg border border-indigo-900/40">
              "{event.situationPrompt}"
            </p>
          </div>

          {/* Response Selection or Custom Input */}
          {!evalResult?.success && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Choose a suggested response level or write your own:
                </label>
                <div className="space-y-2">
                  {event.sampleAnswers.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(idx)}
                      className={`w-full p-3 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 ${
                        selectedPreset === idx
                          ? "bg-blue-950/80 border-blue-500 text-blue-100"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400">
                          [{sample.level}] {sample.explanation}
                        </span>
                        {selectedPreset === idx && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <span className="italic">"{sample.text}"</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Your Spoken or Written English Response:
                </label>
                <div className="flex gap-2">
                  <input
                    id="event-response-input"
                    type="text"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      setSelectedPreset(null);
                    }}
                    placeholder="Type or speak what you would say in this situation..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    id="submit-event-response-button"
                    onClick={handleSubmitResponse}
                    disabled={!customInput.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Rewards */}
          {evalResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                evalResult.success
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/60 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {evalResult.success ? "Situation Resolved!" : "Needs Improvement"}
                </span>
                {evalResult.success && (
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> +{evalResult.xpAward} XP
                    </span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> +{evalResult.coinsAward} Coins
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
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" />
            {event.districtId.toUpperCase()} DISTRICT
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {evalResult?.success ? "Complete & Return" : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
};

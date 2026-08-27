import React, { useState } from "react";
import { EnvironmentalLearningObject } from "../../content/vocabulary/environmentalVocabulary";
import { VocabularyWord, PlayerProfile } from "../../types";
import { speechService } from "../../services/speechService";
import { sound } from "../../utils/audioSynthesizer";
import {
  X,
  Volume2,
  BookmarkPlus,
  CheckCircle2,
  Sparkles,
  BookOpen,
  HelpCircle,
  Award,
  Lightbulb,
  Check,
  Compass,
} from "lucide-react";

interface EnvironmentalObjectModalProps {
  object: EnvironmentalLearningObject | null;
  player: PlayerProfile;
  onClose: () => void;
  onAddVocabulary: (word: VocabularyWord) => void;
  onGainXpCoins: (xp: number, coins: number) => void;
}

export const EnvironmentalObjectModal: React.FC<EnvironmentalObjectModalProps> = ({
  object,
  player,
  onClose,
  onAddVocabulary,
  onGainXpCoins,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  if (!object) return null;

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.9, pitch: 1.0 });
  };

  const handleSaveToSRS = () => {
    if (isSaved) return;
    sound.playSuccess();
    onAddVocabulary(object.vocabularyWord);
    setIsSaved(true);
    onGainXpCoins(30, 15);
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered || !object.quiz) return;
    setSelectedQuizOption(index);
    setQuizAnswered(true);

    if (index === object.quiz.correctIndex) {
      sound.playSuccess();
      onGainXpCoins(50, 20);
    } else {
      sound.playClick();
      onGainXpCoins(10, 5);
    }
  };

  return (
    <div
      id="environmental-object-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="environmental-object-modal-container"
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Object Badge & Category */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              🏙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {object.level} Environmental English
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {object.category}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {object.name}
              </h2>
            </div>
          </div>

          <button
            id="close-env-object-button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Physical Signboard Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-inner relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80 font-bold">
                  PHYSICAL SIGNAGE IN CITY
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wider uppercase font-mono mt-1">
                  {object.signText}
                </h3>
                <span className="text-xs font-mono text-cyan-300 font-semibold mt-1 inline-block">
                  {object.phoneticIpa}
                </span>
              </div>

              {/* Pronounce Audio Button */}
              <button
                id="env-object-tts-btn"
                onClick={() => handleSpeak(object.signText)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg active:scale-95 transition-all shrink-0"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </button>
            </div>

            {/* Arabic Translation Banner */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Arabic Meaning:</span>
              <span className="text-base font-bold text-amber-200 font-arabic">
                {object.arabicTranslation}
              </span>
            </div>
          </div>

          {/* Educational Breakdown & Authentic Context */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Definition & Usage</span>
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {object.definition}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Practical Tip & Cultural Context</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                {object.practicalTip}
              </p>
              <p className="text-xs text-emerald-300/90 font-arabic leading-relaxed">
                💡 {object.arabicTip}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Authentic Sentence Example
              </span>
              <p className="text-sm italic text-blue-100 font-medium">
                "{object.exampleSentence}"
              </p>
            </div>
          </div>

          {/* Spaced Repetition SRS Save Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Add to Spaced Repetition Deck</span>
              </h4>
              <p className="text-xs text-slate-400">
                Connect this word to your SM-2 flashcard practice schedule (+30 XP)
              </p>
            </div>

            <button
              id="save-to-srs-deck-button"
              onClick={handleSaveToSRS}
              disabled={isSaved}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition-all shrink-0 ${
                isSaved
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Deck</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save Word</span>
                </>
              )}
            </button>
          </div>

          {/* Optional Interactive Mini Quiz */}
          {object.quiz && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Quick Comprehension Check (+50 XP)</span>
                </h4>
              </div>

              <p className="text-sm font-semibold text-white">
                {object.quiz.question}
              </p>
              <p className="text-xs text-slate-400 font-arabic">
                {object.quiz.arabicQuestion}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {object.quiz.options.map((option, idx) => {
                  const isSelected = selectedQuizOption === idx;
                  const isCorrect = idx === object.quiz?.correctIndex;

                  let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600";
                  if (quizAnswered) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200";
                    } else {
                      btnStyle = "bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuiz(idx)}
                      disabled={quizAnswered}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {quizAnswered && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 animate-fadeIn">
                  <span className="font-bold text-amber-400">Feedback: </span>
                  {object.quiz.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

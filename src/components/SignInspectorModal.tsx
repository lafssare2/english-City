import React, { useState } from "react";
import { CitySign, VocabularyWord, PlayerProfile } from "../types";
import { CitySignEngine } from "../services/city/CitySignEngine";
import { speechService } from "../services/speechService";
import { sound } from "../utils/audioSynthesizer";
import {
  X,
  Volume2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  Check,
  Award,
  Lightbulb,
} from "lucide-react";

interface SignInspectorModalProps {
  sign: CitySign | null;
  player: PlayerProfile;
  onClose: () => void;
  onAddVocabulary: (word: VocabularyWord) => void;
  onEarnRewards: (xp: number, coins: number) => void;
}

export const SignInspectorModal: React.FC<SignInspectorModalProps> = ({
  sign,
  player,
  onClose,
  onAddVocabulary,
  onEarnRewards,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
    coinsEarned: number;
  } | null>(null);
  const [addedWords, setAddedWords] = useState<Record<string, boolean>>({});

  if (!sign) return null;

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.9, pitch: 1.0 });
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizResult !== null) return;
    setSelectedOption(index);
    const result = CitySignEngine.evaluateSignQuiz(sign, index);
    setQuizResult({
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      xpEarned: result.xpEarned,
      coinsEarned: result.coinsEarned,
    });

    if (result.isCorrect) {
      sound.playSuccess();
      onEarnRewards(result.xpEarned, result.coinsEarned);
    } else {
      sound.playClick();
      onEarnRewards(result.xpEarned, result.coinsEarned);
    }
  };

  const handleAddWord = (word: VocabularyWord) => {
    sound.playClick();
    onAddVocabulary(word);
    setAddedWords((prev) => ({ ...prev, [word.id]: true }));
  };

  return (
    <div
      id="sign-inspector-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="sign-inspector-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {sign.cefrLevel} Environmental English
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  {sign.category.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Environmental English Sign
              </h2>
            </div>
          </div>
          <button
            id="close-sign-inspector-button"
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
          {/* Main Realistic Sign Box */}
          <div
            id="realistic-sign-board"
            className="p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/40 shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                id="sign-tts-button"
                onClick={() => handleSpeak(sign.text)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen
              </button>
            </div>

            <div className="space-y-2 pr-16">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wider uppercase font-mono">
                {sign.text}
              </h3>
              {sign.subtext && (
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  {sign.subtext}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {CitySignEngine.formatPhoneticPill(sign.pronunciationIpa)}
                </span>
                {sign.streetName && (
                  <span className="text-slate-400 font-medium">
                    📍 {sign.streetName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Arabic Meaning & Practical Tip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Arabic Meaning & Context (المعنى بالعربية)
              </span>
              <p
                className="text-sm text-emerald-300 font-medium leading-relaxed"
                dir="rtl"
              >
                {sign.arabicMeaning}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs font-semibold text-amber-400 block mb-1">
                💡 Real-World Tip
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {sign.practicalTip}
              </p>
              {sign.arabicTip && (
                <p
                  className="text-xs text-slate-400 mt-1"
                  dir="rtl"
                >
                  {sign.arabicTip}
                </p>
              )}
            </div>
          </div>

          {/* Extracted Vocabulary Words for SM-2 Flashcards */}
          {sign.vocabularyWords && sign.vocabularyWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Key Vocabulary in this Sign
                </h4>
                <span className="text-xs text-slate-400">
                  Click to add to your SM-2 Flashcard Vault
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sign.vocabularyWords.map((word) => {
                  const isAdded = addedWords[word.id];
                  return (
                    <div
                      key={word.id}
                      className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {word.word}
                            </span>
                            <span className="text-xs text-blue-400 font-mono">
                              {word.phonetic}
                            </span>
                          </div>
                          <p
                            className="text-xs text-emerald-400 font-medium mt-0.5"
                            dir="rtl"
                          >
                            {word.arabicTranslation}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSpeak(word.word)}
                          className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-[11px] text-slate-400 italic line-clamp-1">
                          "{word.example}"
                        </span>
                        <button
                          onClick={() => handleAddWord(word)}
                          disabled={isAdded}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all ${
                            isAdded
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-600 hover:bg-blue-500 text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" /> Added
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" /> Save to Vault
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Comprehension Quiz */}
          {sign.comprehensionQuestion && (
            <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                Quick Comprehension Check
              </div>
              <p className="text-sm font-semibold text-white">
                {sign.comprehensionQuestion.question}
              </p>
              {sign.comprehensionQuestion.arabicQuestion && (
                <p className="text-xs text-slate-400" dir="rtl">
                  {sign.comprehensionQuestion.arabicQuestion}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {sign.comprehensionQuestion.options.map((option, idx) => {
                  let btnStyle =
                    "bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500";
                  if (quizResult !== null) {
                    if (idx === sign.comprehensionQuestion?.correctIndex) {
                      btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200";
                    } else if (selectedOption === idx) {
                      btnStyle = "bg-rose-950 border-rose-500 text-rose-200";
                    } else {
                      btnStyle = "opacity-40 bg-slate-900 border-slate-800";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuiz(idx)}
                      disabled={quizResult !== null}
                      className={`p-3 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {quizResult !== null &&
                        idx === sign.comprehensionQuestion?.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                    </button>
                  );
                })}
              </div>

              {quizResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium mt-2 flex items-center justify-between ${
                    quizResult.isCorrect
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  <span>{quizResult.explanation}</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 flex-shrink-0 ml-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    +{quizResult.xpEarned} XP
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            id="finish-sign-inspection-button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

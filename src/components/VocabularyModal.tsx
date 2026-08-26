import React, { useState } from "react";
import { VocabularyWord, PlayerProfile, CEFRLevel } from "../types";
import { sound } from "../utils/audioSynthesizer";
import { voiceTTSService } from "../services/voice/TextToSpeechService";
import { FirestoreService } from "../services/db/FirestoreService";
import { apiPost } from "../lib/apiClient";
import {
  BookMarked,
  X,
  Volume2,
  Search,
  RotateCw,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";

interface VocabularyModalProps {
  vocabulary: VocabularyWord[];
  player: PlayerProfile;
  onClose: () => void;
  onUpdateWordMastery: (wordId: string, updatedWord: VocabularyWord) => void;
  onAddCustomWord: (word: VocabularyWord) => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  vocabulary,
  player,
  onClose,
  onUpdateWordMastery,
  onAddCustomWord,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "flashcards">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | "ALL">("ALL");

  // Flashcard Mode state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // New Word Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newArabic, setNewArabic] = useState("");
  const [newDefinition, setNewDefinition] = useState("");

  const filteredWords = vocabulary.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.arabicTranslation.includes(searchQuery) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "ALL" || w.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const activeCard = filteredWords[currentCardIndex] || filteredWords[0];

  // SuperMemo SM-2 Quality Rating Handler (0 to 5)
  const handleSM2Rating = async (quality: number) => {
    if (!activeCard) return;
    sound.playCoin();

    try {
      const data = await apiPost<{ success: boolean; updatedCard: any; xpAwarded: number }>("/api/player/srs-review", {
        cardId: activeCard.id,
        quality,
      });

      if (data.success && data.updatedCard) {
        const updated: VocabularyWord = {
          ...activeCard,
          ...data.updatedCard,
          timesReviewed: (activeCard.timesReviewed || 0) + 1,
        };

        onUpdateWordMastery(activeCard.id, updated);
        const userId = player.userId || player.id || "guest";
        FirestoreService.saveVocabularyWord(userId, updated);
      }
    } catch (e) {
      console.warn("SM-2 server review notice:", e);
    }

    setIsFlipped(false);
    if (currentCardIndex < filteredWords.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const handleCreateCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    sound.playXpSuccess();
    const created: VocabularyWord = {
      id: `v_custom_${Date.now()}`,
      word: newWord.trim(),
      phonetic: `/${newWord.trim().toLowerCase()}/`,
      partOfSpeech: "noun",
      definition: newDefinition.trim() || `Custom vocabulary term`,
      arabicTranslation: newArabic.trim() || "مفردة جديدة",
      example: `I am using the word ${newWord.trim()} in English City.`,
      level: player.level,
      mastery: 1,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      lapses: 0,
      retentionEstimate: 0.9,
      nextReviewDate: new Date().toISOString(),
      timesReviewed: 1,
      tags: ["custom", "user-added"],
    };

    onAddCustomWord(created);
    const userId = player.userId || player.id || "guest";
    FirestoreService.saveVocabularyWord(userId, created);

    setNewWord("");
    setNewArabic("");
    setNewDefinition("");
    setShowAddDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Vocabulary Vault & SuperMemo SM-2 SRS</span>
                <span className="text-xs font-arabic text-amber-300">
                  (بنك المفردات وخوارزمية التكرار المتباعد SM-2)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scientifically scheduled reviews to lock words into long-term memory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode("list");
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dictionary List
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode("flashcards");
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "flashcards"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SM-2 Flashcards
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowAddDialog(true);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Add Custom Word"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search English word or Arabic translation..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold mr-1">Level:</span>
            {(["ALL", "A1", "A2", "B1", "B2", "C1"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  sound.playClick();
                  setLevelFilter(lvl);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-mono-code font-bold transition-all ${
                  levelFilter === lvl
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {viewMode === "list" ? (
            /* Dictionary Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWords.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-white capitalize">
                          {item.word}
                        </span>
                        <span className="text-xs font-mono-code text-slate-400">
                          {item.phonetic}
                        </span>
                        <button
                          onClick={() => {
                            sound.playClick();
                            voiceTTSService.speak(item.word, { rate: 0.85 });
                          }}
                          className="p-1 rounded-md text-blue-400 hover:bg-blue-500/20"
                          title="Pronounce"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] bg-slate-800 text-slate-300 font-mono-code px-2 py-0.5 rounded-md">
                        {item.level}
                      </span>
                    </div>

                    <div className="text-sm font-arabic font-bold text-amber-300">
                      {item.arabicTranslation}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.definition}
                    </p>

                    <p className="text-[11px] text-blue-300/90 italic bg-blue-950/40 p-2 rounded-xl border border-blue-900/40">
                      "{item.example}"
                    </p>
                  </div>

                  {/* SM-2 Telemetry Badges */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>Interval: {item.interval || 1}d (EF {item.easeFactor || 2.5})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>Reviews: {item.repetitions || 0}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* SRS Flashcard Mode */
            filteredWords.length > 0 && activeCard ? (
              <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-6 py-6">
                <div className="flex items-center justify-between w-full text-xs text-slate-400">
                  <span>
                    Card {currentCardIndex + 1} of {filteredWords.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 px-3 py-1 rounded-full font-mono-code text-emerald-400 text-[11px]">
                      EF: {activeCard.easeFactor || 2.5} | Reps: {activeCard.repetitions || 0}
                    </span>
                    <span className="bg-slate-800 px-3 py-1 rounded-full font-mono-code text-amber-400">
                      CEFR {activeCard.level}
                    </span>
                  </div>
                </div>

                {/* The Flashcard Flip Container */}
                <div
                  onClick={() => {
                    sound.playClick();
                    setIsFlipped(!isFlipped);
                  }}
                  className="w-full h-80 rounded-3xl bg-slate-900 border-2 border-slate-700 hover:border-emerald-500/60 p-8 shadow-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group"
                >
                  <div className="absolute top-4 right-4 text-xs text-slate-500 flex items-center gap-1 group-hover:text-emerald-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click card to flip</span>
                  </div>

                  {!isFlipped ? (
                    /* Front: English Word + Audio */
                    <div className="flex flex-col items-center gap-3 animate-fadeIn">
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Target Term
                      </span>
                      <h2 className="font-display font-black text-4xl sm:text-5xl text-white capitalize">
                        {activeCard.word}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono-code text-base text-slate-400">
                          {activeCard.phonetic}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            voiceTTSService.speak(activeCard.word, { rate: 0.85 });
                          }}
                          className="p-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/40"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-xs text-slate-500 mt-4">
                        (Tap anywhere to reveal Arabic meaning & definition)
                      </span>
                    </div>
                  ) : (
                    /* Back: Arabic Meaning + Definition + Example */
                    <div className="flex flex-col items-center gap-3 animate-fadeIn">
                      <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                        Meaning & Context
                      </span>
                      <h3 className="font-arabic font-black text-3xl sm:text-4xl text-amber-300">
                        {activeCard.arabicTranslation}
                      </h3>
                      <p className="text-sm text-slate-200 mt-1 max-w-md">
                        {activeCard.definition}
                      </p>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 mt-2 max-w-md text-xs text-blue-300 italic">
                        "{activeCard.example}"
                      </div>
                    </div>
                  )}
                </div>

                {/* SuperMemo SM-2 Self-Rating Bar (Revealed when flipped) */}
                {isFlipped && (
                  <div className="w-full flex flex-col items-center gap-2 animate-fadeIn">
                    <span className="text-xs text-slate-400 font-medium">
                      Rate recall accuracy (SuperMemo SM-2 grading):
                    </span>
                    <div className="grid grid-cols-5 gap-2 w-full">
                      <button
                        onClick={() => handleSM2Rating(1)}
                        className="py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center"
                      >
                        <span>Again (0-1)</span>
                        <span className="text-[9px] text-rose-400">Reset I=1d</span>
                      </button>
                      <button
                        onClick={() => handleSM2Rating(2)}
                        className="py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center"
                      >
                        <span>Hard (2)</span>
                        <span className="text-[9px] text-amber-400">EF -0.15</span>
                      </button>
                      <button
                        onClick={() => handleSM2Rating(3)}
                        className="py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center"
                      >
                        <span>Good (3)</span>
                        <span className="text-[9px] text-blue-400">Pass</span>
                      </button>
                      <button
                        onClick={() => handleSM2Rating(4)}
                        className="py-2.5 rounded-xl bg-teal-950/60 hover:bg-teal-900 border border-teal-800 text-teal-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center"
                      >
                        <span>Easy (4)</span>
                        <span className="text-[9px] text-teal-400">Next I*EF</span>
                      </button>
                      <button
                        onClick={() => handleSM2Rating(5)}
                        className="py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center"
                      >
                        <span>Master (5)</span>
                        <span className="text-[9px] text-emerald-400">EF +0.10</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                No vocabulary words match the current filter.
              </div>
            )
          )}
        </div>

        {/* Add Custom Word Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <form
              onSubmit={handleCreateCustomWord}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-base text-white">
                  Add Custom Vocabulary Word
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">English Word</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. Atmosphere"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Arabic Translation</label>
                <input
                  type="text"
                  required
                  value={newArabic}
                  onChange={(e) => setNewArabic(e.target.value)}
                  placeholder="e.g. الغلاف الجوي / الجو العام"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-arabic"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">English Definition</label>
                <input
                  type="text"
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="e.g. The overall mood or feeling of a place"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors mt-2"
              >
                Save to Vault (+25 XP)
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

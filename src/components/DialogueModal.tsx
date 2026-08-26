import React, { useState, useEffect, useRef } from "react";
import {
  NPC,
  PlayerProfile,
  Mission,
  CityLocation,
  DialogueMessage,
  VocabularyWord,
  CorrectionItem,
  NPCMemory,
} from "../types";
import { sound } from "../utils/audioSynthesizer";
import { voiceRecognitionService, voiceTTSService } from "../services/voice/TextToSpeechService";
import { FirestoreService } from "../services/db/FirestoreService";
import { apiPost } from "../lib/apiClient";
import confetti from "canvas-confetti";
import {
  Mic,
  Send,
  Volume2,
  X,
  Sparkles,
  Heart,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Award,
  Brain,
  History,
} from "lucide-react";

interface DialogueModalProps {
  npc: NPC;
  player: PlayerProfile;
  activeMission?: Mission;
  currentLocation: CityLocation;
  timeOfDay: string;
  onClose: () => void;
  onUpdatePlayer: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onAddVocabulary: (word: VocabularyWord) => void;
  onCompleteObjective: (missionId: string, objectiveId: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  player,
  activeMission,
  currentLocation,
  timeOfDay,
  onClose,
  onUpdatePlayer,
  onAddVocabulary,
  onCompleteObjective,
}) => {
  const [messages, setMessages] = useState<DialogueMessage[]>([
    {
      id: "msg_init",
      speaker: "npc",
      speakerName: npc.name,
      text: npc.greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [npcMemories, setNpcMemories] = useState<NPCMemory[]>([]);
  const [hasPriorHistory, setHasPriorHistory] = useState(false);
  const [activeWordPopover, setActiveWordPopover] = useState<{
    word: string;
    definition: string;
    arabic: string;
    phonetic: string;
    example: string;
  } | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionCorrections, setSessionCorrections] = useState<CorrectionItem[]>([]);
  const [sessionDiscoveredVocab, setSessionDiscoveredVocab] = useState<VocabularyWord[]>([]);
  const [sessionScores, setSessionScores] = useState({ fluency: 85, grammar: 88 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingAi]);

  // Load Persistent NPC Memories & Prior Chat History from Firestore
  useEffect(() => {
    const userId = player.userId || player.id || "guest";
    
    // Load memories
    FirestoreService.loadNPCMemories(userId, npc.id).then((mems) => {
      setNpcMemories(mems);
    });

    // Load past conversation thread if exists
    FirestoreService.loadConversation(userId, npc.id).then((saved) => {
      if (saved && saved.messages && saved.messages.length > 0) {
        setHasPriorHistory(true);
        // Include previous messages with separator
        setMessages([
          ...saved.messages.slice(-6),
          {
            id: `msg_resume_${Date.now()}`,
            speaker: "npc",
            speakerName: npc.name,
            text: `Welcome back, ${player.name}! Good to see you again at ${npc.locationName}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    });

    // Initial greeting audio
    voiceTTSService.speak(npc.greetingText, {
      rate: speechRate,
      pitch: npc.voicePitch,
      gender: npc.voiceGender,
    });

    return () => {
      voiceTTSService.stop();
      voiceRecognitionService.stopListening();
    };
  }, [npc]);

  // Toggle Voice Input / Speech Recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      voiceRecognitionService.stopListening();
      setIsListening(false);
      return;
    }

    sound.playClick();
    if (!voiceRecognitionService.isSupported()) {
      alert("Speech recognition is not supported in this browser. You can type your message below!");
      return;
    }

    setIsListening(true);
    voiceRecognitionService.startListening({
      onResult: (transcript, isFinal) => {
        setInputVal(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        console.warn("Recognition error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  // Submit Player Message to NPC Conversation AI Server
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoadingAi) return;

    sound.playDialoguePop();
    const playerMsg: DialogueMessage = {
      id: `msg_${Date.now()}`,
      speaker: "player",
      speakerName: player.name,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, playerMsg];
    setMessages(newMessages);
    setInputVal("");
    if (isListening) {
      voiceRecognitionService.stopListening();
      setIsListening(false);
    }
    setIsLoadingAi(true);

    try {
      const data = await apiPost("/api/ai/npc-chat", {
        npc,
        player,
        conversationHistory: newMessages.map((m) => ({ speaker: m.speakerName, text: m.text })),
        playerMessage: text,
        activeMission,
        memories: npcMemories.map((m) => ({ summary: m.summary, importance: m.importance })),
        location: currentLocation,
        timeOfDay,
      });

      const npcMsg: DialogueMessage = {
        id: `msg_npc_${Date.now()}`,
        speaker: "npc",
        speakerName: npc.name,
        text: data.reply || "That sounds interesting!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        corrections: data.corrections || [],
        vocabulary: data.discoveredVocabulary || [],
      };

      const updatedHistory = [...newMessages, npcMsg];
      setMessages(updatedHistory);
      sound.playDialoguePop();

      // Read NPC response via Speech Synthesis
      voiceTTSService.speak(npcMsg.text, {
        rate: speechRate,
        pitch: npc.voicePitch,
        gender: npc.voiceGender,
      });

      // Check for mission progression
      if (data.missionObjectiveCompleted && activeMission) {
        sound.playXpSuccess();
        const nextIncomplete = activeMission.objectives.find((o) => !o.completed);
        if (nextIncomplete) {
          onCompleteObjective(activeMission.id, nextIncomplete.id);
        }
      }

      // Collect feedback metrics
      if (data.corrections && data.corrections.length > 0) {
        setSessionCorrections((prev) => [...prev, ...data.corrections]);
      }
      if (data.discoveredVocabulary && data.discoveredVocabulary.length > 0) {
        const mappedVocab: VocabularyWord[] = data.discoveredVocabulary.map((v: any) => ({
          id: `v_${v.word.toLowerCase()}_${Date.now()}`,
          word: v.word,
          phonetic: v.phonetic || `/${v.word}/`,
          partOfSpeech: v.partOfSpeech || "noun",
          definition: v.definition || "Contextual vocabulary term",
          arabicTranslation: v.arabicTranslation || "مفردة لغوية",
          example: v.example || "Used in conversation",
          level: v.level || player.level,
          mastery: 1,
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          lapses: 0,
          retentionEstimate: 0.9,
          nextReviewDate: new Date().toISOString(),
          timesReviewed: 0,
          tags: ["dialogue", npc.name.toLowerCase()],
        }));
        setSessionDiscoveredVocab((prev) => [...prev, ...mappedVocab]);
      }
      if (data.evaluation) {
        setSessionScores({
          fluency: data.evaluation.fluencyScore || 85,
          grammar: data.evaluation.grammarScore || 88,
        });

        // Server-side persistent telemetry update
        apiPost("/api/player/telemetry-update", {
          interaction: {
            dialogueFluency: data.evaluation.fluencyScore,
            dialogueGrammar: data.evaluation.grammarScore,
            vocabularyUsedCount: (data.discoveredVocabulary || []).length,
            speakingDurationSec: 15,
          },
        })
          .then((res) => {
            if (res.success && res.updatedScores) {
              onUpdatePlayer((prev) => ({
                ...prev,
                skillScores: res.updatedScores,
                overallScore: Math.round(
                  ((Object.values(res.updatedScores) as number[]).reduce((a, b) => a + b, 0) || 0) / 7
                ),
                cefrLevel: res.calculatedCEFR || prev.cefrLevel,
              }));
            }
          })
          .catch(() => {});
      }

      // Persist conversation session to Firestore
      const userId = player.userId || player.id || "guest";
      FirestoreService.saveConversation(userId, {
        id: `convo_${npc.id}_${userId}`,
        npcId: npc.id,
        userId,
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messages: updatedHistory,
        memoriesExtracted: false,
      });

      // Update Player Progress & Server-authoritative stats
      onUpdatePlayer((prev) => ({
        ...prev,
        totalConversations: prev.totalConversations + 1,
        totalSpeakingSeconds: prev.totalSpeakingSeconds + 15,
        xp: prev.xp + 25,
        coins: prev.coins + 5,
      }));
    } catch (err) {
      console.error("Error chatting with NPC:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          speaker: "npc",
          speakerName: npc.name,
          text: "I see! Could you elaborate a bit more on that?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Handle Clicking on a word in dialogue bubbles to view Arabic/Phonetic dictionary popover
  const handleWordClick = (rawWord: string) => {
    const clean = rawWord.replace(/[.,!?;:"'()]/g, "").toLowerCase().trim();
    if (!clean || clean.length < 3) return;

    sound.playClick();

    const arabicDict: Record<string, { ar: string; def: string; ipa: string; ex: string }> = {
      coffee: { ar: "قهوة", def: "A hot brewed beverage made from roasted coffee beans", ipa: "/ˈkɒf.i/", ex: "Can I have a hot coffee?" },
      cappuccino: { ar: "كابتشينو", def: "Espresso with steamed milk foam", ipa: "/ˌkæp.əˈtʃiː.noʊ/", ex: "One double cappuccino please." },
      passport: { ar: "جواز سفر", def: "Official travel identification document", ipa: "/ˈpæs.pɔːrt/", ex: "Please present your passport." },
      customs: { ar: "الجمارك", def: "Government agency regulating imported goods", ipa: "/ˈkʌs.təmz/", ex: "Pass through the customs gate." },
      receipt: { ar: "إيصال / فاتورة", def: "Printed proof of purchase", ipa: "/rɪˈsiːt/", ex: "Do you need your receipt?" },
      recommend: { ar: "يوصي / يقترح", def: "To advise or suggest something good", ipa: "/ˌrek.əˈmend/", ex: "What do you recommend?" },
      destination: { ar: "الوجهة / المقصد", def: "The place you are traveling to", ipa: "/ˌdes.təˈneɪ.ʃən/", ex: "What is your destination?" },
      reservation: { ar: "حجز مسبق", def: "An arrangement securing a room or table", ipa: "/ˌrez.ɚˈveɪ.ʃən/", ex: "I have a hotel reservation." },
      prescription: { ar: "وصفة طبية", def: "Doctor's authorized medication note", ipa: "/prɪˈskrɪp.ʃən/", ex: "Take this prescription to the pharmacy." },
      amenities: { ar: "المرافق والخدمات", def: "Desirable features of a building or room", ipa: "/əˈmen.ə.t̬iz/", ex: "Hotel amenities include pool and gym." },
      complimentary: { ar: "مجاني / كضيافة", def: "Provided free of charge", ipa: "/ˌkɑːm.pləˈmen.tər.i/", ex: "Enjoy complimentary breakfast." },
      symptoms: { ar: "أعراض المرض", def: "Physical signs indicating illness", ipa: "/ˈsɪmp.təmz/", ex: "Describe your symptoms." },
      interview: { ar: "مقابلة وظيفية", def: "Formal meeting to assess job candidates", ipa: "/ˈɪn.t̬ɚ.vjuː/", ex: "Ready for your tech interview?" },
    };

    const found = arabicDict[clean] || {
      ar: "مفردة لغوية سياقية",
      def: `English vocabulary in context: "${clean}"`,
      ipa: `/${clean}/`,
      ex: `Used in conversation with ${npc.name}`,
    };

    setActiveWordPopover({
      word: clean,
      definition: found.def,
      arabic: found.ar,
      phonetic: found.ipa,
      example: found.ex,
    });
  };

  // Add word from popover to Spaced Repetition (SM-2) vocabulary bank
  const handleSaveWordToVocab = () => {
    if (!activeWordPopover) return;

    sound.playCoin();
    const newVocab: VocabularyWord = {
      id: `v_${activeWordPopover.word}_${Date.now()}`,
      word: activeWordPopover.word,
      phonetic: activeWordPopover.phonetic,
      partOfSpeech: "noun",
      definition: activeWordPopover.definition,
      arabicTranslation: activeWordPopover.arabic,
      example: activeWordPopover.example,
      level: player.level,
      mastery: 1,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      lapses: 0,
      retentionEstimate: 0.9,
      nextReviewDate: new Date().toISOString(),
      timesReviewed: 0,
      tags: ["dialogue", "saved"],
    };

    onAddVocabulary(newVocab);
    const userId = player.userId || player.id || "guest";
    FirestoreService.saveVocabularyWord(userId, newVocab);
    setActiveWordPopover(null);
  };

  // Conclude Conversation and Trigger Long-term Memory Extraction
  const handleEndConversation = async () => {
    sound.playLevelUp();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (_) {}

    // Auto-extract long-term memories in background
    if (messages.length >= 3) {
      apiPost("/api/player/extract-memories", {
        npcId: npc.id,
        npcName: npc.name,
        history: messages.map((m) => ({ speaker: m.speakerName, text: m.text })),
      })
        .then((res) => {
          if (res.extractedMemories && res.extractedMemories.length > 0) {
            const userId = player.userId || player.id || "guest";
            res.extractedMemories.forEach((mem: any) => {
              const memoryObj: NPCMemory = {
                id: mem.id || `mem_${npc.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                npcId: npc.id,
                userId,
                memoryType: mem.memoryType || "personal_fact",
                summary: mem.summary,
                importance: mem.importance || 5,
                confidence: mem.confidence || 0.9,
                emotionalTone: mem.emotionalTone || "positive",
                createdAt: mem.createdAt || new Date().toISOString(),
              };
              FirestoreService.saveNPCMemory(userId, memoryObj);
            });
          }
        })
        .catch(() => {});
    }

    setShowFeedbackModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Main Dialogue Box */}
      <div className="relative w-full max-w-3xl h-[92vh] sm:h-[84vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar with NPC Details & Relationship */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
          {/* NPC Profile */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/10"
              style={{ backgroundColor: npc.avatarColor }}
            >
              {npc.avatarEmoji}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-100">
                  {npc.name}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono-code px-2 py-0.5 rounded-full">
                  {npc.occupation}
                </span>
                {npcMemories.length > 0 && (
                  <span
                    className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30"
                    title="NPC has persistent memories about you from prior sessions"
                  >
                    <Brain className="w-3 h-3" />
                    <span>{npcMemories.length} Memories</span>
                  </span>
                )}
                {hasPriorHistory && (
                  <span
                    className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30"
                    title="Continued previous conversation"
                  >
                    <History className="w-3 h-3" />
                    <span>Thread Active</span>
                  </span>
                )}
              </div>
              {/* Relationship Score */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span className="text-[11px] font-semibold text-rose-300">
                  {npc.relationshipTier} ({npc.relationshipScore}/100)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Finish */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = speechRate === 0.75 ? 0.95 : speechRate === 0.95 ? 1.15 : 0.75;
                setSpeechRate(next);
                sound.playClick();
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-code transition-colors"
              title="Change Speech Speed"
            >
              🔊 {speechRate}x Speed
            </button>

            <button
              id="btn_dialogue_finish"
              onClick={handleEndConversation}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Finish & Review</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Mission Hint Bar (if any) */}
        {activeMission && (
          <div className="bg-amber-950/30 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-amber-300">
                Quest Goal: {activeMission.title}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any word in dialogue for instant Arabic translation
            </span>
          </div>
        )}

        {/* Chat Messages Scrolling History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {messages.map((msg) => {
            const isNpc = msg.speaker === "npc";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isNpc ? "items-start" : "items-end"} gap-1`}
              >
                {/* Speaker Label */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {msg.speakerName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-code">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-sm sm:text-base leading-relaxed shadow-lg ${
                    isNpc
                      ? "bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-tl-sm"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                  }`}
                >
                  {/* Words rendered as clickable tokens */}
                  <p className="flex flex-wrap gap-x-1 gap-y-0.5">
                    {msg.text.split(" ").map((word, wIdx) => (
                      <span
                        key={wIdx}
                        onClick={() => handleWordClick(word)}
                        className="cursor-pointer hover:text-amber-300 hover:underline transition-colors select-text"
                        title="Click to see meaning & Arabic translation"
                      >
                        {word}
                      </span>
                    ))}
                  </p>

                  {/* Audio Repeat Button on NPC messages */}
                  {isNpc && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        voiceTTSService.speak(msg.text, {
                          rate: speechRate,
                          pitch: npc.voicePitch,
                          gender: npc.voiceGender,
                        });
                      }}
                      className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      title="Hear NPC voice pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen again</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking Indicator */}
          {isLoadingAi && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{npc.name} is thinking & responding...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Word Translation Popover Card */}
        {activeWordPopover && (
          <div className="mx-4 mb-3 p-3.5 bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 text-base capitalize">
                  {activeWordPopover.word}
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  {activeWordPopover.phonetic}
                </span>
                <button
                  onClick={() => voiceTTSService.speak(activeWordPopover.word, { rate: 0.8 })}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Pronounce word"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-300">{activeWordPopover.definition}</span>
              <span className="text-xs text-amber-300 font-arabic font-semibold mt-0.5">
                الترجمة: {activeWordPopover.arabic}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleSaveWordToVocab}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>+ Save Word</span>
              </button>
              <button
                onClick={() => setActiveWordPopover(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Conversation Input Bar with Voice & Keyboard */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-2">
          {/* Quick Dialogue Prompts for English Learners */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
              Suggestions:
            </span>
            {npc.defaultTopics.slice(0, 3).map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  const promptMap: Record<string, string> = {
                    "Passport Control": "Here is my passport. I am visiting English City to study and explore.",
                    "Luggage & Customs": "Could you please tell me where the baggage claim is?",
                    "Getting to Downtown": "What is the best way to get to Downtown from the airport?",
                    "Coffee & Tea Menu": "Could I please see your coffee and tea menu?",
                    "Fresh Baked Goods": "What fresh pastries do you recommend today?",
                    "Ordering Custom Drinks": "I would like an iced oat latte with vanilla syrup, please.",
                    "City Directions": "Could you take me to the Downtown City Center, please?",
                    "Room Bookings": "Hello, I would like to check in under the name Morgan.",
                    "Tech Careers": "Hello! I am excited to interview for the software engineer role.",
                    "Describing Symptoms": "I have had a mild headache and sore throat for two days.",
                  };
                  const sample = promptMap[topic] || `Could you tell me more about ${topic}?`;
                  setInputVal(sample);
                }}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-xl whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Main Input Row */}
          <div className="flex items-center gap-2">
            <button
              id="btn_voice_input_toggle"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title={isListening ? "Listening..." : "Speak with Voice (STT)"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              id="input_player_speech"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                isListening
                  ? "Listening to your voice in English..."
                  : "Type your message or click mic to speak..."
              }
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />

            <button
              id="btn_send_dialogue_msg"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoadingAi}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white p-3 rounded-2xl font-bold transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Post-Conversation Review & Feedback Sheet Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-lg animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Conversation Mastery Report
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  onClose();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scores & Rewards Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Fluency</span>
                <p className="font-display font-bold text-xl text-blue-400">{sessionScores.fluency}%</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Grammar</span>
                <p className="font-display font-bold text-xl text-emerald-400">{sessionScores.grammar}%</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">XP Earned</span>
                <p className="font-display font-bold text-xl text-amber-400">+120 XP</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Coins</span>
                <p className="font-display font-bold text-xl text-amber-300">+35 Coins</p>
              </div>
            </div>

            {/* Grammar Corrections */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Grammar & Natural Expression Tips</span>
              </h4>
              {sessionCorrections.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {sessionCorrections.map((corr, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl text-xs flex flex-col gap-1"
                    >
                      {corr.original && (
                        <div className="text-rose-400 line-through">
                          Said: "{corr.original}"
                        </div>
                      )}
                      <div className="text-emerald-400 font-semibold">
                        Better: "{corr.corrected}"
                      </div>
                      <div className="text-slate-400 mt-1">{corr.explanation}</div>
                      {corr.arabicExplanation && (
                        <div className="text-amber-300 font-arabic text-[11px] mt-0.5">
                          الشرح بالعربية: {corr.arabicExplanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Flawless conversation! Your grammar was natural and accurate.</span>
                </div>
              )}
            </div>

            {/* Target Vocabulary Discovered */}
            {sessionDiscoveredVocab.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-blue-400" />
                  <span>Target Words Used in This Chat</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sessionDiscoveredVocab.map((w, wIdx) => (
                    <div
                      key={wIdx}
                      className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-white capitalize">{w.word}</span>
                        <span className="text-[10px] text-amber-300 font-arabic">{w.arabicTranslation}</span>
                      </div>
                      <button
                        onClick={() => onAddVocabulary(w)}
                        className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg font-medium"
                      >
                        + Deck
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done Button */}
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl text-sm shadow-xl transition-all"
            >
              Continue Exploring English City
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

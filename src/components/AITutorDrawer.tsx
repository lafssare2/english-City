import React, { useState } from "react";
import { PlayerProfile } from "../types";
import { sound, speakText } from "../utils/audioSynthesizer";
import {
  Bot,
  X,
  Send,
  Volume2,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface AITutorDrawerProps {
  player: PlayerProfile;
  onClose: () => void;
}

interface TutorMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  arabicSummary?: string;
  examples?: string[];
  grammarTip?: string;
  suggestedPractice?: string;
  timestamp: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ player, onClose }) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "tut_welcome",
      sender: "tutor",
      text: `Hello ${player.name}! I am Professor Lily, your 24/7 AI English Tutor. You can ask me any question about English grammar, polite expressions, vocabulary, pronunciation, or how to say something naturally!`,
      arabicSummary: "مرحباً بك! أنا معلمتك الذكية لمساعدتك في أي سؤال حول قواعد اللغة، والمفردات، والتعبير الطبيعي في المدينة.",
      examples: [
        "How do I politely order a coffee in a cafe?",
        "Why do we say 'two coffees' instead of 'two coffee'?",
      ],
      grammarTip: "Use 'Could I please have...' for standard polite requests in English-speaking countries.",
      suggestedPractice: "Visit Sarah's Artisan Coffee in Downtown to practice ordering!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskTutor = async (questionToAsk?: string) => {
    const query = (questionToAsk || inputVal).trim();
    if (!query || isLoading) return;

    sound.playDialoguePop();
    const userMsg: TutorMessage = {
      id: `tut_user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerQuery: query,
          player,
          recentContext: { level: player.level, supportLanguage: player.supportLanguage },
        }),
      });

      const data = await res.json();
      const tutorMsg: TutorMessage = {
        id: `tut_reply_${Date.now()}`,
        sender: "tutor",
        text: data.answer || "Here is a helpful tip on that topic!",
        arabicSummary: data.arabicSummary,
        examples: data.examples,
        grammarTip: data.grammarTip,
        suggestedPractice: data.suggestedPractice,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
      sound.playDialoguePop();
      speakText(tutorMsg.text, { rate: 0.95 });
    } catch (err) {
      console.error("Tutor error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tut_err_${Date.now()}`,
          sender: "tutor",
          text: "I am always here to assist your English journey! Feel free to ask about grammar, vocabulary, or polite phrasing.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Slide-out Drawer Panel */}
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <span>Professor Lily</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono-code px-2 py-0.5 rounded-full">
                  AI Language Mentor
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-arabic">
                مرشدتك الذكية لتعلم وتطوير اللغة الإنجليزية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            "Why is 'I want two coffee' wrong?",
            "How to order politely in cafes?",
            "Explain Present Perfect vs Past Simple",
            "3 common English idioms",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleAskTutor(prompt)}
              className="bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-xl whitespace-nowrap border border-slate-700/60 transition-all active:scale-95 text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {messages.map((m) => {
            const isTutor = m.sender === "tutor";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isTutor ? "items-start" : "items-end"} gap-1`}
              >
                <span className="text-[10px] text-slate-500 font-semibold px-1">
                  {isTutor ? "Professor Lily" : player.name}
                </span>

                <div
                  className={`rounded-3xl p-4 text-xs sm:text-sm leading-relaxed max-w-[90%] shadow-lg flex flex-col gap-2.5 ${
                    isTutor
                      ? "bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-tl-sm"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Arabic translation summary */}
                  {m.arabicSummary && (
                    <div className="bg-slate-950/60 border border-slate-700/50 p-2.5 rounded-xl text-amber-300 font-arabic text-xs leading-relaxed">
                      {m.arabicSummary}
                    </div>
                  )}

                  {/* Examples */}
                  {m.examples && m.examples.length > 0 && (
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-700/40 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Natural Examples:
                      </span>
                      {m.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="text-xs text-blue-300 italic flex items-center gap-1.5">
                          <span>•</span>
                          <span>"{ex}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grammar rule tip */}
                  {m.grammarTip && (
                    <div className="flex items-start gap-2 text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-xl">
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                      <span>{m.grammarTip}</span>
                    </div>
                  )}

                  {/* Suggested practice in English City */}
                  {m.suggestedPractice && (
                    <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/20 p-2 rounded-xl">
                      <Compass className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <span>In-City Practice: {m.suggestedPractice}</span>
                    </div>
                  )}

                  {/* Audio Listen */}
                  {isTutor && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        speakText(m.text, { rate: 0.95 });
                      }}
                      className="self-start text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen to explanation</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Professor Lily is typing an explanation...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 flex items-center gap-2">
          <input
            id="input_ai_tutor_query"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskTutor()}
            placeholder="Ask Professor Lily any English question..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            id="btn_send_tutor_query"
            onClick={() => handleAskTutor()}
            disabled={!inputVal.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3 rounded-2xl transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

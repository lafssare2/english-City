import React, { useState } from "react";
import { DistrictId, PlayerProfile } from "../types";
import { DISTRICTS } from "../data/initialData";
import { TransitEngine, TRANSIT_LINES } from "../services/city/TransitEngine";
import { speechService } from "../services/speechService";
import { sound } from "../utils/audioSynthesizer";
import {
  X,
  Train,
  Car,
  Bus,
  Volume2,
  Compass,
  ArrowRight,
  Sparkles,
  Coins,
  CheckCircle2,
} from "lucide-react";

interface TransitModalProps {
  currentDistrictId: DistrictId;
  player: PlayerProfile;
  onClose: () => void;
  onTravel: (districtId: DistrictId) => void;
}

export const TransitModal: React.FC<TransitModalProps> = ({
  currentDistrictId,
  player,
  onClose,
  onTravel,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>(
    currentDistrictId === "downtown" ? "transportation" : "downtown"
  );
  const [transitMode, setTransitMode] = useState<"subway" | "taxi" | "bus">(
    "subway"
  );
  const [dialogueDone, setDialogueDone] = useState(false);

  const dialogueInfo = TransitEngine.getTransitDialoguePrompt(
    currentDistrictId,
    selectedDistrict,
    transitMode
  );

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.95 });
  };

  const handleBoard = () => {
    sound.playSuccess();
    onTravel(selectedDistrict);
    onClose();
  };

  return (
    <div
      id="transit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="transit-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Metropolitan Public Transit
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                City Transit & Navigation Network
              </h2>
            </div>
          </div>
          <button
            id="close-transit-modal-button"
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
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setTransitMode("subway");
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                transitMode === "subway"
                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <Train className="w-5 h-5" />
              <span className="text-xs font-bold">Subway Metro</span>
              <span className="text-[10px] opacity-75">Fast • 5 Coins</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setTransitMode("taxi");
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                transitMode === "taxi"
                  ? "bg-amber-600/20 border-amber-500 text-amber-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-xs font-bold">Yellow Cab Taxi</span>
              <span className="text-[10px] opacity-75">Direct • 15 Coins</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setTransitMode("bus");
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                transitMode === "bus"
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <Bus className="w-5 h-5" />
              <span className="text-xs font-bold">City Bus</span>
              <span className="text-[10px] opacity-75">Scenic • 2 Coins</span>
            </button>
          </div>

          {/* Destination District Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Select Destination District:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedDistrict(d.id);
                  }}
                  disabled={d.id === currentDistrictId}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                    d.id === selectedDistrict
                      ? "bg-blue-600 border-blue-400 text-white font-bold shadow-md"
                      : d.id === currentDistrictId
                      ? "bg-slate-950 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                      : "bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <div className="truncate">{d.name}</div>
                  <div className="text-[10px] opacity-70 truncate" dir="rtl">
                    {d.arabicName}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Communicative Transit Interaction Challenge */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Transit Interaction
              </span>
              <button
                onClick={() => handleSpeak(dialogueInfo.prompt)}
                className="px-2 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all"
              >
                Listen
              </button>
            </div>
            <p className="text-sm text-white font-semibold italic bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              {dialogueInfo.prompt}
            </p>
            <p className="text-xs text-slate-400" dir="rtl">
              {dialogueInfo.arabicHelp}
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-400 font-medium block">
                Practice saying or select your response:
              </span>
              {dialogueInfo.expectedPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSpeak(phrase);
                    setDialogueDone(true);
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-950 border border-slate-700 hover:border-blue-500 text-left text-xs text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="italic">"{phrase}"</span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Route:</span>
            <span className="text-white font-semibold">
              {currentDistrictId} → {selectedDistrict}
            </span>
          </div>

          <button
            id="confirm-travel-button"
            onClick={handleBoard}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            Board Transit <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

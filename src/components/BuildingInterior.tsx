import React, { useState } from "react";
import {
  CityLocation,
  NPC,
  PlayerProfile,
  InteractiveObject,
  RoomData,
  FloorData,
  CitySign,
  RealWorldTask,
  VocabularyWord,
  TimeOfDay,
} from "../types";
import { WorldEngine } from "../services/city/WorldEngine";
import { NPCScheduleEngine } from "../services/city/NPCScheduleEngine";
import { sound } from "../utils/audioSynthesizer";
import { speechService } from "../services/speechService";
import { SignInspectorModal } from "./SignInspectorModal";
import { RealWorldTaskModal } from "./RealWorldTaskModal";
import {
  DoorClosed,
  MessageSquare,
  Sparkles,
  BookOpen,
  Coins,
  CheckCircle2,
  Volume2,
  Info,
  ArrowLeft,
  Layers,
  MapPin,
  Lightbulb,
  CheckSquare,
  ChevronRight,
} from "lucide-react";

interface BuildingInteriorProps {
  location: CityLocation;
  npcs: NPC[];
  player: PlayerProfile;
  timeOfDay?: TimeOfDay;
  onExit: () => void;
  onTalkToNpc: (npc: NPC) => void;
  onGainXpCoins: (xp: number, coins: number) => void;
  onAddVocabulary?: (word: VocabularyWord) => void;
}

export const BuildingInterior: React.FC<BuildingInteriorProps> = ({
  location,
  npcs,
  player,
  timeOfDay = "afternoon",
  onExit,
  onTalkToNpc,
  onGainXpCoins,
  onAddVocabulary,
}) => {
  // Query World Engine for modular floors and rooms
  const buildingData = WorldEngine.getBuildingById(location.id);
  const floors: FloorData[] = buildingData?.floors || [
    {
      floorNumber: 1,
      name: "Main Floor",
      arabicName: "الطابق الرئيسي",
      rooms: [
        {
          id: "default_room",
          name: "Main Area",
          arabicName: "القاعة الرئيسية",
          floorNumber: 1,
          description: location.description,
          interactiveObjects: location.interactiveObjects || [],
          signs: [],
          npcsHere: npcs.map((n) => n.id),
          availableTasks: [],
        },
      ],
    },
  ];

  const [activeFloorIndex, setActiveFloorIndex] = useState<number>(0);
  const currentFloor = floors[activeFloorIndex] || floors[0];

  const [activeRoomId, setActiveRoomId] = useState<string>(
    currentFloor.rooms[0]?.id || "default_room"
  );
  const currentRoom: RoomData =
    currentFloor.rooms.find((r) => r.id === activeRoomId) ||
    currentFloor.rooms[0] || {
      id: "fallback_room",
      name: "Main Lobby",
      arabicName: "البهو الرئيسي",
      floorNumber: 1,
      description: location.description,
      interactiveObjects: location.interactiveObjects || [],
      signs: [],
      npcsHere: npcs.map((n) => n.id),
      availableTasks: [],
    };

  const [inspectedObject, setInspectedObject] = useState<InteractiveObject | null>(
    null
  );
  const [interactedObjects, setInteractedObjects] = useState<string[]>([]);
  const [inspectingSign, setInspectingSign] = useState<CitySign | null>(null);
  const [activeTask, setActiveTask] = useState<RealWorldTask | null>(null);

  // Filter NPCs present in this simulated room and time of day
  const npcsInThisLocation = NPCScheduleEngine.getNPCsAtLocation(
    npcs,
    location.id,
    (timeOfDay || "afternoon") as TimeOfDay
  );

  const handleInspect = (obj: InteractiveObject) => {
    sound.playClick();
    setInspectedObject(obj);
    if (!interactedObjects.includes(obj.id)) {
      setInteractedObjects((prev) => [...prev, obj.id]);
      onGainXpCoins(50, 20);
      sound.playCoin();
    }
  };

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 0.95 });
  };

  return (
    <div
      id="building-interior-container"
      className="fixed inset-0 z-40 bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Interior Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            id="exit-interior-button"
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit to Street</span>
          </button>

          <div className="flex flex-col">
            <h2 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <span>{buildingData?.name || location.name}</span>
              <span className="text-[10px] uppercase font-mono-code px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {location.category}
              </span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:inline">
              {buildingData?.arabicName || location.description}
            </p>
          </div>
        </div>

        {/* Floor and Level tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Floor {currentFloor.floorNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-0.5 rounded-full">
              CEFR {location.minLevel}+
            </span>
          </div>
        </div>
      </header>

      {/* Multi-Room / Multi-Floor Navigation Bar (if more than 1 floor or room) */}
      {(floors.length > 1 || currentFloor.rooms.length > 1) && (
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto">
          {/* Floors */}
          {floors.length > 1 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-400">Floor:</span>
              {floors.map((f, idx) => (
                <button
                  key={f.floorNumber}
                  onClick={() => {
                    sound.playClick();
                    setActiveFloorIndex(idx);
                    setActiveRoomId(f.rooms[0]?.id || "");
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeFloorIndex === idx
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  F{f.floorNumber}: {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Rooms in current floor */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-400">Room:</span>
            {currentFloor.rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  sound.playClick();
                  setActiveRoomId(room.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeRoomId === room.id
                    ? "bg-indigo-600 text-white font-bold shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <MapPin className="w-3 h-3 text-indigo-300" />
                <span>{room.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Interior Content Area */}
      <div className="flex-1 relative overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Room Atmosphere Banner */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${
            currentRoom.themeColor || location.color
          } border border-slate-700/80 shadow-2xl overflow-hidden`}
        >
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {currentFloor.name} • {currentRoom.name}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              {currentRoom.name}
            </h1>
            <p className="text-xs text-amber-200 mt-0.5" dir="rtl">
              {currentRoom.arabicName}
            </p>
            <p className="text-sm text-slate-100/90 mt-2 leading-relaxed">
              {currentRoom.description}
            </p>
          </div>
        </div>

        {/* Active Practical Tasks Available in this Room */}
        {currentRoom.availableTasks && currentRoom.availableTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Practical Communicative Tasks in this Area</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 flex flex-col justify-between gap-3 shadow-lg hover:border-emerald-400 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        CEFR {task.cefrLevel} Task
                      </span>
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> +{task.rewardXp} XP
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {task.objectiveText}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTask(task);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Start Practical Task</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Environmental Signs */}
        {currentRoom.signs && currentRoom.signs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Environmental English Notices in this Room</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.signs.map((sign) => (
                <div
                  key={sign.id}
                  onClick={() => {
                    sound.playClick();
                    setInspectingSign(sign);
                  }}
                  className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between gap-2 shadow-lg group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono tracking-wide group-hover:text-amber-200">
                      {sign.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(sign.text);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-emerald-400" dir="rtl">
                    {sign.arabicMeaning}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>Click to inspect & learn vocabulary</span>
                    <span className="text-blue-400 font-semibold">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Objects in this room */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Interactive Elements in {currentRoom.name}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentRoom.interactiveObjects.map((obj) => {
              const isInteracted = interactedObjects.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  onClick={() => handleInspect(obj)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    isInteracted
                      ? "bg-slate-900/80 border-slate-700/80 hover:border-slate-500"
                      : "bg-slate-900 border-blue-500/50 hover:border-blue-400 shadow-md shadow-blue-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{obj.name}</h4>
                        <span className="text-[11px] text-slate-400 block capitalize">
                          {obj.type}
                        </span>
                      </div>
                    </div>
                    {isInteracted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-blue-400 font-medium">{obj.actionText}</span>
                    {!isInteracted && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Coins className="w-3 h-3" /> +20
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* NPCs Present at this Location / Room */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Citizens Present in this Building</span>
          </h3>

          {npcsInThisLocation.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
              No staff or visitors currently in this room at this time of day. Try checking another floor or visiting during morning/afternoon hours!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {npcsInThisLocation.map((npc) => (
                <div
                  key={npc.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: `${npc.avatarColor}20` }}
                    >
                      {npc.avatarEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white">{npc.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          {npc.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{npc.occupation}</p>
                      <p className="text-[11px] text-amber-300/90 mt-1 italic">
                        "{npc.currentScheduleActivity || npc.greetingText}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      Tier: <strong className="text-slate-200">{npc.relationshipTier}</strong>
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onTalkToNpc(npc);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Speak English</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Object Vocabulary Popup Modal */}
      {inspectedObject && (
        <div
          id="object-inspection-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {inspectedObject.name}
                  </h3>
                  <span className="text-xs text-slate-400">Vocabulary Inspection</span>
                </div>
              </div>
              <button
                onClick={() => setInspectedObject(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Target Vocabulary for this Object:
              </label>
              <div className="flex flex-wrap gap-2">
                {inspectedObject.vocabularyTags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-blue-300"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleSpeak(tag)}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> +50 XP and +20 Coins recorded!
              </span>
              <button
                onClick={() => setInspectedObject(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Environmental Sign Inspector Modal */}
      {inspectingSign && (
        <SignInspectorModal
          sign={inspectingSign}
          player={player}
          onClose={() => setInspectingSign(null)}
          onAddVocabulary={(word) => onAddVocabulary && onAddVocabulary(word)}
          onEarnRewards={(xp, coins) => onGainXpCoins(xp, coins)}
        />
      )}

      {/* Real-World Task Modal */}
      {activeTask && (
        <RealWorldTaskModal
          task={activeTask}
          player={player}
          onClose={() => setActiveTask(null)}
          onTaskCompleted={(taskId, xp, coins) => {
            onGainXpCoins(xp, coins);
          }}
        />
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  PlayerProfile,
  CityLocation,
  NPC,
  DistrictId,
  TimeOfDay,
  WeatherType,
  CitySign,
  CityEvent,
} from "../types";
import { DISTRICTS, CITY_LOCATIONS, NPCS } from "../data/initialData";
import { WorldEngine } from "../services/city/WorldEngine";
import { CityEventEngine } from "../services/city/CityEventEngine";
import { NPCScheduleEngine } from "../services/city/NPCScheduleEngine";
import { CITY_EVENTS } from "../content/events/cityEvents";
import { sound } from "../utils/audioSynthesizer";
import {
  MessageSquare,
  DoorOpen,
  Footprints,
  Compass,
  Zap,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Train,
} from "lucide-react";

interface CityCanvasProps {
  player: PlayerProfile;
  currentDistrictId: DistrictId;
  currentLocationId: string;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  onSelectNpc: (npc: NPC) => void;
  onEnterLocation: (loc: CityLocation) => void;
  onFastTravelDistrict: (districtId: DistrictId) => void;
  onInspectSign?: (sign: CitySign) => void;
  onOpenEvent?: (event: CityEvent) => void;
  onOpenTransit?: () => void;
}

interface SimulationPedestrian {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  emoji: string;
  thoughtBubble: string;
}

interface SimulationVehicle {
  id: string;
  type: "taxi" | "car" | "bus";
  x: number;
  y: number;
  direction: "left" | "right";
  speed: number;
  color: string;
}

export const CityCanvas: React.FC<CityCanvasProps> = ({
  player,
  currentDistrictId,
  currentLocationId,
  timeOfDay,
  weather,
  onSelectNpc,
  onEnterLocation,
  onFastTravelDistrict,
  onInspectSign,
  onOpenEvent,
  onOpenTransit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const simCanvasRef = useRef<HTMLCanvasElement>(null);

  // Player position in 2D coordinate space (0-1000)
  const [playerPos, setPlayerPos] = useState({ x: 500, y: 500 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right">("right");
  const [isMoving, setIsMoving] = useState(false);

  // Real-time Simulation State stored in Refs to eliminate 60 FPS React re-renders
  const simulationState = useRef<{
    pedestrians: SimulationPedestrian[];
    vehicles: SimulationVehicle[];
    trafficLight: "green" | "yellow" | "red";
    lastLightSwitch: number;
    rainParticles: { x: number; y: number; speed: number; len: number }[];
  }>({
    pedestrians: [
      { id: "p1", x: 300, y: 420, targetX: 700, targetY: 420, speed: 0.8, emoji: "🚶", thoughtBubble: "Need a hot latte..." },
      { id: "p2", x: 650, y: 460, targetX: 250, targetY: 460, speed: 0.6, emoji: "🚶‍♀️", thoughtBubble: "Where is the museum?" },
      { id: "p3", x: 450, y: 360, targetX: 850, targetY: 360, speed: 1.1, emoji: "🏃", thoughtBubble: "Late for meeting!" },
      { id: "p4", x: 200, y: 440, targetX: 600, targetY: 440, speed: 0.7, emoji: "🚶‍♂️", thoughtBubble: "Practicing English." },
    ],
    vehicles: [
      { id: "v1", type: "taxi", x: 100, y: 530, direction: "right", speed: 2.4, color: "#eab308" },
      { id: "v2", type: "car", x: 900, y: 570, direction: "left", speed: 2.8, color: "#ef4444" },
      { id: "v3", type: "bus", x: 400, y: 530, direction: "right", speed: 1.6, color: "#3b82f6" },
    ],
    trafficLight: "green",
    lastLightSwitch: Date.now(),
    rainParticles: Array.from({ length: 45 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      speed: 12 + Math.random() * 8,
      len: 10 + Math.random() * 15,
    })),
  });

  // Fast O(1) indexed lookups
  const districtLocations = WorldEngine.getCityLocations(currentDistrictId);
  const districtNpcs = NPCS.filter((npc) => npc.districtId === currentDistrictId);
  const districtInfo = DISTRICTS.find((d) => d.id === currentDistrictId) || DISTRICTS[0];
  const districtSigns = WorldEngine.getSignsForDistrict(currentDistrictId);
  const availableEvents = CityEventEngine.getAvailableEvents(
    CITY_EVENTS,
    currentDistrictId,
    timeOfDay,
    player.cefrLevel
  );

  // Initialize player position near current location on district load
  useEffect(() => {
    const loc = districtLocations.find((l) => l.id === currentLocationId) || districtLocations[0];
    if (loc) {
      setPlayerPos({ x: loc.canvasX + 40, y: loc.canvasY + 60 });
    }
  }, [currentDistrictId, currentLocationId]);

  // High-performance 60 FPS Canvas Simulation Loop (Zero React State Overheads)
  useEffect(() => {
    let animId: number;
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderSimulation = () => {
      const now = Date.now();
      const state = simulationState.current;

      // Traffic Light State Machine
      if (now - state.lastLightSwitch > 6000) {
        state.trafficLight = state.trafficLight === "green" ? "yellow" : state.trafficLight === "yellow" ? "red" : "green";
        state.lastLightSwitch = now;
      }

      ctx.clearRect(0, 0, 1000, 1000);

      // 1. Render & Update Vehicles
      for (const veh of state.vehicles) {
        let newX = veh.direction === "right" ? veh.x + veh.speed : veh.x - veh.speed;
        if (state.trafficLight === "red" && newX > 450 && newX < 550) {
          // Stopped at light
        } else {
          veh.x = newX;
        }

        if (veh.direction === "right" && veh.x > 1050) veh.x = -100;
        if (veh.direction === "left" && veh.x < -100) veh.x = 1050;

        // Draw vehicle body
        ctx.save();
        ctx.fillStyle = veh.color;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(veh.x - 28, veh.y - 12, 56, 24, 6);
        ctx.fill();

        // Draw Vehicle Label / Emoji
        ctx.shadowBlur = 0;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(veh.type === "taxi" ? "🚕" : veh.type === "bus" ? "🚌" : "🚗", veh.x, veh.y);

        // Headlight beam at night
        if (timeOfDay === "night" || timeOfDay === "evening") {
          const grad = ctx.createLinearGradient(
            veh.direction === "right" ? veh.x + 28 : veh.x - 28,
            veh.y,
            veh.direction === "right" ? veh.x + 100 : veh.x - 100,
            veh.y
          );
          grad.addColorStop(0, "rgba(254, 240, 138, 0.35)");
          grad.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          if (veh.direction === "right") {
            ctx.moveTo(veh.x + 28, veh.y - 8);
            ctx.lineTo(veh.x + 100, veh.y - 20);
            ctx.lineTo(veh.x + 100, veh.y + 20);
            ctx.lineTo(veh.x + 28, veh.y + 8);
          } else {
            ctx.moveTo(veh.x - 28, veh.y - 8);
            ctx.lineTo(veh.x - 100, veh.y - 20);
            ctx.lineTo(veh.x - 100, veh.y + 20);
            ctx.lineTo(veh.x - 28, veh.y + 8);
          }
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Render & Update Pedestrians
      for (const ped of state.pedestrians) {
        const dx = ped.targetX - ped.x;
        const dy = ped.targetY - ped.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          ped.targetX = 150 + Math.random() * 700;
          ped.targetY = 340 + Math.random() * 140;
        } else {
          ped.x += (dx / dist) * ped.speed;
          ped.y += (dy / dist) * ped.speed;
        }

        ctx.save();
        // Thought bubble
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        const bubbleW = ctx.measureText(ped.thoughtBubble).width + 8;
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(ped.x - bubbleW / 2, ped.y - 28, bubbleW, 14, 4);
        ctx.fill();

        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(ped.thoughtBubble, ped.x, ped.y - 18);

        // Emoji Avatar
        ctx.font = "18px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(ped.emoji, ped.x, ped.y);
        ctx.restore();
      }

      // 3. Render Rain Particles if raining
      if (weather === "rainy") {
        ctx.save();
        ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
        ctx.lineWidth = 1.5;
        for (const drop of state.rainParticles) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.len);
          ctx.stroke();

          drop.y += drop.speed;
          drop.x -= 1;
          if (drop.y > 1000) {
            drop.y = -20;
            drop.x = Math.random() * 1000;
          }
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(renderSimulation);
    };

    animId = requestAnimationFrame(renderSimulation);
    return () => cancelAnimationFrame(animId);
  }, [timeOfDay, weather]);

  // Keyboard navigation (WASD & Arrows)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const step = 24;
      let newX = playerPos.x;
      let newY = playerPos.y;
      let moved = false;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        newY = Math.max(100, playerPos.y - step);
        moved = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        newY = Math.min(880, playerPos.y + step);
        moved = true;
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        newX = Math.max(80, playerPos.x - step);
        setPlayerFacing("left");
        moved = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        newX = Math.min(920, playerPos.x + step);
        setPlayerFacing("right");
        moved = true;
      }

      if (moved) {
        setPlayerPos({ x: newX, y: newY });
        setIsMoving(true);
        setTimeout(() => setIsMoving(false), 200);
      }
    },
    [playerPos]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click / Tap on canvas to move avatar
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    setPlayerFacing(clickX > playerPos.x ? "right" : "left");
    setPlayerPos({
      x: Math.max(80, Math.min(920, clickX)),
      y: Math.max(100, Math.min(880, clickY)),
    });
    setIsMoving(true);
    setTimeout(() => setIsMoving(false), 400);
  };

  // Find nearest interactable NPC within proximity
  const nearestNpc = districtNpcs.find((npc) => {
    const loc = districtLocations.find((l) => l.id === npc.locationId);
    if (!loc) return false;
    const dx = loc.canvasX - playerPos.x;
    const dy = loc.canvasY - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 140;
  });

  // Find nearest interactable Location Entrance
  const nearestLocation = districtLocations.find((loc) => {
    const dx = loc.canvasX - playerPos.x;
    const dy = loc.canvasY - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 130;
  });

  // Environmental lighting tone based on timeOfDay
  const getLightingStyle = () => {
    switch (timeOfDay) {
      case "morning":
        return "from-amber-950/20 via-transparent to-blue-950/20";
      case "afternoon":
        return "from-transparent to-transparent";
      case "evening":
        return "from-amber-900/30 via-indigo-950/40 to-slate-950/60";
      case "night":
        return "from-indigo-950/70 via-slate-950/80 to-slate-950/95";
      default:
        return "from-transparent to-transparent";
    }
  };

  return (
    <main
      id="city-canvas-container"
      ref={containerRef}
      onClick={handleCanvasClick}
      className="relative w-full h-full overflow-hidden bg-slate-950 cursor-crosshair select-none"
    >
      {/* 1. Procedural Vector Street Grid & District Layout */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="city-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#city-grid)" />
        </svg>
      </div>

      {/* 2. Main Avenue & Cross Streets */}
      <div className="absolute top-[500px] left-0 right-0 h-32 bg-slate-900/90 border-y-4 border-slate-700 pointer-events-none">
        {/* Road center dashed line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 border-t-2 border-dashed border-amber-400/60" />
      </div>
      <div className="absolute top-0 bottom-0 left-[480px] w-28 bg-slate-900/90 border-x-4 border-slate-700 pointer-events-none">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-slate-500/50" />
      </div>

      {/* 3. District Header Banner */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl">
          <span className="text-xl">🏙️</span>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold font-display text-white tracking-wide flex items-center gap-2">
              {districtInfo.name}
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                Min Level: {districtInfo.minLevel}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{districtInfo.description}</p>
          </div>
        </div>
      </div>

      {/* 4. Interactive Buildings & POIs */}
      {districtLocations.map((loc) => {
        const isNearby =
          Math.sqrt(
            Math.pow(loc.canvasX - playerPos.x, 2) + Math.pow(loc.canvasY - playerPos.y, 2)
          ) < 130;

        return (
          <div
            key={loc.id}
            id={`loc-${loc.id}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onEnterLocation(loc);
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group transition-transform ${
              isNearby ? "scale-105" : "hover:scale-102"
            }`}
            style={{
              left: `${loc.canvasX / 10}%`,
              top: `${loc.canvasY / 10}%`,
            }}
          >
            <div className="relative flex flex-col items-center">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3 shadow-2xl border-2 flex flex-col items-center justify-between transition-all ${
                  isNearby
                    ? "border-amber-400 ring-4 ring-amber-400/30 bg-slate-900"
                    : "border-slate-700 bg-slate-900/95 group-hover:border-slate-500"
                }`}
                style={{ backgroundColor: `${loc.color}15` }}
              >
                <div className="w-full flex items-center justify-between">
                  <span className="text-2xl">{loc.icon}</span>
                  {isNearby && (
                    <span className="animate-ping w-2.5 h-2.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-center text-slate-200 line-clamp-1">
                  {loc.name}
                </span>
                <div className="w-full flex items-center justify-center gap-1 text-[9px] text-slate-400 bg-slate-800/80 rounded-md py-0.5">
                  <DoorOpen className="w-2.5 h-2.5" />
                  <span>Enter</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 4.5. High Performance Real-Time Canvas Simulation Layer */}
      <canvas
        id="city-sim-canvas"
        ref={simCanvasRef}
        width={1000}
        height={1000}
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
      />

      {/* 4.6. Environmental Street Signs */}
      {districtSigns.map((sign, idx) => (
        <div
          key={sign.id}
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            onInspectSign && onInspectSign(sign);
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group hover:scale-110 transition-transform"
          style={{
            left: `${idx % 2 === 0 ? 18 : 68}%`,
            top: `72%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border-2 border-amber-400 text-amber-300 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap animate-pulse">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>{sign.text.slice(0, 22)}...</span>
            </div>
            <div className="w-1.5 h-6 bg-slate-600 rounded-b shadow" />
          </div>
        </div>
      ))}

      {/* 4.7. Dynamic City Event Markers */}
      {availableEvents.slice(0, 1).map((ev) => (
        <div
          key={ev.id}
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            onOpenEvent && onOpenEvent(ev);
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group hover:scale-110 transition-transform"
          style={{
            left: `48%`,
            top: `34%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-3 py-1.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-bounce">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Event: {ev.title}</span>
            </div>
            <div className="w-2 h-4 bg-rose-600 rounded-b" />
          </div>
        </div>
      ))}

      {/* 4.8. Public Transit Station Entrance */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          sound.playClick();
          onOpenTransit && onOpenTransit();
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group hover:scale-105 transition-transform"
        style={{
          left: `84%`,
          top: `72%`,
        }}
      >
        <div className="bg-slate-900 border-2 border-blue-500 hover:border-blue-400 text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Train className="w-4 h-4 text-blue-400" />
          <span>Metro & Cab Transit</span>
        </div>
      </div>

      {/* 5. Player Avatar */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-150 ${
          isMoving ? "scale-105" : ""
        }`}
        style={{
          left: `${playerPos.x / 10}%`,
          top: `${playerPos.y / 10}%`,
        }}
      >
        {/* Proximity Ring */}
        <div className="absolute -inset-2 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none" />

        {/* Player Name Tag & Level */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-950/90 border border-blue-500/50 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap flex items-center gap-1">
          <span>{player.name}</span>
          <span className="bg-amber-500 text-slate-950 px-1 py-0.1 rounded-full text-[9px]">
            {player.level}
          </span>
        </div>

        {/* Player Visual Icon & Direction */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xl ring-4 ring-blue-500 shadow-blue-500/50 transition-transform"
          style={{
            backgroundColor: player.avatarColor,
            transform: playerFacing === "left" ? "scaleX(-1)" : "scaleX(1)",
          }}
        >
          {player.avatarStyle === "explorer" ? "🧭" : "🎓"}
        </div>
      </div>

      {/* 6. Proximity Action Helper Overlay (Press E or Tap) */}
      {(nearestNpc || nearestLocation) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3 animate-fadeIn">
          {nearestNpc ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Talk with {nearestNpc.name} ({nearestNpc.occupation})
                </span>
                <span className="text-[10px] text-slate-400">
                  Tap here or click NPC to practice English conversation
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectNpc(nearestNpc);
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Start Conversation
              </button>
            </>
          ) : nearestLocation ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Enter {nearestLocation.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Interact with menus, kiosks, and interior activities
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onEnterLocation(nearestLocation);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md active:scale-95 transition-all"
              >
                Step Inside
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* 7. Atmosphere Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-b ${getLightingStyle()} transition-all duration-1000`}
      />

      {/* 8. Mobile Touch Movement Helper */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-2.5 shadow-2xl flex flex-col items-center gap-1.5">
        <button
          onClick={() => {
            setPlayerPos((p) => ({ ...p, y: Math.max(100, p.y - 40) }));
          }}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
        >
          ▲
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPlayerFacing("left");
              setPlayerPos((p) => ({ ...p, x: Math.max(80, p.x - 40) }));
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
          >
            ◀
          </button>
          <button
            onClick={() => {
              setPlayerFacing("right");
              setPlayerPos((p) => ({ ...p, x: Math.min(920, p.x + 40) }));
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => {
            setPlayerPos((p) => ({ ...p, y: Math.min(880, p.y + 40) }));
          }}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
        >
          ▼
        </button>
      </div>

      {/* Bottom Left Movement Instructions Pill */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 shadow-lg pointer-events-none">
        <Footprints className="w-4 h-4 text-blue-400" />
        <span>Move: <b>WASD</b>, <b>Arrow Keys</b>, or <b>Click</b> ground</span>
      </div>
    </main>
  );
};

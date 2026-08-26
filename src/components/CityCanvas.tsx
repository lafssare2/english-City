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
  Car,
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

interface Pedestrian {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  emoji: string;
  thoughtBubble: string;
  color: string;
}

interface Vehicle {
  id: string;
  type: "car" | "taxi" | "bus";
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

  // Player position in 2D coordinate space (0-1000)
  const [playerPos, setPlayerPos] = useState({ x: 500, y: 500 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right">("right");
  const [isMoving, setIsMoving] = useState(false);

  // Pedestrians & Vehicles state for dynamic city life
  const [pedestrians, setPedestrians] = useState<Pedestrian[]>([
    {
      id: "ped_1",
      name: "City Resident",
      x: 300,
      y: 420,
      targetX: 700,
      targetY: 420,
      speed: 0.8,
      emoji: "🚶",
      thoughtBubble: "Need a hot latte...",
      color: "#3b82f6",
    },
    {
      id: "ped_2",
      name: "Tourist",
      x: 650,
      y: 460,
      targetX: 250,
      targetY: 460,
      speed: 0.6,
      emoji: "🚶‍♀️",
      thoughtBubble: "Where is the museum?",
      color: "#ec4899",
    },
    {
      id: "ped_3",
      name: "Student",
      x: 450,
      y: 360,
      targetX: 850,
      targetY: 360,
      speed: 1.1,
      emoji: "🏃",
      thoughtBubble: "Late for lecture!",
      color: "#10b981",
    },
  ]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: "veh_1", type: "taxi", x: 100, y: 530, direction: "right", speed: 2.2, color: "#eab308" },
    { id: "veh_2", type: "car", x: 900, y: 570, direction: "left", speed: 2.5, color: "#ef4444" },
    { id: "veh_3", type: "bus", x: 400, y: 530, direction: "right", speed: 1.4, color: "#3b82f6" },
  ]);

  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red">("green");

  // Filter locations and NPCs belonging to current district
  const districtLocations = CITY_LOCATIONS.filter(
    (loc) => loc.districtId === currentDistrictId
  );
  const districtNpcs = NPCS.filter((npc) => npc.districtId === currentDistrictId);
  const districtInfo = DISTRICTS.find((d) => d.id === currentDistrictId) || DISTRICTS[0];

  // Living City Engine queries
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

  // Traffic light cycle simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficLight((prev) => {
        if (prev === "green") return "yellow";
        if (prev === "yellow") return "red";
        return "green";
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Continuous animation loop for vehicles and pedestrians
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // Move vehicles
      setVehicles((prev) =>
        prev.map((veh) => {
          let newX = veh.direction === "right" ? veh.x + veh.speed : veh.x - veh.speed;
          if (trafficLight === "red" && newX > 450 && newX < 550) {
            // Stop at red light
            return veh;
          }
          if (veh.direction === "right" && newX > 1050) newX = -100;
          if (veh.direction === "left" && newX < -100) newX = 1050;
          return { ...veh, x: newX };
        })
      );

      // Move pedestrians
      setPedestrians((prev) =>
        prev.map((ped) => {
          const dx = ped.targetX - ped.x;
          const dy = ped.targetY - ped.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 5) {
            // Pick new target patrol point
            return {
              ...ped,
              targetX: 150 + Math.random() * 700,
              targetY: 340 + Math.random() * 140,
            };
          }

          return {
            ...ped,
            x: ped.x + (dx / dist) * ped.speed,
            y: ped.y + (dy / dist) * ped.speed,
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [trafficLight]);

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
        return "from-blue-950/60 via-slate-950/80 to-slate-950/90";
    }
  };

  return (
    <main
      ref={containerRef}
      onClick={handleCanvasClick}
      className="relative w-full h-screen overflow-hidden bg-slate-950 select-none cursor-crosshair"
    >
      {/* 1. Base City Ground & Roads Background */}
      <div className="absolute inset-0 bg-[#0c1222] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px]">
        {/* District Ambient Header Watermark */}
        <div className="absolute top-24 left-6 pointer-events-none opacity-20 flex flex-col">
          <span className="font-display font-black text-4xl sm:text-6xl tracking-tight text-white uppercase">
            {districtInfo.name}
          </span>
          <span className="text-xl sm:text-2xl font-arabic text-amber-300">
            {districtInfo.arabicName}
          </span>
        </div>

        {/* Sidewalks & Plazas */}
        <div className="absolute top-[280px] left-0 right-0 h-[220px] bg-slate-900/90 border-y-2 border-slate-700/60 shadow-inner" />

        {/* Main 2-Lane Avenue Road */}
        <div className="absolute top-[500px] left-0 right-0 h-[150px] bg-slate-950 border-y-4 border-amber-500/40 flex flex-col justify-center">
          {/* Dashed Center Road Divider */}
          <div className="w-full h-1 border-t-2 border-dashed border-amber-400/60" />

          {/* Crosswalk Zebra Stripes */}
          <div className="absolute left-[480px] top-0 bottom-0 w-20 flex justify-between">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-full w-2 bg-slate-100/40" />
            ))}
          </div>
        </div>

        {/* Lower Promenade Sidewalk */}
        <div className="absolute top-[650px] left-0 right-0 h-[140px] bg-slate-900/90 border-b-2 border-slate-700/60" />

        {/* Traffic Light Pole at Crosswalk */}
        <div className="absolute left-[470px] top-[460px] flex flex-col items-center pointer-events-none z-10">
          <div className="w-1.5 h-12 bg-slate-700" />
          <div className="bg-slate-900 border border-slate-700 rounded-md p-1 flex flex-col gap-1 shadow-lg">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                trafficLight === "red" ? "bg-red-500 shadow-lg shadow-red-500" : "bg-red-950"
              }`}
            />
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                trafficLight === "yellow"
                  ? "bg-amber-400 shadow-lg shadow-amber-400"
                  : "bg-amber-950"
              }`}
            />
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                trafficLight === "green"
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500"
                  : "bg-emerald-950"
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. District Buildings / Portals */}
      {districtLocations.map((loc) => {
        const isHovered = nearestLocation?.id === loc.id;
        return (
          <div
            key={loc.id}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onEnterLocation(loc);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform duration-300 hover:scale-105"
            style={{
              left: `${loc.canvasX / 10}%`,
              top: `${loc.canvasY / 10}%`,
            }}
          >
            {/* Building Exterior Card */}
            <div
              className={`relative bg-gradient-to-b ${loc.color} border-2 ${
                isHovered
                  ? "border-amber-400 shadow-2xl shadow-amber-500/30 scale-105"
                  : "border-slate-700/80 shadow-xl"
              } rounded-3xl p-4 w-44 sm:w-56 text-slate-100 flex flex-col items-center text-center transition-all`}
            >
              {/* Roof Landmark Badge */}
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1 shadow-md">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {loc.category}
              </div>

              {/* Building Title & Icon */}
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center my-1.5 shadow-inner">
                <span className="text-2xl">
                  {loc.category === "cafe"
                    ? "☕"
                    : loc.category === "airport"
                    ? "✈️"
                    : loc.category === "hospital"
                    ? "🏥"
                    : loc.category === "office"
                    ? "🏢"
                    : loc.category === "home"
                    ? "🏡"
                    : loc.category === "store"
                    ? "🛍️"
                    : loc.category === "hotel"
                    ? "🏨"
                    : loc.category === "subway"
                    ? "🚇"
                    : "🏛️"}
                </span>
              </div>

              <h3 className="font-display font-bold text-xs sm:text-sm text-white tracking-tight leading-tight line-clamp-1">
                {loc.name}
              </h3>
              <p className="text-[10px] text-slate-200/80 mt-1 line-clamp-2 leading-relaxed">
                {loc.description}
              </p>

              {/* Entrance Door Button */}
              <div className="mt-2.5 flex items-center gap-1 bg-slate-950/70 hover:bg-slate-950 border border-white/10 px-3 py-1 rounded-xl text-[11px] font-semibold text-amber-300 transition-colors">
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Enter Location</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. Stationed District NPCs */}
      {districtNpcs.map((npc) => {
        const isNear = nearestNpc?.id === npc.id;
        const loc = districtLocations.find((l) => l.id === npc.locationId);
        const npcX = (loc ? loc.canvasX + 45 : 500) / 10;
        const npcY = (loc ? loc.canvasY + 65 : 400) / 10;

        return (
          <div
            key={npc.id}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onSelectNpc(npc);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            style={{
              left: `${npcX}%`,
              top: `${npcY}%`,
            }}
          >
            {/* Animated Speech/Mood Bubble */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/40 text-slate-100 px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap text-[10px] font-medium flex items-center gap-1.5 animate-bounce">
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span>{npc.name.split(" ")[0]}: "Talk with me!"</span>
            </div>

            {/* NPC Body */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all ${
                isNear
                  ? "ring-4 ring-amber-400 scale-110 shadow-amber-500/40"
                  : "ring-2 ring-white/20 group-hover:scale-105"
              }`}
              style={{ backgroundColor: npc.avatarColor }}
            >
              {npc.avatarEmoji}
            </div>

            {/* Nameplate */}
            <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-center text-slate-200 border border-slate-800">
              {npc.name.split(" ")[0]}
            </div>
          </div>
        );
      })}

      {/* 4. Dynamic Moving Vehicles */}
      {vehicles.map((veh) => (
        <div
          key={veh.id}
          className="absolute -translate-y-1/2 z-10 transition-transform pointer-events-none"
          style={{
            left: `${veh.x / 10}%`,
            top: `${veh.y / 10}%`,
            transform: veh.direction === "left" ? "scaleX(-1)" : "scaleX(1)",
          }}
        >
          <div
            className="relative px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1"
            style={{ backgroundColor: veh.color }}
          >
            {/* Headlights beam at night */}
            {(timeOfDay === "night" || timeOfDay === "evening") && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-8 bg-gradient-to-r from-amber-200/40 to-transparent blur-sm -mr-24 pointer-events-none" />
            )}
            <span className="text-xl">
              {veh.type === "taxi" ? "🚕" : veh.type === "bus" ? "🚌" : "🚗"}
            </span>
          </div>
        </div>
      ))}

      {/* 4.5. Environmental Street Signs on Sidewalk */}
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

      {/* 4.6. Dynamic City Event Markers */}
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

      {/* 4.7. Public Transit Station Entrance */}
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

      {/* 5. Walking Civilian Pedestrians */}
      {pedestrians.map((ped) => (
        <div
          key={ped.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none transition-all duration-300"
          style={{
            left: `${ped.x / 10}%`,
            top: `${ped.y / 10}%`,
          }}
        >
          {/* Pedestrian Thought Bubble */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-[9px] whitespace-nowrap opacity-75">
            {ped.thoughtBubble}
          </div>
          <div className="text-xl">{ped.emoji}</div>
        </div>
      ))}

      {/* 6. Player Avatar */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-200 ${
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

      {/* 7. Proximity Action Helper Overlay (Press E or Tap) */}
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

      {/* 8. Weather & Day/Night Atmosphere Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-b ${getLightingStyle()} transition-all duration-1000`}
      />

      {/* Rainy particles overlay */}
      {weather === "rainy" && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_32px] opacity-40 animate-pulse" />
      )}

      {/* Night Streetlamps Ambient Glows */}
      {(timeOfDay === "night" || timeOfDay === "evening") && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[270px] left-[200px] w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute top-[270px] left-[700px] w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute top-[640px] left-[450px] w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
        </div>
      )}

      {/* 9. Mobile Touch Movement Helper / On-screen D-pad */}
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

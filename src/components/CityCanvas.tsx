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
  VocabularyWord,
} from "../types";
import { DISTRICTS, CITY_LOCATIONS, NPCS } from "../data/initialData";
import { WorldEngine } from "../services/city/WorldEngine";
import { CityEventEngine } from "../services/city/CityEventEngine";
import { CITY_EVENTS } from "../content/events/cityEvents";
import { CityAssetRenderer } from "./city/CityAssetRenderer";
import {
  ENVIRONMENTAL_LEARNING_OBJECTS,
  EnvironmentalLearningObject,
} from "../content/vocabulary/environmentalVocabulary";
import { EnvironmentalObjectModal } from "./city/EnvironmentalObjectModal";
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
  Volume2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  MapPin,
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
  onAddVocabulary?: (word: VocabularyWord) => void;
  onGainXpCoins?: (xp: number, coins: number) => void;
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
  type: "taxi" | "car" | "bus" | "ambulance";
  x: number;
  y: number;
  laneY: number;
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
  onAddVocabulary,
  onGainXpCoins,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Player position in virtual world coordinate space (0-1000)
  const [playerPos, setPlayerPos] = useState({ x: 500, y: 500 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right" | "up" | "down">("down");
  const [isMoving, setIsMoving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.8 (wide overview) to 1.3 (close-up)
  const [activeTargetReticle, setActiveTargetReticle] = useState<{ x: number; y: number } | null>(null);

  // Active inspected environmental vocabulary object
  const [activeEnvObject, setActiveEnvObject] = useState<EnvironmentalLearningObject | null>(null);

  // Query World Engine & Catalogs for this district
  const districtLocations = WorldEngine.getCityLocations(currentDistrictId);
  const districtNpcs = NPCS.filter((npc) => npc.districtId === currentDistrictId);
  const districtInfo = DISTRICTS.find((d) => d.id === currentDistrictId) || DISTRICTS[0];
  const districtSigns = WorldEngine.getSignsForDistrict(currentDistrictId);
  const districtEnvObjects = ENVIRONMENTAL_LEARNING_OBJECTS.filter(
    (obj) => obj.districtId === currentDistrictId
  );
  const availableEvents = CityEventEngine.getAvailableEvents(
    CITY_EVENTS,
    currentDistrictId,
    timeOfDay,
    player.cefrLevel
  );

  // Simulation State stored in Refs to maintain ultra-smooth 60 FPS without React re-renders
  const simulationState = useRef<{
    pedestrians: SimulationPedestrian[];
    vehicles: SimulationVehicle[];
    trafficLight: "green" | "yellow" | "red";
    lastLightSwitch: number;
    rainParticles: { x: number; y: number; speed: number; len: number }[];
    animTime: number;
  }>({
    pedestrians: [
      { id: "p1", x: 280, y: 418, targetX: 750, targetY: 418, speed: 0.85, emoji: "🚶", thoughtBubble: "Ordering an espresso..." },
      { id: "p2", x: 720, y: 580, targetX: 220, targetY: 580, speed: 0.65, emoji: "🚶‍♀️", thoughtBubble: "Where is the library?" },
      { id: "p3", x: 420, y: 380, targetX: 860, targetY: 380, speed: 1.15, emoji: "🏃", thoughtBubble: "Catching the 10:15 express train!" },
      { id: "p4", x: 180, y: 420, targetX: 620, targetY: 420, speed: 0.75, emoji: "🚶‍♂️", thoughtBubble: "Practicing English vocabulary." },
    ],
    vehicles: [
      { id: "v1", type: "taxi", x: 80, y: 472, laneY: 472, direction: "right", speed: 2.5, color: "#eab308" },
      { id: "v2", type: "car", x: 920, y: 528, laneY: 528, direction: "left", speed: 2.8, color: "#ef4444" },
      { id: "v3", type: "bus", x: 380, y: 472, laneY: 472, direction: "right", speed: 1.7, color: "#0284c7" },
      { id: "v4", type: "ambulance", x: 820, y: 528, laneY: 528, direction: "left", speed: 3.2, color: "#f8fafc" },
    ],
    trafficLight: "green",
    lastLightSwitch: Date.now(),
    rainParticles: Array.from({ length: 50 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      speed: 14 + Math.random() * 8,
      len: 12 + Math.random() * 16,
    })),
    animTime: 0,
  });

  // Spawn player near current location on district load
  useEffect(() => {
    const loc = districtLocations.find((l) => l.id === currentLocationId) || districtLocations[0];
    if (loc) {
      setPlayerPos({ x: loc.canvasX + 40, y: loc.canvasY + 70 });
    }
  }, [currentDistrictId, currentLocationId]);

  // Master 60 FPS Procedural 2.5D Canvas Drawing Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const state = simulationState.current;
      state.animTime += 16;

      // 1. Traffic Light State Machine
      if (now - state.lastLightSwitch > 7000) {
        state.trafficLight =
          state.trafficLight === "green"
            ? "yellow"
            : state.trafficLight === "yellow"
            ? "red"
            : "green";
        state.lastLightSwitch = now;
      }

      ctx.clearRect(0, 0, 1000, 1000);

      // 2. Draw District Ground Terrain (Grass, Sand/Waves, Stone, Asphalt)
      CityAssetRenderer.drawTerrain(
        ctx,
        currentDistrictId,
        1000,
        1000,
        state.animTime
      );

      // 3. Draw Road Network (Avenues, Yellow center lines, Stop lines, Zebra crosswalks)
      CityAssetRenderer.drawRoadNetwork(ctx, 1000, 1000);

      // 4. Draw Street Furniture & Environmental Props (Lamps, Benches, Trees, ATMs, Bus Stops)
      // Street Lamps
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "street_lamp", x: 220, y: 426 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "street_lamp", x: 680, y: 426 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "street_lamp", x: 220, y: 574 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "street_lamp", x: 680, y: 574 },
        timeOfDay,
        state.animTime
      );

      // Trees with swaying foliage
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "tree", x: 120, y: 420 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "tree", x: 880, y: 420 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "tree", x: 120, y: 580 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "tree", x: 880, y: 580 },
        timeOfDay,
        state.animTime
      );

      // Benches & Trash Cans
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "bench", x: 300, y: 424 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "trash_bin", x: 326, y: 424 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "mailbox", x: 640, y: 424 },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "atm", x: 380, y: 424 },
        timeOfDay,
        state.animTime
      );

      // Traffic Light at intersection
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "traffic_light", x: 428, y: 424, state: state.trafficLight },
        timeOfDay,
        state.animTime
      );
      CityAssetRenderer.drawStreetProp(
        ctx,
        { type: "traffic_light", x: 572, y: 576, state: state.trafficLight },
        timeOfDay,
        state.animTime
      );

      // 5. Draw 2.5D Building Facades
      districtLocations.forEach((loc) => {
        const dx = loc.canvasX - playerPos.x;
        const dy = loc.canvasY - playerPos.y;
        const isNear = Math.sqrt(dx * dx + dy * dy) < 130;

        CityAssetRenderer.drawBuilding(
          ctx,
          {
            id: loc.id,
            name: loc.name,
            category: (loc as any).templateType || loc.category || "building",
            x: loc.canvasX,
            y: loc.canvasY,
            width: 140,
            height: 110,
            signText: loc.name.toUpperCase(),
            isHighlighted: isNear,
          },
          timeOfDay
        );
      });

      // 6. Render & Simulate Vehicles on Roads
      for (const veh of state.vehicles) {
        let newX = veh.direction === "right" ? veh.x + veh.speed : veh.x - veh.speed;

        // Vehicle stops at red traffic light before crosswalk
        const isRed = state.trafficLight === "red" || state.trafficLight === "yellow";
        if (
          isRed &&
          ((veh.direction === "right" && veh.x > 340 && veh.x < 390) ||
            (veh.direction === "left" && veh.x < 660 && veh.x > 610))
        ) {
          // Stay stopped
        } else {
          veh.x = newX;
        }

        if (veh.direction === "right" && veh.x > 1080) veh.x = -80;
        if (veh.direction === "left" && veh.x < -80) veh.x = 1080;

        // Draw vehicle body & shadow
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(veh.x - 24, veh.y - 10, 48, 20, 6);
        ctx.fill();

        ctx.fillStyle = veh.color;
        ctx.beginPath();
        ctx.roundRect(veh.x - 22, veh.y - 12, 44, 20, 5);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vehicle Windows
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(veh.x - 10, veh.y - 10, 20, 16);

        // Ambulance flashing siren
        if (veh.type === "ambulance") {
          const flash = Math.floor(state.animTime / 150) % 2 === 0;
          ctx.fillStyle = flash ? "#ef4444" : "#3b82f6";
          ctx.beginPath();
          ctx.arc(veh.x, veh.y - 14, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Night Headlight Cones
        if (timeOfDay === "night" || timeOfDay === "evening") {
          const grad = ctx.createLinearGradient(
            veh.direction === "right" ? veh.x + 22 : veh.x - 22,
            veh.y,
            veh.direction === "right" ? veh.x + 110 : veh.x - 110,
            veh.y
          );
          grad.addColorStop(0, "rgba(254, 240, 138, 0.45)");
          grad.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          if (veh.direction === "right") {
            ctx.moveTo(veh.x + 22, veh.y - 8);
            ctx.lineTo(veh.x + 110, veh.y - 24);
            ctx.lineTo(veh.x + 110, veh.y + 24);
            ctx.lineTo(veh.x + 22, veh.y + 8);
          } else {
            ctx.moveTo(veh.x - 22, veh.y - 8);
            ctx.lineTo(veh.x - 110, veh.y - 24);
            ctx.lineTo(veh.x - 110, veh.y + 24);
            ctx.lineTo(veh.x - 22, veh.y + 8);
          }
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Render & Simulate Pedestrians with Thought Bubbles
      for (const ped of state.pedestrians) {
        const dx = ped.targetX - ped.x;
        const dy = ped.targetY - ped.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          ped.targetX = 140 + Math.random() * 720;
          ped.targetY = 415 + (Math.random() > 0.5 ? 0 : 160);
        } else {
          ped.x += (dx / dist) * ped.speed;
          ped.y += (dy / dist) * ped.speed;
        }

        ctx.save();
        // Thought Bubble
        ctx.font = "bold 8.5px sans-serif";
        ctx.textAlign = "center";
        const bubbleW = ctx.measureText(ped.thoughtBubble).width + 10;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(ped.x - bubbleW / 2, ped.y - 28, bubbleW, 14, 4);
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#f8fafc";
        ctx.fillText(ped.thoughtBubble, ped.x, ped.y - 18);

        // Emoji Pedestrian
        ctx.font = "16px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(ped.emoji, ped.x, ped.y);
        ctx.restore();
      }

      // 8. Draw Animated Player Character
      CityAssetRenderer.drawPlayer(
        ctx,
        playerPos.x,
        playerPos.y,
        playerFacing,
        isMoving,
        state.animTime,
        player.avatarColor,
        player.name,
        player.level
      );

      // 9. Rain & Weather Particles
      if (weather === "rainy") {
        ctx.save();
        ctx.strokeStyle = "rgba(147, 197, 253, 0.6)";
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

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentDistrictId, timeOfDay, weather, playerPos, playerFacing, isMoving, player]);

  // Movement handler (Keyboard WASD & Arrows)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If modal is open, let modal handle keys
      if (activeEnvObject) return;

      const step = 22;
      let newX = playerPos.x;
      let newY = playerPos.y;
      let moved = false;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        newY = Math.max(90, playerPos.y - step);
        setPlayerFacing("up");
        moved = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        newY = Math.min(910, playerPos.y + step);
        setPlayerFacing("down");
        moved = true;
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        newX = Math.max(70, playerPos.x - step);
        setPlayerFacing("left");
        moved = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        newX = Math.min(930, playerPos.x + step);
        setPlayerFacing("right");
        moved = true;
      }

      if (moved) {
        setPlayerPos({ x: newX, y: newY });
        setIsMoving(true);
        setTimeout(() => setIsMoving(false), 200);
      }

      // [E] or [Space] to interact with nearest entity
      if (e.key === "e" || e.key === "E" || e.key === " ") {
        if (nearestNpc) {
          sound.playDialoguePop();
          onSelectNpc(nearestNpc);
        } else if (nearestLocation) {
          sound.playClick();
          onEnterLocation(nearestLocation);
        } else if (nearestEnvObject) {
          sound.playClick();
          setActiveEnvObject(nearestEnvObject);
        } else if (nearestSign) {
          sound.playClick();
          onInspectSign && onInspectSign(nearestSign);
        }
      }
    },
    [playerPos, activeEnvObject]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click-to-Move with Animated Target Reticle
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    const clampedX = Math.max(70, Math.min(930, clickX));
    const clampedY = Math.max(90, Math.min(910, clickY));

    setActiveTargetReticle({ x: clampedX, y: clampedY });
    setTimeout(() => setActiveTargetReticle(null), 800);

    setPlayerFacing(clampedX > playerPos.x ? "right" : "left");
    setPlayerPos({ x: clampedX, y: clampedY });
    setIsMoving(true);
    setTimeout(() => setIsMoving(false), 350);
  };

  // Find nearest interactable items in proximity (NPC, Building, Environmental Sign, Object)
  const nearestNpc = districtNpcs.find((npc) => {
    const loc = districtLocations.find((l) => l.id === npc.locationId);
    if (!loc) return false;
    const dx = loc.canvasX - playerPos.x;
    const dy = loc.canvasY - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 140;
  });

  const nearestLocation = districtLocations.find((loc) => {
    const dx = loc.canvasX - playerPos.x;
    const dy = loc.canvasY - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 130;
  });

  const nearestEnvObject = districtEnvObjects.find((obj) => {
    const dx = obj.x - playerPos.x;
    const dy = obj.y - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 120;
  });

  const nearestSign = districtSigns.find((sign, idx) => {
    const signX = idx % 2 === 0 ? 180 : 680;
    const signY = 720;
    const dx = signX - playerPos.x;
    const dy = signY - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 130;
  });

  // Time-of-day atmospheric color filter
  const getLightingStyle = () => {
    switch (timeOfDay) {
      case "morning":
        return "from-amber-500/10 via-transparent to-blue-500/10";
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
      {/* 1. Master 2.5D Procedural Canvas Game Engine */}
      <div
        className="w-full h-full relative transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <canvas
          id="city-master-canvas"
          ref={canvasRef}
          width={1000}
          height={1000}
          className="absolute inset-0 w-full h-full"
        />

        {/* 2. Interactive Environmental Vocabulary Signs */}
        {districtEnvObjects.map((obj) => (
          <div
            key={obj.id}
            id={`env-obj-${obj.id}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setActiveEnvObject(obj);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group hover:scale-110 active:scale-95 transition-all"
            style={{
              left: `${obj.x / 10}%`,
              top: `${obj.y / 10}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-slate-950/90 border-2 border-amber-400 text-amber-300 px-3 py-1 rounded-2xl text-[10px] font-bold font-mono shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{obj.signText}</span>
              </div>
              <div className="w-1.5 h-4 bg-amber-500 rounded-b shadow" />
            </div>
          </div>
        ))}

        {/* 3. District Environmental Signs */}
        {districtSigns.map((sign, idx) => (
          <div
            key={sign.id}
            id={`sign-${sign.id}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onInspectSign && onInspectSign(sign);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group hover:scale-110 active:scale-95 transition-all"
            style={{
              left: `${idx % 2 === 0 ? 18 : 68}%`,
              top: `72%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-slate-950/95 border-2 border-blue-400 text-cyan-300 px-3 py-1 rounded-2xl text-[10px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
                <Lightbulb className="w-3 h-3 text-cyan-400" />
                <span>{sign.text.slice(0, 24)}...</span>
              </div>
              <div className="w-1.5 h-5 bg-blue-500 rounded-b shadow" />
            </div>
          </div>
        ))}

        {/* 4. Dynamic Live City Event Marker */}
        {availableEvents.slice(0, 1).map((ev) => (
          <div
            key={ev.id}
            id={`event-marker-${ev.id}`}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onOpenEvent && onOpenEvent(ev);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group hover:scale-110 active:scale-95 transition-all"
            style={{
              left: `50%`,
              top: `34%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-rose-950/95 border-2 border-rose-500 text-rose-100 px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 whitespace-nowrap animate-bounce">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>City Event: {ev.title}</span>
              </div>
              <div className="w-2 h-4 bg-rose-600 rounded-b" />
            </div>
          </div>
        ))}

        {/* 5. Public Transit Hub Marker */}
        <div
          id="transit-hub-marker"
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            onOpenTransit && onOpenTransit();
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group hover:scale-105 active:scale-95 transition-all"
          style={{
            left: `86%`,
            top: `72%`,
          }}
        >
          <div className="bg-slate-950/90 border-2 border-cyan-500 text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2">
            <Train className="w-4 h-4 text-cyan-400" />
            <span>Transit & Metro</span>
          </div>
        </div>

        {/* 6. Click Target Reticle */}
        {activeTargetReticle && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-amber-400 pointer-events-none animate-ping z-30"
            style={{
              left: `${activeTargetReticle.x / 10}%`,
              top: `${activeTargetReticle.y / 10}%`,
            }}
          />
        )}
      </div>

      {/* 7. Atmosphere Lighting Gradient Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-b ${getLightingStyle()} transition-all duration-1000 z-10`}
      />

      {/* 8. Top Left District Card */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl">
          <span className="text-2xl">🏙️</span>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold font-display text-white tracking-wide flex items-center gap-2">
              {districtInfo.name}
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                Level: {districtInfo.minLevel}+
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{districtInfo.description}</p>
          </div>
        </div>
      </div>

      {/* 9. Top Right Game Minimap & Zoom Controls */}
      <div className="absolute top-20 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl">
          <button
            id="zoom-in-button"
            onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.15))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="zoom-out-button"
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Sleek Mini-Map */}
        <div className="w-28 h-28 bg-slate-950/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl relative overflow-hidden hidden sm:block">
          {/* Mini Road Grid */}
          <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 bg-slate-800/80" />
          <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-slate-800/80" />

          {/* Mini Building Blocks */}
          {districtLocations.map((loc) => (
            <div
              key={loc.id}
              className="absolute w-3 h-3 rounded-xs bg-slate-700 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${loc.canvasX / 10}%`,
                top: `${loc.canvasY / 10}%`,
              }}
            />
          ))}

          {/* Player Mini-Blip */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400 ring-2 ring-white animate-pulse -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${playerPos.x / 10}%`,
              top: `${playerPos.y / 10}%`,
            }}
          />

          <div className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-500 font-bold">
            GPS
          </div>
        </div>
      </div>

      {/* 10. Proximity Action Prompt Bar (Press E to Interact) */}
      {(nearestNpc || nearestLocation || nearestEnvObject || nearestSign) && (
        <div
          id="proximity-action-prompt-bar"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3 animate-fadeIn"
        >
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
                  Practice English conversation in {districtInfo.name}
                </span>
              </div>
              <button
                id="proximity-talk-btn"
                onClick={() => {
                  sound.playDialoguePop();
                  onSelectNpc(nearestNpc);
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Talk
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
                  Explore interior floors, counters, and real-world tasks
                </span>
              </div>
              <button
                id="proximity-enter-btn"
                onClick={() => {
                  sound.playClick();
                  onEnterLocation(nearestLocation);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md active:scale-95 transition-all"
              >
                Enter
              </button>
            </>
          ) : nearestEnvObject ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">
                  Examine: {nearestEnvObject.signText}
                </span>
                <span className="text-[10px] text-slate-300">
                  Learn pronunciation, meaning, and add to SRS deck
                </span>
              </div>
              <button
                id="proximity-examine-btn"
                onClick={() => {
                  sound.playClick();
                  setActiveEnvObject(nearestEnvObject);
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Examine
              </button>
            </>
          ) : nearestSign ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-cyan-300">
                  Inspect Sign: {nearestSign.text.slice(0, 26)}...
                </span>
                <span className="text-[10px] text-slate-400">
                  Read environmental sign & test comprehension
                </span>
              </div>
              <button
                id="proximity-sign-btn"
                onClick={() => {
                  sound.playClick();
                  onInspectSign && onInspectSign(nearestSign);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md active:scale-95 transition-all"
              >
                Read Sign
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* 11. Mobile Touch Movement D-Pad */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-2.5 shadow-2xl flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onClick={() => {
            setPlayerFacing("up");
            setPlayerPos((p) => ({ ...p, y: Math.max(90, p.y - 35) }));
          }}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
        >
          ▲
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPlayerFacing("left");
              setPlayerPos((p) => ({ ...p, x: Math.max(70, p.x - 35) }));
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
          >
            ◀
          </button>
          <button
            onClick={() => {
              setPlayerFacing("right");
              setPlayerPos((p) => ({ ...p, x: Math.min(930, p.x + 35) }));
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => {
            setPlayerFacing("down");
            setPlayerPos((p) => ({ ...p, y: Math.min(910, p.y + 35) }));
          }}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90"
        >
          ▼
        </button>
      </div>

      {/* 12. Desktop Bottom Left Controls Legend */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 shadow-lg pointer-events-none">
        <Footprints className="w-4 h-4 text-blue-400" />
        <span>Controls: <b>WASD</b> / <b>Arrows</b> to walk • <b>E</b> to interact • <b>Click</b> ground</span>
      </div>

      {/* 13. Environmental Vocabulary Object Modal */}
      {activeEnvObject && (
        <EnvironmentalObjectModal
          object={activeEnvObject}
          player={player}
          onClose={() => setActiveEnvObject(null)}
          onAddVocabulary={(word) => {
            onAddVocabulary && onAddVocabulary(word);
          }}
          onGainXpCoins={(xp, coins) => {
            onGainXpCoins && onGainXpCoins(xp, coins);
          }}
        />
      )}
    </main>
  );
};

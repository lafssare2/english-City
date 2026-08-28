import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
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
} from "../../types";
import { DISTRICTS, NPCS } from "../../data/initialData";
import { WorldEngine } from "../../services/city/WorldEngine";
import { CityEventEngine } from "../../services/city/CityEventEngine";
import { CITY_EVENTS } from "../../content/events/cityEvents";
import {
  ENVIRONMENTAL_LEARNING_OBJECTS,
  EnvironmentalLearningObject,
} from "../../content/vocabulary/environmentalVocabulary";
import { EnvironmentalObjectModal } from "../../components/city/EnvironmentalObjectModal";
import { sound } from "../../utils/audioSynthesizer";
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Train,
  ZoomIn,
  ZoomOut,
  Footprints,
  Layers,
  Compass,
} from "lucide-react";

import { World3DAdapter } from "./World3DAdapter";
import { Terrain3D } from "./Terrain3D";
import { RoadSystem3D } from "./RoadSystem3D";
import { BuildingSystem3D } from "./BuildingSystem3D";
import { Player3D } from "./Player3D";
import { NPCSystem3D } from "./NPCSystem3D";
import { VehicleSystem3D, SimulatedVehicle3D } from "./VehicleSystem3D";
import { StreetFurniture3D } from "./StreetFurniture3D";
import { SignSystem3D } from "./SignSystem3D";
import { Lighting3D } from "./Lighting3D";
import { CameraController } from "./CameraController";

interface City3DProps {
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
  onToggleViewMode?: () => void;
  viewMode?: "3d" | "2d";
}

export const City3D: React.FC<City3DProps> = ({
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
  onToggleViewMode,
  viewMode = "3d",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // Player position in 0-1000 coordinate space
  const [playerPos, setPlayerPos] = useState({ x: 500, y: 500 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right" | "up" | "down">("down");
  const [isMoving, setIsMoving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
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

  // Simulation Vehicles
  const vehiclesState = useRef<SimulatedVehicle3D[]>([
    { id: "v1", type: "taxi", x: 80, y: 472, direction: "right", speed: 2.4, color: "#facc15" },
    { id: "v2", type: "car", x: 920, y: 528, direction: "left", speed: 2.6, color: "#ef4444" },
    { id: "v3", type: "bus", x: 380, y: 472, direction: "right", speed: 1.6, color: "#0284c7" },
    { id: "v4", type: "ambulance", x: 820, y: 528, direction: "left", speed: 3.0, color: "#f8fafc" },
    { id: "v5", type: "police", x: 220, y: 472, direction: "right", speed: 2.8, color: "#1e3a8a" },
    { id: "v6", type: "delivery_van", x: 620, y: 528, direction: "left", speed: 2.1, color: "#e2e8f0" },
    { id: "v7", type: "bicycle", x: 500, y: 450, direction: "right", speed: 1.3, color: "#2563eb" },
    { id: "vp1", type: "car", x: 160, y: 432, direction: "right", speed: 0, color: "#475569", isParked: true },
    { id: "vp2", type: "car", x: 840, y: 432, direction: "right", speed: 0, color: "#059669", isParked: true },
  ]);

  // Spawn player near current location on district change
  useEffect(() => {
    const loc = districtLocations.find((l) => l.id === currentLocationId) || districtLocations[0];
    if (loc) {
      setPlayerPos({ x: loc.canvasX + 30, y: loc.canvasY + 60 });
    }
  }, [currentDistrictId, currentLocationId]);

  // Three.js Scene Setup & 60 FPS Animation Engine
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. WebGL Renderer
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    const cameraController = new CameraController(width / height);
    cameraController.setZoom(zoomLevel);

    // 3. Lighting & Day/Night Sky
    const lighting = new Lighting3D(scene, timeOfDay);
    scene.add(lighting.group);

    // 4. Terrain & Roads
    const terrainGroup = Terrain3D.createDistrictTerrain(currentDistrictId);
    scene.add(terrainGroup);

    const roadGroup = RoadSystem3D.createRoadNetwork(currentDistrictId);
    scene.add(roadGroup);

    // 5. Buildings
    const buildingsGroup = BuildingSystem3D.createDistrictBuildings(districtLocations, timeOfDay);
    scene.add(buildingsGroup);

    // 6. NPCs
    const npcsGroup = NPCSystem3D.createNPCGroup(districtNpcs, districtLocations);
    scene.add(npcsGroup);

    // 7. Vehicles
    const vehicleSystem = new VehicleSystem3D();
    scene.add(vehicleSystem.getGroup());

    // 8. Street Furniture Props & Signs
    const streetProps = StreetFurniture3D.createDistrictProps(currentDistrictId, timeOfDay);
    scene.add(streetProps);

    const signsGroup = SignSystem3D.createDistrictSigns(currentDistrictId);
    scene.add(signsGroup);

    // 9. 3D Player Character
    const player3D = new Player3D(player);
    scene.add(player3D.mesh);

    // 10. Weather Rain Particles
    let rainSystem: THREE.Points | null = null;
    if (weather === "rainy") {
      const rainGeo = new THREE.BufferGeometry();
      const rainCount = 1200;
      const rainPos = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount * 3; i += 3) {
        rainPos[i] = (Math.random() - 0.5) * 100;
        rainPos[i + 1] = Math.random() * 40;
        rainPos[i + 2] = (Math.random() - 0.5) * 100;
      }
      rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.25,
        transparent: true,
        opacity: 0.6,
      });
      rainSystem = new THREE.Points(rainGeo, rainMat);
      scene.add(rainSystem);
    }

    // 11. Render Loop
    let animId: number;
    let animTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      animTime += 16;

      // Update Vehicles Physics
      for (const veh of vehiclesState.current) {
        if (veh.isParked) continue;
        veh.x = veh.direction === "right" ? veh.x + veh.speed : veh.x - veh.speed;
        if (veh.direction === "right" && veh.x > 1080) veh.x = -80;
        if (veh.direction === "left" && veh.x < -80) veh.x = 1080;
      }
      vehicleSystem.updateVehicles(vehiclesState.current, timeOfDay, animTime);

      // Update Player
      player3D.update(playerPos.x, playerPos.y, playerFacing, isMoving, animTime, timeOfDay);

      // Update Camera Tracking
      const playerPos3D = World3DAdapter.to3D(playerPos.x, playerPos.y, 0);
      cameraController.setZoom(zoomLevel);
      cameraController.update(new THREE.Vector3(playerPos3D.x, playerPos3D.y, playerPos3D.z));

      // Animate Rain Particles
      if (rainSystem) {
        const positions = rainSystem.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.75;
          if (positions[i] < 0) positions[i] = 40;
        }
        rainSystem.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, cameraController.camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      cameraController.resize(w, h);
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      mount.innerHTML = "";
    };
  }, [currentDistrictId, timeOfDay, weather, playerPos, playerFacing, isMoving, zoomLevel, player]);

  // Keyboard Movement & Action Handlers (WASD / Arrows / E key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing in input fields
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const speed = 18;
      let dx = 0;
      let dy = 0;
      let facing: "left" | "right" | "up" | "down" = playerFacing;

      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        dy -= speed;
        facing = "up";
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        dy += speed;
        facing = "down";
      } else if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        dx -= speed;
        facing = "left";
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        dx += speed;
        facing = "right";
      } else if (e.key === "e" || e.key === "E") {
        // Contextual Interaction [E]
        if (nearestNpc) {
          sound.playDialoguePop();
          onSelectNpc(nearestNpc);
        } else if (nearestLocation) {
          sound.playClick();
          onEnterLocation(nearestLocation);
        } else if (nearestEnvObject) {
          sound.playClick();
          setActiveEnvObject(nearestEnvObject);
        } else if (nearestSign && onInspectSign) {
          sound.playClick();
          onInspectSign(nearestSign);
        }
        return;
      }

      if (dx !== 0 || dy !== 0) {
        setIsMoving(true);
        setPlayerFacing(facing);
        setPlayerPos((prev) => ({
          x: Math.max(60, Math.min(940, prev.x + dx)),
          y: Math.max(80, Math.min(920, prev.y + dy)),
        }));
      }
    };

    const handleKeyUp = () => {
      setIsMoving(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playerFacing, districtLocations, districtNpcs, districtEnvObjectNearest()]);

  // Distance computation for proximity
  function districtEnvObjectNearest() {
    return districtEnvObjects.find(
      (obj) => Math.hypot(obj.x - playerPos.x, obj.y - playerPos.y) < 70
    );
  }

  const nearestNpc = districtNpcs.find((npc) => {
    const loc = districtLocations.find((l) => l.id === npc.locationId) || districtLocations[0];
    const npcX = loc ? loc.canvasX + 25 : 500;
    const npcY = loc ? loc.canvasY + 65 : 500;
    return Math.hypot(npcX - playerPos.x, npcY - playerPos.y) < 75;
  });

  const nearestLocation = districtLocations.find(
    (loc) => Math.hypot(loc.canvasX - playerPos.x, loc.canvasY - playerPos.y) < 95
  );

  const nearestEnvObject = districtEnvObjectNearest();

  const nearestSign = districtSigns.find((_, idx) => {
    const signX = idx % 2 === 0 ? 180 : 680;
    const signY = 720;
    return Math.hypot(signX - playerPos.x, signY - playerPos.y) < 75;
  });

  return (
    <main
      ref={containerRef}
      id="city-3d-container"
      className="relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden select-none"
    >
      {/* 1. Three.js WebGL Canvas Mount Target */}
      <div
        ref={mountRef}
        id="webgl-canvas-mount"
        className="w-full h-full cursor-crosshair"
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
          const clickY = ((e.clientY - rect.top) / rect.height) * 1000;
          setActiveTargetReticle({ x: clickX, y: clickY });
          setTimeout(() => setActiveTargetReticle(null), 1200);

          setPlayerFacing(clickX > playerPos.x ? "right" : "left");
          setPlayerPos({
            x: Math.max(60, Math.min(940, clickX)),
            y: Math.max(80, Math.min(920, clickY)),
          });
        }}
      />

      {/* 2. District Header HUD Card */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl">
          <span className="text-2xl">🏙️</span>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold font-display text-white tracking-wide flex items-center gap-2">
              {districtInfo.name}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                3D World Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{districtInfo.description}</p>
          </div>
        </div>
      </div>

      {/* 3. Top Right Controls & Mini-Map */}
      <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Zoom & View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl">
          {onToggleViewMode && (
            <button
              id="toggle-view-mode-button"
              onClick={onToggleViewMode}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs font-semibold transition-colors"
              title="Switch between 3D World and 2.5D Canvas"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{viewMode === "3d" ? "3D" : "2D"}</span>
            </button>
          )}

          <button
            id="zoom-in-button"
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
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
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* 3D GPS Radar Minimap */}
        <div className="w-28 h-28 bg-slate-950/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl relative overflow-hidden hidden sm:block">
          {/* Mini Road Grid */}
          <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 bg-slate-800/80" />
          <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-slate-800/80" />

          {/* Mini Building Blocks */}
          {districtLocations.map((loc) => (
            <div
              key={loc.id}
              className="absolute w-3.5 h-3.5 rounded-xs bg-cyan-600/80 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${loc.canvasX / 10}%`,
                top: `${loc.canvasY / 10}%`,
              }}
            />
          ))}

          {/* Player Mini-Blip */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${playerPos.x / 10}%`,
              top: `${playerPos.y / 10}%`,
            }}
          />

          <div className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-500 font-bold">
            3D GPS
          </div>
        </div>
      </div>

      {/* 4. Proximity Action Prompt Bar (Press E to Interact) */}
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
                  Explore interior floors, counters, and tasks
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

      {/* 5. Mobile Virtual Touch D-Pad */}
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

      {/* 6. Desktop Bottom Left Controls Legend */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 shadow-lg pointer-events-none">
        <Footprints className="w-4 h-4 text-blue-400" />
        <span>3D Controls: <b>WASD</b> / <b>Arrows</b> to walk • <b>E</b> to interact • <b>Click</b> ground</span>
      </div>

      {/* 7. Environmental Vocabulary Object Modal */}
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

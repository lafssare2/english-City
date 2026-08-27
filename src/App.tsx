import React, { useState, useEffect } from "react";
import {
  PlayerProfile,
  DistrictId,
  TimeOfDay,
  WeatherType,
  NPC,
  CityLocation,
  Mission,
  VocabularyWord,
  CitySign,
  CityEvent,
} from "./types";
import {
  INITIAL_PLAYER,
  INITIAL_MISSIONS,
  INITIAL_VOCABULARY,
  DISTRICTS,
  CITY_LOCATIONS,
  NPCS,
} from "./data/initialData";
import { sound, setAudioMuted } from "./utils/audioSynthesizer";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { FirestoreService } from "./services/db/FirestoreService";
import { apiPost } from "./lib/apiClient";

// Sub-components
import { CityHUD } from "./components/CityHUD";
import { CityCanvas } from "./components/CityCanvas";
import { DialogueModal } from "./components/DialogueModal";
import { BuildingInterior } from "./components/BuildingInterior";
import { CityMapModal } from "./components/CityMapModal";
import { MissionsModal } from "./components/MissionsModal";
import { VocabularyModal } from "./components/VocabularyModal";
import { PlayerHomeModal } from "./components/PlayerHomeModal";
import { AITutorDrawer } from "./components/AITutorDrawer";
import { MiniGamesModal } from "./components/MiniGamesModal";
import { CareerCenterModal } from "./components/CareerCenterModal";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { AuthModal } from "./components/AuthModal";
import { SignInspectorModal } from "./components/SignInspectorModal";
import { CityEventModal } from "./components/CityEventModal";
import { TransitModal } from "./components/TransitModal";

export default function App() {
  // Persistence Keys
  const STORAGE_KEY_PLAYER = "english_city_player_v1";
  const STORAGE_KEY_MISSIONS = "english_city_missions_v1";
  const STORAGE_KEY_VOCAB = "english_city_vocab_v1";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Monitor network connectivity for offline resilience
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check if player completed onboarding
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY_PLAYER);
  });

  // Core Game State
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved player:", e);
      }
    }
    return INITIAL_PLAYER;
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved missions:", e);
      }
    }
    return INITIAL_MISSIONS;
  });

  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOCAB);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved vocab:", e);
      }
    }
    return INITIAL_VOCABULARY;
  });

  // Active tracking
  const [activeMissionId, setActiveMissionId] = useState<string>("m_airport_arrival");
  const [currentDistrictId, setCurrentDistrictId] = useState<DistrictId>(player.currentDistrictId || "transportation");
  const [currentLocationId, setCurrentLocationId] = useState<string>(player.currentLocationId || "loc_airport");

  // Environmental simulation
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [weather, setWeather] = useState<WeatherType>("sunny");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Modals & Overlays
  const [activeModal, setActiveModal] = useState<
    | "map"
    | "missions"
    | "vocabulary"
    | "home"
    | "tutor"
    | "minigames"
    | "career"
    | "analytics"
    | "admin"
    | "auth"
    | null
  >(null);

  const [activeNpcDialogue, setActiveNpcDialogue] = useState<NPC | null>(null);
  const [activeLocationInterior, setActiveLocationInterior] = useState<CityLocation | null>(null);
  const [inspectingSign, setInspectingSign] = useState<CitySign | null>(null);
  const [activeCityEvent, setActiveCityEvent] = useState<CityEvent | null>(null);
  const [showTransitModal, setShowTransitModal] = useState<boolean>(false);

  // Firebase Auth State Listener & Firestore Hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Authenticated user connected -> Hydrate from Firestore
        try {
          const cloudProfile = await FirestoreService.loadPlayerProfile(user.uid);
          if (cloudProfile) {
            setPlayer(cloudProfile);
            setHasCompletedOnboarding(true);
          } else {
            // New user in Firestore -> Save current profile under user.uid
            const syncedProfile = {
              ...player,
              userId: user.uid,
              name: user.displayName || player.name,
            };
            setPlayer(syncedProfile);
            await FirestoreService.savePlayerProfile(user.uid, syncedProfile);
          }

          // Hydrate vocabulary from Firestore
          const cloudVocab = await FirestoreService.loadVocabulary(user.uid);
          if (cloudVocab.length > 0) {
            setVocabulary(cloudVocab);
          } else {
            // Seed initial vocabulary to cloud
            for (const word of vocabulary) {
              await FirestoreService.saveVocabularyWord(user.uid, word);
            }
          }

          // Hydrate missions from Firestore
          const cloudMissions = await FirestoreService.loadMissions(user.uid);
          if (cloudMissions.length > 0) {
            setMissions(cloudMissions);
          } else {
            for (const mission of missions) {
              await FirestoreService.saveMission(user.uid, mission);
            }
          }
        } catch (err) {
          console.warn("Firestore hydration notice:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save Player and World Data to LocalStorage & Firestore
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(player));
    if (currentUser?.uid) {
      FirestoreService.savePlayerProfile(currentUser.uid, player);
    }
  }, [player, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(vocabulary));
  }, [vocabulary]);

  // Global Keyboard Accessibility: Close active modal or overlay on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showTransitModal) setShowTransitModal(false);
        else if (activeCityEvent) setActiveCityEvent(null);
        else if (inspectingSign) setInspectingSign(null);
        else if (showAuthModal) setShowAuthModal(false);
        else if (activeModal) setActiveModal(null);
        else if (activeNpcDialogue) setActiveNpcDialogue(null);
        else if (activeLocationInterior) setActiveLocationInterior(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showTransitModal,
    activeCityEvent,
    inspectingSign,
    showAuthModal,
    activeModal,
    activeNpcDialogue,
    activeLocationInterior,
  ]);

  // Audio mute toggling
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioMuted(!next);
  };

  // Fast travel from Map
  const handleFastTravel = (districtId: DistrictId) => {
    setCurrentDistrictId(districtId);
    setPlayer((prev) => ({ ...prev, currentDistrictId: districtId }));
    setActiveLocationInterior(null);
  };

  // Enter building interior
  const handleEnterLocation = (loc: CityLocation) => {
    sound.playTransitChime();
    setCurrentLocationId(loc.id);
    setActiveLocationInterior(loc);
  };

  // Add new vocabulary word
  const handleAddVocabulary = (word: VocabularyWord) => {
    setVocabulary((prev) => {
      if (prev.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) {
        return prev;
      }
      return [word, ...prev];
    });
    if (currentUser?.uid) {
      FirestoreService.saveVocabularyWord(currentUser.uid, word);
    }
  };

  // Update SRS Mastery for a word
  const handleUpdateWordMastery = (wordId: string, updatedWord: VocabularyWord) => {
    setVocabulary((prev) =>
      prev.map((w) => (w.id === wordId ? updatedWord : w))
    );
    if (currentUser?.uid) {
      FirestoreService.saveVocabularyWord(currentUser.uid, updatedWord);
    }
    // Award XP
    setPlayer((p) => ({ ...p, xp: p.xp + 25 }));
  };

  // Complete a mission objective (Server Authoritative)
  const handleCompleteObjective = (missionId: string, objectiveId: string) => {
    let shouldClaimReward = false;
    let fallbackXp = 200;
    let fallbackCoins = 50;

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId) {
          const updatedObjectives = m.objectives.map((obj) =>
            obj.id === objectiveId ? { ...obj, completed: true } : obj
          );
          const allDone = updatedObjectives.every((obj) => obj.completed);
          if (allDone && !m.rewardClaimed) {
            shouldClaimReward = true;
            fallbackXp = m.xpReward || 200;
            fallbackCoins = m.coinReward || 50;
          }
          const updatedMission = {
            ...m,
            objectives: updatedObjectives,
            status: (allDone ? "completed" : "in_progress") as "completed" | "in_progress",
            progressPercent: Math.round(
              (updatedObjectives.filter((o) => o.completed).length / updatedObjectives.length) * 100
            ),
          };
          return updatedMission;
        }
        return m;
      })
    );

    if (currentUser?.uid) {
      apiPost<{ success: boolean; isCompleted: boolean; xpAwarded: number; coinAwarded: number; player: any }>(
        "/api/player/mission/complete-objective",
        { missionId, objectiveId }
      )
        .then((res) => {
          if (res?.player) {
            setPlayer((prev) => ({
              ...prev,
              xp: res.player.xp ?? prev.xp,
              level: res.player.level ?? prev.level,
              coins: res.player.coins ?? prev.coins,
            }));
          }
        })
        .catch((err) => {
          console.warn("Server mission sync fallback:", err);
          if (shouldClaimReward) {
            handleReward(fallbackXp, fallbackCoins);
          }
        });
    } else if (shouldClaimReward) {
      handleReward(fallbackXp, fallbackCoins);
    }
  };

  // Gain XP and Coins reward (calls server if authenticated)
  const handleReward = (xpReward: number, coinReward: number) => {
    if (currentUser?.uid) {
      apiPost<{ xp: number; level: number; coins: number }>("/api/player/reward-xp", {
        xp: xpReward,
        coins: coinReward,
        reason: "Gameplay objective reward",
        source: "mission_completion",
      })
        .then((res) => {
          if (res && res.xp !== undefined) {
            setPlayer((prev) => ({
              ...prev,
              xp: res.xp,
              level: res.level ?? prev.level,
              coins: res.coins ?? (prev.coins + coinReward),
            }));
          }
        })
        .catch(() => {
          setPlayer((prev) => ({
            ...prev,
            xp: prev.xp + xpReward,
            coins: prev.coins + coinReward,
          }));
        });
    } else {
      setPlayer((prev) => ({
        ...prev,
        xp: prev.xp + xpReward,
        coins: prev.coins + coinReward,
      }));
    }
  };

  const handleOpenModal = (modalName: any) => {
    if (modalName === "auth") {
      setShowAuthModal(true);
    } else if (modalName === "transit") {
      setShowTransitModal(true);
    } else {
      setActiveModal(modalName);
    }
  };

  // Find active mission
  const currentActiveMission = missions.find((m) => m.id === activeMissionId);
  const currentLocation =
    CITY_LOCATIONS.find((l) => l.id === currentLocationId) || CITY_LOCATIONS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none font-sans">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg backdrop-blur-md animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-slate-950"></span>
          Offline Mode — Game state saved locally; will sync automatically when reconnected.
        </div>
      )}

      {/* 1. Onboarding Placement Modal for first-time citizens */}
      {!hasCompletedOnboarding && (
        <OnboardingFlow
          onComplete={(newProfile) => {
            setPlayer(newProfile);
            setHasCompletedOnboarding(true);
            if (currentUser?.uid) {
              FirestoreService.savePlayerProfile(currentUser.uid, newProfile);
            }
          }}
        />
      )}

      {/* 2. Top Game HUD Navigation */}
      <CityHUD
        player={player}
        activeMission={currentActiveMission}
        timeOfDay={timeOfDay}
        weather={weather}
        currentDistrictId={currentDistrictId}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSetTimeOfDay={setTimeOfDay}
        onSetWeather={setWeather}
        onOpenModal={handleOpenModal}
      />

      {/* 3. Main 2D Virtual City Canvas Simulation (When on street) */}
      <CityCanvas
        player={player}
        currentDistrictId={currentDistrictId}
        currentLocationId={currentLocationId}
        timeOfDay={timeOfDay}
        weather={weather}
        onSelectNpc={(npc) => {
          sound.playDialoguePop();
          setActiveNpcDialogue(npc);
        }}
        onEnterLocation={handleEnterLocation}
        onFastTravelDistrict={handleFastTravel}
        onInspectSign={(sign) => setInspectingSign(sign)}
        onOpenEvent={(event) => setActiveCityEvent(event)}
        onOpenTransit={() => setShowTransitModal(true)}
      />

      {/* 4. Building Interior Explorer (When stepped inside a cafe, airport, hotel, etc.) */}
      {activeLocationInterior && (
        <BuildingInterior
          location={activeLocationInterior}
          npcs={NPCS.filter((n) => n.locationId === activeLocationInterior.id)}
          player={player}
          timeOfDay={timeOfDay}
          onExit={() => setActiveLocationInterior(null)}
          onTalkToNpc={(npc) => {
            sound.playDialoguePop();
            setActiveNpcDialogue(npc);
          }}
          onGainXpCoins={handleReward}
          onAddVocabulary={handleAddVocabulary}
        />
      )}

      {/* 5. Cinematic NPC Dialogue Screen (Voice + Text + Clickable Translations + Feedback) */}
      {activeNpcDialogue && (
        <DialogueModal
          npc={activeNpcDialogue}
          player={player}
          activeMission={currentActiveMission}
          currentLocation={currentLocation}
          timeOfDay={timeOfDay}
          onClose={() => setActiveNpcDialogue(null)}
          onUpdatePlayer={setPlayer}
          onAddVocabulary={handleAddVocabulary}
          onCompleteObjective={handleCompleteObjective}
        />
      )}

      {/* 6. City Map & Fast Travel Taxi Modal */}
      {activeModal === "map" && (
        <CityMapModal
          player={player}
          currentDistrictId={currentDistrictId}
          activeMission={currentActiveMission}
          onClose={() => setActiveModal(null)}
          onFastTravel={handleFastTravel}
        />
      )}

      {/* 7. Quest & Mission Hub Modal */}
      {activeModal === "missions" && (
        <MissionsModal
          missions={missions}
          player={player}
          activeMissionId={activeMissionId}
          onClose={() => setActiveModal(null)}
          onSelectActiveMission={(m) => setActiveMissionId(m.id)}
          onAddNewMission={(m) => {
            setMissions((prev) => [m, ...prev]);
            if (currentUser?.uid) {
              FirestoreService.saveMission(currentUser.uid, m);
            }
          }}
        />
      )}

      {/* 8. Vocabulary SuperMemo SM-2 Vault Modal */}
      {activeModal === "vocabulary" && (
        <VocabularyModal
          vocabulary={vocabulary}
          player={player}
          onClose={() => setActiveModal(null)}
          onUpdateWordMastery={handleUpdateWordMastery}
          onAddCustomWord={handleAddVocabulary}
        />
      )}

      {/* 9. Player Home Loft & Wardrobe Modal */}
      {activeModal === "home" && (
        <PlayerHomeModal
          player={player}
          onClose={() => setActiveModal(null)}
          onUpdatePlayer={setPlayer}
        />
      )}

      {/* 10. 24/7 AI Tutor Professor Lily Drawer */}
      {activeModal === "tutor" && (
        <AITutorDrawer
          player={player}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 11. Mini-Games Language Arcade Modal */}
      {activeModal === "minigames" && (
        <MiniGamesModal
          player={player}
          onClose={() => setActiveModal(null)}
          onReward={handleReward}
        />
      )}

      {/* 12. Career Center & AI Job Interview Simulator Modal */}
      {activeModal === "career" && (
        <CareerCenterModal
          player={player}
          onClose={() => setActiveModal(null)}
          onReward={handleReward}
        />
      )}

      {/* 13. CEFR Analytics & Mastery Dashboard Modal */}
      {activeModal === "analytics" && (
        <AnalyticsDashboard
          player={player}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 14. Admin & Simulation Control Panel Modal */}
      {activeModal === "admin" && (
        <AdminPanelModal
          player={player}
          onClose={() => setActiveModal(null)}
          onUpdatePlayer={setPlayer}
        />
      )}

      {/* 15. User Authentication & Cloud Sync Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* 16. Environmental Sign Inspector Modal */}
      {inspectingSign && (
        <SignInspectorModal
          sign={inspectingSign}
          player={player}
          onClose={() => setInspectingSign(null)}
          onAddVocabulary={handleAddVocabulary}
          onEarnRewards={handleReward}
        />
      )}

      {/* 17. Dynamic City Event Modal */}
      {activeCityEvent && (
        <CityEventModal
          event={activeCityEvent}
          player={player}
          onClose={() => setActiveCityEvent(null)}
          onEventResolved={(eventId, xp, coins) => {
            handleReward(xp, coins);
          }}
        />
      )}

      {/* 18. Public Transit & Subway Modal */}
      {showTransitModal && (
        <TransitModal
          currentDistrictId={currentDistrictId}
          player={player}
          onClose={() => setShowTransitModal(false)}
          onTravel={(destDistrictId) => {
            handleFastTravel(destDistrictId);
            handleReward(15, 0);
          }}
        />
      )}
    </div>
  );
}

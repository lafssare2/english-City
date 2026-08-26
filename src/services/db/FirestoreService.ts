import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "../../lib/firebase";
import {
  PlayerProfile,
  VocabularyWord,
  NPCMemory,
  Mission,
  ConversationSession,
} from "../../types";

const LOCAL_PROFILE_KEY = "english_city_player_v1";
const LOCAL_VOCAB_KEY = "english_city_vocab_v1";
const LOCAL_MISSIONS_KEY = "english_city_missions_v1";
const LOCAL_MEMORIES_KEY = "english_city_npc_memories_v1";
const LOCAL_CONVOS_KEY = "english_city_convos_v1";

// In-memory fallback map for server/test environments without window.localStorage
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryStore.get(key) || null;
    }
  }
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  memoryStore.set(key, value);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  }
}

export class FirestoreService {
  /**
   * Loads or creates user profile in Firestore with automatic migration from localStorage
   */
  public static async loadOrCreateProfile(
    userId: string,
    email: string | null,
    defaultProfile: PlayerProfile
  ): Promise<{ profile: PlayerProfile; migrated: boolean }> {
    try {
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as Partial<PlayerProfile>;
        const merged: PlayerProfile = {
          ...defaultProfile,
          ...data,
          id: userId,
          userId,
          email: email || data.email || defaultProfile.email,
        };
        safeSetItem(LOCAL_PROFILE_KEY, JSON.stringify(merged));
        return { profile: merged, migrated: false };
      }

      // Check if local profile exists to migrate
      let profileToSave: PlayerProfile = {
        ...defaultProfile,
        id: userId,
        userId,
        email: email || undefined,
      };

      let didMigrate = false;
      const cached = safeGetItem(LOCAL_PROFILE_KEY);
      if (cached) {
        try {
          const localParsed = JSON.parse(cached);
          profileToSave = {
            ...profileToSave,
            ...localParsed,
            id: userId,
            userId,
            email: email || localParsed.email,
          };
          didMigrate = true;
        } catch (e) {}
      }

      await setDoc(userDocRef, {
        ...profileToSave,
        updatedAt: new Date().toISOString(),
      });

      safeSetItem(LOCAL_PROFILE_KEY, JSON.stringify(profileToSave));
      return { profile: profileToSave, migrated: didMigrate };
    } catch (err) {
      console.warn("Firestore offline/fallback for profile:", err);
      return { profile: defaultProfile, migrated: false };
    }
  }

  /**
   * Loads player profile by userId
   */
  public static async loadPlayerProfile(userId: string): Promise<PlayerProfile | null> {
    if (!userId || userId === "guest") {
      const cached = safeGetItem(LOCAL_PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    }

    try {
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const profile = userSnap.data() as PlayerProfile;
        safeSetItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
        return profile;
      }
      const cached = safeGetItem(LOCAL_PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      const cached = safeGetItem(LOCAL_PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  }

  /**
   * Persists profile updates to Firestore and local cache
   */
  public static async savePlayerProfile(userId: string, profile: PlayerProfile): Promise<void> {
    safeSetItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    if (!userId || userId === "guest") return;

    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(
        userDocRef,
        {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      // Offline fallback: already safely cached locally
    }
  }

  public static async saveProfile(userId: string, profile: PlayerProfile): Promise<void> {
    return this.savePlayerProfile(userId, profile);
  }

  /**
   * Saves or updates a vocabulary word with SM-2 spaced repetition telemetry
   */
  public static async saveVocabularyWord(userId: string, word: VocabularyWord): Promise<void> {
    const wordId = word.id || `vocab_${Date.now()}`;
    const wordWithId = { ...word, id: wordId };

    try {
      const cached = safeGetItem(LOCAL_VOCAB_KEY);
      const list: VocabularyWord[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(
        (w) => w?.id === wordWithId.id || (w?.word && w.word.toLowerCase() === wordWithId.word.toLowerCase())
      );
      if (idx >= 0) {
        list[idx] = wordWithId;
      } else {
        list.push(wordWithId);
      }
      safeSetItem(LOCAL_VOCAB_KEY, JSON.stringify(list));
    } catch (e) {}

    if (!userId || userId === "guest") return;

    try {
      const wordDocRef = doc(db, "users", userId, "vocabulary", wordId);
      await setDoc(
        wordDocRef,
        {
          ...wordWithId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      // Offline fallback: already cached locally
    }
  }

  /**
   * Loads user vocabulary list
   */
  public static async loadVocabulary(
    userId: string,
    initialWords: VocabularyWord[] = []
  ): Promise<VocabularyWord[]> {
    if (!userId || userId === "guest") {
      const cached = safeGetItem(LOCAL_VOCAB_KEY);
      return cached ? JSON.parse(cached) : initialWords;
    }

    try {
      const vocabColl = collection(db, "users", userId, "vocabulary");
      const snap = await getDocs(vocabColl);
      if (!snap.empty) {
        const words = snap.docs.map((d) => d.data() as VocabularyWord);
        safeSetItem(LOCAL_VOCAB_KEY, JSON.stringify(words));
        return words;
      }

      const cached = safeGetItem(LOCAL_VOCAB_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      for (const w of initialWords) {
        await this.saveVocabularyWord(userId, w);
      }
      return initialWords;
    } catch (err) {
      const cached = safeGetItem(LOCAL_VOCAB_KEY);
      return cached ? JSON.parse(cached) : initialWords;
    }
  }

  /**
   * Saves or updates a mission
   */
  public static async saveMission(userId: string, mission: Mission): Promise<void> {
    try {
      const cached = safeGetItem(LOCAL_MISSIONS_KEY);
      const list: Mission[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((m) => m?.id === mission.id);
      if (idx >= 0) {
        list[idx] = mission;
      } else {
        list.push(mission);
      }
      safeSetItem(LOCAL_MISSIONS_KEY, JSON.stringify(list));
    } catch (e) {}

    if (!userId || userId === "guest") return;

    try {
      const missionDocRef = doc(db, "users", userId, "missions", mission.id);
      await setDoc(
        missionDocRef,
        {
          ...mission,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      // Handled by local fallback cache
    }
  }

  /**
   * Loads user missions list
   */
  public static async loadMissions(userId: string): Promise<Mission[]> {
    if (!userId || userId === "guest") {
      const cached = safeGetItem(LOCAL_MISSIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const missionsColl = collection(db, "users", userId, "missions");
      const snap = await getDocs(missionsColl);
      if (!snap.empty) {
        const missions = snap.docs.map((d) => d.data() as Mission);
        safeSetItem(LOCAL_MISSIONS_KEY, JSON.stringify(missions));
        return missions;
      }
      const cached = safeGetItem(LOCAL_MISSIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      const cached = safeGetItem(LOCAL_MISSIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  }

  /**
   * Saves long-term NPC memories
   */
  public static async saveNPCMemory(userId: string, memory: NPCMemory): Promise<void> {
    try {
      const cached = safeGetItem(LOCAL_MEMORIES_KEY);
      const list: NPCMemory[] = cached ? JSON.parse(cached) : [];
      list.push(memory);
      safeSetItem(LOCAL_MEMORIES_KEY, JSON.stringify(list));
    } catch (e) {}

    if (!userId || userId === "guest") return;

    try {
      const memoryRef = doc(db, "users", userId, "npc_memories", memory.id);
      await setDoc(memoryRef, {
        ...memory,
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      // Local fallback active
    }
  }

  /**
   * Loads top relevant memories for an NPC
   */
  public static async loadNPCMemories(userId: string, npcId: string): Promise<NPCMemory[]> {
    if (!userId || userId === "guest") {
      const cached = safeGetItem(LOCAL_MEMORIES_KEY);
      const list: NPCMemory[] = cached ? JSON.parse(cached) : [];
      return list.filter((m) => m?.npcId === npcId);
    }

    try {
      const memoriesColl = collection(db, "users", userId, "npc_memories");
      const q = query(memoriesColl, where("npcId", "==", npcId), limit(10));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as NPCMemory);
      }
      const cached = safeGetItem(LOCAL_MEMORIES_KEY);
      const list: NPCMemory[] = cached ? JSON.parse(cached) : [];
      return list.filter((m) => m?.npcId === npcId);
    } catch (err) {
      const cached = safeGetItem(LOCAL_MEMORIES_KEY);
      const list: NPCMemory[] = cached ? JSON.parse(cached) : [];
      return list.filter((m) => m?.npcId === npcId);
    }
  }

  /**
   * Saves conversation history session
   */
  public static async saveConversation(userId: string, session: ConversationSession): Promise<void> {
    try {
      const cached = safeGetItem(LOCAL_CONVOS_KEY);
      const map: Record<string, ConversationSession> = cached ? JSON.parse(cached) : {};
      map[session.npcId] = session;
      safeSetItem(LOCAL_CONVOS_KEY, JSON.stringify(map));
    } catch (e) {}

    if (!userId || userId === "guest") return;

    try {
      const convoDoc = doc(db, "users", userId, "conversations", session.npcId);
      await setDoc(
        convoDoc,
        {
          ...session,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      // Handled by local fallback
    }
  }

  /**
   * Loads previous conversation history with an NPC
   */
  public static async loadConversation(userId: string, npcId: string): Promise<ConversationSession | null> {
    try {
      const cached = safeGetItem(LOCAL_CONVOS_KEY);
      if (cached) {
        const map: Record<string, ConversationSession> = JSON.parse(cached);
        if (map[npcId]) return map[npcId];
      }
    } catch (e) {}

    if (!userId || userId === "guest") return null;

    try {
      const convoDoc = doc(db, "users", userId, "conversations", npcId);
      const snap = await getDoc(convoDoc);
      if (snap.exists()) {
        return snap.data() as ConversationSession;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

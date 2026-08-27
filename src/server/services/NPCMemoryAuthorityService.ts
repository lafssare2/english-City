import { getAdminFirestore } from "../firebaseAdmin.js";
import { ExtractedMemory } from "./NPCMemoryService.js";
import crypto from "crypto";

export interface StoredNPCMemory extends ExtractedMemory {
  id: string;
  npcId: string;
  userId: string;
  createdAt: string;
  lastRecalledAt?: string;
  accessCount: number;
}

export class NPCMemoryAuthorityService {
  private static MAX_MEMORIES_PER_NPC = 15;

  /**
   * Sanitizes memory text to strip prompt injection phrases or illegal instruction tags
   */
  public static sanitizeSummary(text: string): string {
    if (!text) return "";
    let clean = text.slice(0, 300).trim();
    // Strip illegal prompt injections or permission tampering words
    clean = clean.replace(/(\[system\]|\badmin\b|\bgive [0-9]+\b|\bunlock all\b)/gi, "");
    return clean;
  }

  /**
   * Calculates similarity between two memory strings (simple word overlap metric)
   */
  public static calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let overlap = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) overlap++;
    }

    return (2 * overlap) / (wordsA.size + wordsB.size);
  }

  /**
   * Server-authoritatively merges and persists new memories for an NPC
   */
  public static async saveExtractedMemories(
    userId: string,
    npcId: string,
    newMemories: ExtractedMemory[]
  ): Promise<StoredNPCMemory[]> {
    if (!newMemories || newMemories.length === 0) return [];

    const db = getAdminFirestore();
    const memCollection = db.collection("users").doc(userId).collection("npc_memories");

    let existing: StoredNPCMemory[] = [];
    try {
      const snap = await memCollection.where("npcId", "==", npcId).get();
      existing = snap.docs.map((doc) => doc.data() as StoredNPCMemory);
    } catch (err) {
      console.warn("Memory load notice:", err);
    }

    const mergedList = [...existing];

    for (const raw of newMemories) {
      const cleanSummary = this.sanitizeSummary(raw.summary);
      if (!cleanSummary || cleanSummary.length < 5) continue;

      const importance = Math.max(1, Math.min(10, Math.floor(Number(raw.importance) || 5)));
      const confidence = Math.max(0.1, Math.min(1.0, Number(raw.confidence) || 0.8));

      // Check for duplicate or conflicting memory
      const existingMatchIndex = mergedList.findIndex(
        (m) => this.calculateSimilarity(m.summary, cleanSummary) > 0.65
      );

      if (existingMatchIndex >= 0) {
        // Update existing memory with higher confidence / updated summary
        const old = mergedList[existingMatchIndex];
        mergedList[existingMatchIndex] = {
          ...old,
          summary: cleanSummary,
          importance: Math.max(old.importance, importance),
          confidence: Math.max(old.confidence, confidence),
          lastRecalledAt: new Date().toISOString(),
          accessCount: (old.accessCount || 0) + 1,
        };
      } else {
        // Insert new memory
        const newRecord: StoredNPCMemory = {
          id: `mem_${crypto.randomUUID()}`,
          npcId,
          userId,
          memoryType: raw.memoryType || "personal_fact",
          summary: cleanSummary,
          importance,
          confidence,
          emotionalTone: raw.emotionalTone || "neutral",
          createdAt: new Date().toISOString(),
          accessCount: 1,
        };
        mergedList.push(newRecord);
      }
    }

    // Sort by importance descending
    mergedList.sort((a, b) => b.importance - a.importance);

    // Enforce memory cap (keep top MAX_MEMORIES_PER_NPC)
    const trimmed = mergedList.slice(0, this.MAX_MEMORIES_PER_NPC);

    // Save batch to Firestore
    try {
      const batch = db.batch();
      for (const m of trimmed) {
        const docRef = memCollection.doc(m.id);
        batch.set(docRef, m, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn("Memory persistence notice:", err);
    }

    return trimmed;
  }
}

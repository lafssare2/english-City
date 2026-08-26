import { getAdminFirestore } from "../firebaseAdmin.js";
import { LearnerSkillScores } from "./LearnerModelService.js";

export interface SkillObservation {
  skill: keyof LearnerSkillScores;
  score: number; // 0 - 100
  confidence: number; // 0.1 - 1.0
  taskDifficulty: "A1" | "A2" | "B1" | "B2" | "C1";
  source: string;
  timestamp: string;
}

export interface LearnerModelSnapshot {
  userId: string;
  skillScores: LearnerSkillScores;
  overallScore: number;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1";
  observationCount: number;
  lastUpdated: string;
}

export class LearnerModelAuthorityService {
  private static DEFAULT_SCORES: LearnerSkillScores = {
    vocabulary: 50,
    grammar: 50,
    pronunciation: 50,
    listening: 50,
    speaking: 50,
    fluency: 50,
    comprehension: 50,
  };

  /**
   * Evaluates CEFR level based on weighted skill scores and minimum evidence threshold
   */
  public static computeCEFRLevel(
    scores: LearnerSkillScores,
    observationCount: number
  ): "A1" | "A2" | "B1" | "B2" | "C1" {
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 7;

    // Sustained evidence requirement for higher tiers:
    // Need at least 5 observations for A2, 10 for B1, 20 for B2, 35 for C1
    if (avg >= 88 && observationCount >= 35) return "C1";
    if (avg >= 74 && observationCount >= 20) return "B2";
    if (avg >= 58 && observationCount >= 10) return "B1";
    if (avg >= 38 && observationCount >= 5) return "A2";
    
    // For lower observation counts, cap according to confidence
    if (avg >= 75 && observationCount >= 10) return "B1";
    if (avg >= 50 && observationCount >= 3) return "A2";
    
    return "A1";
  }

  /**
   * Server-authoritatively integrates telemetry observations into the Learner Model
   */
  public static async recordObservations(
    userId: string,
    observations: {
      fluencyScore?: number;
      grammarScore?: number;
      pronunciationAccuracy?: number;
      listeningAccuracy?: number;
      comprehensionAccuracy?: number;
      vocabularyUsedCount?: number;
      speakingDurationSec?: number;
    }
  ): Promise<LearnerModelSnapshot> {
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(userId);
    const telemetryRef = userRef.collection("learner_model").doc("current_state");

    let currentScores = { ...this.DEFAULT_SCORES };
    let observationCount = 0;

    try {
      const snap = await telemetryRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.skillScores) {
          currentScores = { ...currentScores, ...data.skillScores };
        }
        observationCount = Number(data?.observationCount) || 0;
      } else {
        const profileSnap = await userRef.get();
        if (profileSnap.exists && profileSnap.data()?.skillScores) {
          currentScores = { ...currentScores, ...profileSnap.data()?.skillScores };
        }
      }
    } catch (err) {
      console.warn("Learner model read notice:", err);
    }

    const alpha = 0.12; // Weight of new evidence (smooth EWMA filter)

    const updated: LearnerSkillScores = { ...currentScores };

    if (typeof observations.fluencyScore === "number" && observations.fluencyScore > 0) {
      const clamped = Math.max(10, Math.min(100, observations.fluencyScore));
      updated.fluency = Math.round(updated.fluency * (1 - alpha) + clamped * alpha);
      updated.speaking = Math.round(updated.speaking * (1 - alpha) + clamped * alpha);
      observationCount += 1;
    }

    if (typeof observations.grammarScore === "number" && observations.grammarScore > 0) {
      const clamped = Math.max(10, Math.min(100, observations.grammarScore));
      updated.grammar = Math.round(updated.grammar * (1 - alpha) + clamped * alpha);
      observationCount += 1;
    }

    if (typeof observations.pronunciationAccuracy === "number" && observations.pronunciationAccuracy > 0) {
      const clamped = Math.max(10, Math.min(100, observations.pronunciationAccuracy));
      updated.pronunciation = Math.round(updated.pronunciation * (1 - alpha) + clamped * alpha);
      observationCount += 1;
    }

    if (typeof observations.listeningAccuracy === "number" && observations.listeningAccuracy > 0) {
      const clamped = Math.max(10, Math.min(100, observations.listeningAccuracy));
      updated.listening = Math.round(updated.listening * (1 - alpha) + clamped * alpha);
      observationCount += 1;
    }

    if (typeof observations.comprehensionAccuracy === "number" && observations.comprehensionAccuracy > 0) {
      const clamped = Math.max(10, Math.min(100, observations.comprehensionAccuracy));
      updated.comprehension = Math.round(updated.comprehension * (1 - alpha) + clamped * alpha);
      observationCount += 1;
    }

    if (typeof observations.vocabularyUsedCount === "number" && observations.vocabularyUsedCount > 0) {
      updated.vocabulary = Math.min(100, updated.vocabulary + Math.min(2, observations.vocabularyUsedCount));
    }

    // Ensure all scores stay strictly bounded in [10, 100]
    for (const key of Object.keys(updated) as (keyof LearnerSkillScores)[]) {
      updated[key] = Math.max(10, Math.min(100, updated[key]));
    }

    const overallScore = Math.round(
      Object.values(updated).reduce((a, b) => a + b, 0) / 7
    );

    const cefrLevel = this.computeCEFRLevel(updated, observationCount);

    const snapshot: LearnerModelSnapshot = {
      userId,
      skillScores: updated,
      overallScore,
      cefrLevel,
      observationCount,
      lastUpdated: new Date().toISOString(),
    };

    // Save snapshot to Firestore
    try {
      await telemetryRef.set(snapshot, { merge: true });
      await userRef.set(
        {
          skillScores: updated,
          overallScore,
          cefrLevel,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Learner model persistence notice:", err);
    }

    return snapshot;
  }
}

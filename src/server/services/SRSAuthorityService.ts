import { getAdminFirestore } from "../firebaseAdmin.js";
import { SRSFlashcardService } from "./SRSFlashcardService.js";
import { EconomyService } from "./EconomyService.js";

export interface VocabularyCardData {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  arabicTranslation: string;
  example: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  mastery: number;
  repetitions: number;
  interval: number;
  easeFactor: number;
  lapses: number;
  retentionEstimate: number;
  nextReviewDate: string;
  timesReviewed: number;
}

export class SRSAuthorityService {
  /**
   * Server-authoritatively calculates SM-2 for a flashcard review
   */
  public static async processReview(
    userId: string,
    cardId: string,
    qualityRating: number
  ): Promise<{
    success: boolean;
    updatedCard: VocabularyCardData;
    xpAwarded: number;
    message: string;
  }> {
    // 1. Strict quality validation
    const quality = Math.max(0, Math.min(5, Math.floor(Number(qualityRating))));

    const db = getAdminFirestore();
    const cardRef = db.collection("users").doc(userId).collection("vocabulary").doc(cardId);

    let currentCard: Partial<VocabularyCardData> = {};

    try {
      const snap = await cardRef.get();
      if (snap.exists) {
        currentCard = snap.data() as VocabularyCardData;
      }
    } catch (err) {
      console.warn("Card lookup notice:", err);
    }

    // 2. Perform server-authoritative SM-2 calculation
    const sm2Result = SRSFlashcardService.calculateSM2(
      {
        repetitions: currentCard.repetitions ?? 0,
        interval: currentCard.interval ?? 1,
        easeFactor: currentCard.easeFactor ?? 2.5,
        lapses: currentCard.lapses ?? 0,
      },
      quality
    );

    const updatedCard: VocabularyCardData = {
      id: cardId,
      word: currentCard.word || "Word",
      phonetic: currentCard.phonetic || "/wɜːd/",
      partOfSpeech: currentCard.partOfSpeech || "noun",
      definition: currentCard.definition || "Definition",
      arabicTranslation: currentCard.arabicTranslation || "ترجمة",
      example: currentCard.example || "Example sentence.",
      level: currentCard.level || "A2",
      mastery: sm2Result.mastery,
      repetitions: sm2Result.repetitions,
      interval: sm2Result.interval,
      easeFactor: sm2Result.easeFactor,
      lapses: sm2Result.lapses,
      retentionEstimate: sm2Result.retentionEstimate,
      nextReviewDate: sm2Result.nextReviewDate,
      timesReviewed: (currentCard.timesReviewed ?? 0) + 1,
    };

    // 3. Persist card to Firestore
    try {
      await cardRef.set(updatedCard, { merge: true });
    } catch (err) {
      console.warn("Card persistence notice:", err);
    }

    // 4. Server-authoritatively award review XP (+15 XP base, +10 XP quality bonus)
    const baseReviewXp = 15;
    const bonusXp = quality >= 4 ? 10 : 0;
    const totalReviewXp = baseReviewXp + bonusXp;

    const rewardRes = await EconomyService.grantReward(userId, {
      xp: totalReviewXp,
      coins: quality === 5 ? 5 : 0,
      reason: `SRS Flashcard Review: ${updatedCard.word}`,
      source: `srs_${cardId}`,
    });

    return {
      success: true,
      updatedCard,
      xpAwarded: rewardRes.xpAwarded,
      message: `Card reviewed with quality score ${quality}. Next review in ${updatedCard.interval} day(s).`,
    };
  }
}

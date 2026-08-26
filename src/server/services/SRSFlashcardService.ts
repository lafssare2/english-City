export class SRSFlashcardService {
  /**
   * SuperMemo SM-2 Algorithm Implementation
   * 
   * @param currentCard Current card state
   * @param quality Quality rating 0 to 5:
   *   5: Perfect response, complete recall
   *   4: Correct response after a hesitation
   *   3: Correct response recalled with serious difficulty
   *   2: Incorrect response; where the correct one seemed easy to recall
   *   1: Incorrect response; the correct one remembered
   *   0: Complete blackout
   * @returns Updated SM-2 parameters preserved alongside existing card properties
   */
  public static calculateSM2<T extends {
    repetitions?: number;
    interval?: number;
    easeFactor?: number;
    lapses?: number;
  }>(
    currentCard: T,
    quality: number
  ): T & {
    repetitions: number;
    interval: number;
    easeFactor: number;
    lapses: number;
    retentionEstimate: number;
    lastQuality: number;
    mastery: number;
    lastReviewedAt: string;
    nextReviewDate: string;
  } {
    const q = Math.max(0, Math.min(5, quality));
    let repetitions = currentCard.repetitions ?? 0;
    let interval = currentCard.interval ?? 1;
    let easeFactor = currentCard.easeFactor ?? 2.5;
    let lapses = currentCard.lapses ?? 0;

    // Default ease factor safety fallback
    if (!easeFactor || easeFactor < 1.3) {
      easeFactor = 2.5;
    }
    if (repetitions < 0) {
      repetitions = 0;
    }
    if (interval < 0) {
      interval = 1;
    }

    // 1. Calculate new Ease Factor (EF')
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    easeFactor = Math.max(1.3, Number((easeFactor + efDelta).toFixed(3)));

    // 2. Determine Repetitions & Interval
    if (q < 3) {
      // Failed recall
      repetitions = 0;
      interval = 1; // reset to 1 day
      lapses += 1;
    } else {
      // Successful recall
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // 3. Compute retention estimate based on forgetting curve R(t) = exp(-t / (I * 1.2))
    const retentionEstimate = Number((Math.exp(-1 / (interval * 1.2))).toFixed(2));

    // 4. Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Map quality to visual 1-5 mastery stars
    const mastery = Math.min(5, Math.max(1, Math.round((repetitions * 1.2) + (q >= 4 ? 1 : 0))));

    return {
      ...currentCard,
      repetitions,
      interval,
      easeFactor,
      lapses,
      retentionEstimate,
      lastQuality: q,
      mastery,
      lastReviewedAt: new Date().toISOString(),
      nextReviewDate: nextReview.toISOString()
    };
  }
}

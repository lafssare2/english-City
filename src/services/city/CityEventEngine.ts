import { CityEvent, DistrictId, TimeOfDay, CEFRLevel, PlayerProfile } from "../../types";

export class CityEventEngine {
  /**
   * Filters active events available for the player in the current district and time of day
   */
  public static getAvailableEvents(
    allEvents: CityEvent[],
    districtId: DistrictId,
    timeOfDay: TimeOfDay,
    playerLevel: CEFRLevel
  ): CityEvent[] {
    return allEvents.filter(
      (ev) =>
        ev.districtId === districtId &&
        !ev.completed &&
        (!ev.activeTimeOfDay || ev.activeTimeOfDay.includes(timeOfDay))
    );
  }

  /**
   * Evaluates a player's response to a dynamic city event
   */
  public static evaluateEventResponse(
    event: CityEvent,
    response: string,
    playerLevel: CEFRLevel
  ): {
    success: boolean;
    feedback: string;
    arabicFeedback: string;
    xpAward: number;
    coinsAward: number;
    cefrAssessment: CEFRLevel;
  } {
    const wordCount = response.trim().split(/\s+/).length;
    const lower = response.toLowerCase();

    // Contextual evaluation heuristics
    let isSufficient = wordCount >= 3;
    let cefrAssessment: CEFRLevel = "A1";

    if (wordCount >= 14 && (lower.includes("could") || lower.includes("would") || lower.includes("recommend") || lower.includes("because"))) {
      cefrAssessment = "B2";
    } else if (wordCount >= 9 && (lower.includes("please") || lower.includes("should") || lower.includes("turn") || lower.includes("can"))) {
      cefrAssessment = "B1";
    } else if (wordCount >= 5) {
      cefrAssessment = "A2";
    }

    const xpAward = event.rewardXp || 100;
    const coinsAward = event.rewardCoins || 50;

    if (isSufficient) {
      return {
        success: true,
        feedback: `Excellent communication! You resolved the situation clearly and naturally. (Evaluated level: ${cefrAssessment})`,
        arabicFeedback: `تواصل ممتاز! لقد قمت بحل الموقف والتواصل بوضوح وسلاسة.`,
        xpAward,
        coinsAward,
        cefrAssessment,
      };
    } else {
      return {
        success: false,
        feedback: "Your response was a bit too brief to resolve the situation. Try using a complete sentence with polite phrasing.",
        arabicFeedback: "كانت إجابتك قصيرة جداً للتعامل مع هذا الموقف. حاول استخدام جملة كاملة بعبارات مهذبة.",
        xpAward: 20,
        coinsAward: 5,
        cefrAssessment: "A1",
      };
    }
  }
}

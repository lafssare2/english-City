import { CitySign, DistrictId, VocabularyWord, CEFRLevel } from "../../types";

export class CitySignEngine {
  /**
   * Evaluates a player's answer to an environmental sign comprehension question
   */
  public static evaluateSignQuiz(
    sign: CitySign,
    selectedIndex: number
  ): {
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
    coinsEarned: number;
    vocabularyExtracted: VocabularyWord[];
  } {
    if (!sign.comprehensionQuestion) {
      return {
        isCorrect: true,
        explanation: "Sign thoroughly inspected and vocabulary added to your vault!",
        xpEarned: 25,
        coinsEarned: 10,
        vocabularyExtracted: sign.vocabularyWords || [],
      };
    }

    const isCorrect = selectedIndex === sign.comprehensionQuestion.correctIndex;
    return {
      isCorrect,
      explanation: isCorrect
        ? `Correct! ${sign.comprehensionQuestion.explanation}`
        : `Not quite. ${sign.comprehensionQuestion.explanation}`,
      xpEarned: isCorrect ? 40 : 10,
      coinsEarned: isCorrect ? 15 : 5,
      vocabularyExtracted: sign.vocabularyWords || [],
    };
  }

  /**
   * Helper to format text with IPA phonetic preview
   */
  public static formatPhoneticPill(ipa: string): string {
    return `[${ipa.replace(/[/]/g, "")}]`;
  }
}

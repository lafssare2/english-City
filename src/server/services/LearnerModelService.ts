export interface LearnerSkillScores {
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  listening: number;
  speaking: number;
  fluency: number;
  comprehension: number;
}

export class LearnerModelService {
  /**
   * Updates learner 7-dimensional skill scores based on real session interaction telemetry
   */
  public static updateScores(
    currentScores: LearnerSkillScores,
    interaction: {
      dialogueFluency?: number;
      fluencyScore?: number;
      dialogueGrammar?: number;
      grammarScore?: number;
      vocabularyUsedCount?: number;
      pronunciationAccuracy?: number;
      listeningAccuracy?: number;
      comprehensionAccuracy?: number;
      speakingDurationSec?: number;
    }
  ): LearnerSkillScores {
    const alpha = 0.15; // Learning rate / weight of recent interaction

    const updated: LearnerSkillScores = { ...currentScores };

    const fluencyVal = interaction.dialogueFluency ?? interaction.fluencyScore;
    if (fluencyVal !== undefined && fluencyVal > 0) {
      updated.fluency = Math.round(updated.fluency * (1 - alpha) + fluencyVal * alpha);
      updated.speaking = Math.round(updated.speaking * (1 - alpha) + fluencyVal * alpha);
    }

    const grammarVal = interaction.dialogueGrammar ?? interaction.grammarScore;
    if (grammarVal !== undefined && grammarVal > 0) {
      updated.grammar = Math.round(updated.grammar * (1 - alpha) + grammarVal * alpha);
    }

    if (interaction.pronunciationAccuracy !== undefined && interaction.pronunciationAccuracy > 0) {
      updated.pronunciation = Math.round(updated.pronunciation * (1 - alpha) + interaction.pronunciationAccuracy * alpha);
    }

    if (interaction.listeningAccuracy !== undefined && interaction.listeningAccuracy > 0) {
      updated.listening = Math.round(updated.listening * (1 - alpha) + interaction.listeningAccuracy * alpha);
    }

    if (interaction.comprehensionAccuracy !== undefined && interaction.comprehensionAccuracy > 0) {
      updated.comprehension = Math.round(updated.comprehension * (1 - alpha) + interaction.comprehensionAccuracy * alpha);
    }

    if (interaction.vocabularyUsedCount && interaction.vocabularyUsedCount > 0) {
      updated.vocabulary = Math.min(100, updated.vocabulary + Math.min(3, interaction.vocabularyUsedCount));
    }

    // Clamp all scores between 10 and 100
    for (const key of Object.keys(updated) as (keyof LearnerSkillScores)[]) {
      updated[key] = Math.max(10, Math.min(100, updated[key]));
    }

    return updated;
  }

  /**
   * Computes recommended CEFR level based on average skill score
   */
  public static calculateCEFRLevel(averageScore: number): "A1" | "A2" | "B1" | "B2" | "C1" {
    if (averageScore >= 88) return "C1";
    if (averageScore >= 72) return "B2";
    if (averageScore >= 55) return "B1";
    if (averageScore >= 35) return "A2";
    return "A1";
  }
}

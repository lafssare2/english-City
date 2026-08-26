import { RealWorldTask, CEFRLevel, VocabularyWord } from "../../types";

export class RealWorldTaskEngine {
  /**
   * Adapts starter phrase and expectations to the player's CEFR level
   */
  public static getCEFRAdaptedPrompt(
    task: RealWorldTask,
    level: CEFRLevel
  ): {
    hint: string;
    expectedStructures: string[];
    sampleResponse: string;
  } {
    switch (level) {
      case "A1":
        return {
          hint: "Keep it simple and direct with basic polite words (please, thank you).",
          expectedStructures: ["I want...", "Please give me...", "Where is...?"],
          sampleResponse: task.starterPhrase || "Hello, I would like this please.",
        };
      case "A2":
        return {
          hint: "Use polite question forms (Could I have..., Can you help me with...).",
          expectedStructures: ["Could I please have...", "Do you have...?", "How much is...?"],
          sampleResponse: `Excuse me, could you please help me with ${task.objectiveText.toLowerCase()}?`,
        };
      case "B1":
        return {
          hint: "Add reasons or preferences to your request (because, if possible, I prefer...).",
          expectedStructures: ["I'd like to ask if...", "Could you let me know when...", "I was wondering if..."],
          sampleResponse: `Hi there, I'd like to ${task.objectiveText.toLowerCase()} if possible, because I have a specific request.`,
        };
      case "B2":
      case "C1":
        return {
          hint: "Use sophisticated modal verbs, conditional framing, and diplomatic nuance.",
          expectedStructures: [
            "I would appreciate it if you could...",
            "Would it be at all possible to...",
            "Could you perhaps clarify the procedure for...",
          ],
          sampleResponse: `Good day. I would appreciate some assistance with ${task.objectiveText.toLowerCase()}, particularly regarding the exact details.`,
        };
    }
  }

  /**
   * Validates if a learner's utterance fulfills the task objective
   */
  public static evaluateTaskAttempt(
    task: RealWorldTask,
    utterance: string,
    playerLevel: CEFRLevel
  ): {
    completed: boolean;
    feedback: string;
    arabicFeedback: string;
    vocabMatches: string[];
    grammarBonus: boolean;
    earnedXp: number;
    earnedCoins: number;
  } {
    const lower = utterance.toLowerCase();
    const words = lower.split(/\s+/);

    const vocabMatches = task.targetVocab.filter((v) => lower.includes(v.toLowerCase()));
    const grammarMatches = task.targetGrammar.filter((g) => lower.includes(g.toLowerCase()));

    const isComplete = words.length >= 4 && (vocabMatches.length > 0 || words.length >= 8);
    const grammarBonus = grammarMatches.length > 0;

    const baseScore = task.rewardXp || 120;
    const earnedXp = isComplete ? (grammarBonus ? baseScore + 30 : baseScore) : 25;
    const earnedCoins = isComplete ? task.rewardCoins || 40 : 10;

    if (isComplete) {
      return {
        completed: true,
        feedback: `Task Completed! You fulfilled the objective naturally. (${vocabMatches.length} target vocabulary items used)`,
        arabicFeedback: `تم إنجاز المهمة بنجاح! لقد استخدمت المفردات والعبارات المناسبة للموقف.`,
        vocabMatches,
        grammarBonus,
        earnedXp,
        earnedCoins,
      };
    } else {
      return {
        completed: false,
        feedback: `Good attempt, but try to incorporate target words like "${task.targetVocab.slice(0, 2).join(", ")}" and speak in a complete sentence.`,
        arabicFeedback: `محاولة جيدة، لكن حاول تضمين المفردات المستهدفة والتحدث بجملة كاملة وواضحة.`,
        vocabMatches,
        grammarBonus: false,
        earnedXp,
        earnedCoins,
      };
    }
  }
}

import { NPC, NPCRelationshipTier } from "../../types";

export interface RelationshipProgressionResult {
  previousScore: number;
  newScore: number;
  previousTier: NPCRelationshipTier;
  newTier: NPCRelationshipTier;
  tierUpgraded: boolean;
  unlockedPerks: string[];
  arabicPerks: string[];
}

export class NPCRelationshipEngine {
  /**
   * Calculates relationship tier from score (0-100)
   */
  public static calculateTier(score: number): NPCRelationshipTier {
    if (score >= 90) return "Trusted Friend";
    if (score >= 70) return "Friend";
    if (score >= 45) return "Regular Customer";
    if (score >= 20) return "Acquaintance";
    return "Stranger";
  }

  /**
   * Adds relationship points based on quality of conversation, mission help, or gift
   */
  public static addInteractionPoints(
    npc: NPC,
    pointsToAdd: number
  ): RelationshipProgressionResult {
    const previousScore = npc.relationshipScore || 0;
    const previousTier = npc.relationshipTier || this.calculateTier(previousScore);

    const newScore = Math.min(100, Math.max(0, previousScore + pointsToAdd));
    const newTier = this.calculateTier(newScore);
    const tierUpgraded = newTier !== previousTier && newScore > previousScore;

    const unlockedPerks: string[] = [];
    const arabicPerks: string[] = [];

    if (tierUpgraded) {
      switch (newTier) {
        case "Acquaintance":
          unlockedPerks.push(`Can discuss personal interests and daily routines with ${npc.name}`);
          arabicPerks.push(`إمكانية مناقشة الاهتمامات والروتين اليومي مع ${npc.name}`);
          break;
        case "Regular Customer":
          unlockedPerks.push(`Received 10% discount and insider tips at ${npc.locationName}`);
          arabicPerks.push(`الحصول على خصم 10% ونصائح خاصة في ${npc.locationName}`);
          break;
        case "Friend":
          unlockedPerks.push(`Unlocked private backstory missions and hangout invitations from ${npc.name}`);
          arabicPerks.push(`فتح مهام قصصية خاصة ودعوات لقاء من ${npc.name}`);
          break;
        case "Trusted Friend":
          unlockedPerks.push(`Mastery recommendation letter and exclusive career endorsements`);
          arabicPerks.push(`خطاب توصية متقدم وتزكية مهنية حصرية`);
          break;
      }
    }

    return {
      previousScore,
      newScore,
      previousTier,
      newTier,
      tierUpgraded,
      unlockedPerks,
      arabicPerks,
    };
  }

  /**
   * Returns greeting context based on relationship tier
   */
  public static getTierGreeting(npc: NPC, playerName: string): string {
    const tier = npc.relationshipTier || "Stranger";
    switch (tier) {
      case "Trusted Friend":
        return `Hey ${playerName}! Wonderful to see you again. I was actually just thinking about our last conversation!`;
      case "Friend":
        return `Hello ${playerName}! Great to have you stop by today. How have things been going?`;
      case "Regular Customer":
        return `Welcome back, ${playerName}! Ready for the usual today?`;
      case "Acquaintance":
        return `Good day, ${playerName}. How can I assist you today?`;
      case "Stranger":
      default:
        return npc.greetingText || `Hello there! Welcome to ${npc.locationName}. How can I help you?`;
    }
  }
}

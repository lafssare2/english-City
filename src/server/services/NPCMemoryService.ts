import { GoogleGenAI, Type, Schema } from "@google/genai";

export interface ExtractedMemory {
  memoryType: "preference" | "personal_fact" | "shared_event" | "goal" | "opinion";
  summary: string;
  importance: number; // 1 to 10
  confidence: number; // 0.0 to 1.0
  emotionalTone?: "positive" | "neutral" | "urgent" | "reflective";
}

export class NPCMemoryService {
  /**
   * Extract meaningful facts from dialogue between player and NPC
   */
  public static async extractMemories(
    ai: GoogleGenAI,
    npcName: string,
    dialogueHistory: { speaker: string; text: string }[]
  ): Promise<ExtractedMemory[]> {
    if (!dialogueHistory || dialogueHistory.length < 2) {
      return [];
    }

    try {
      const dialogueText = dialogueHistory
        .map((m) => `${m.speaker}: "${m.text}"`)
        .join("\n");

      const prompt = `You are a memory extraction engine for an open-world AI English learning game.
Analyze the following dialogue between the learner and NPC "${npcName}".
Identify if the learner shared any important personal facts, preferences, learning goals, background, food choices, job aspirations, or memorable events that ${npcName} should remember in future days.

Dialogue:
${dialogueText}

Return a JSON array of extracted memories. If nothing memorable was shared (just generic greetings or trivial answers), return an empty array.
Each memory should have:
- memoryType: one of ["preference", "personal_fact", "shared_event", "goal", "opinion"]
- summary: A concise 1-sentence description in English (e.g. "Learner loves iced oat lattes", "Learner is interviewing for a junior software developer role", "Learner prefers British pronunciation")
- importance: Integer 1 to 10 (10 = life goal or major event, 5 = food/drink preference, 1 = trivial)
- confidence: Float 0.1 to 1.0
- emotionalTone: "positive" | "neutral" | "urgent" | "reflective"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                memoryType: {
                  type: Type.STRING,
                  enum: ["preference", "personal_fact", "shared_event", "goal", "opinion"]
                },
                summary: { type: Type.STRING },
                importance: { type: Type.INTEGER },
                confidence: { type: Type.NUMBER },
                emotionalTone: {
                  type: Type.STRING,
                  enum: ["positive", "neutral", "urgent", "reflective"]
                }
              },
              required: ["memoryType", "summary", "importance", "confidence"]
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (err) {
      console.warn("NPC memory extraction non-blocking error:", err);
      return [];
    }
  }

  /**
   * Formats top relevant memories to inject into NPC system prompts
   */
  public static formatMemoriesForPrompt(memories: { summary: string; importance: number; createdAt?: string }[]): string {
    if (!memories || memories.length === 0) {
      return "No prior long-term memories with this learner yet.";
    }

    // Sort by highest importance first and take top 5 to prevent token bloat
    const topMemories = [...memories]
      .sort((a, b) => (b.importance || 5) - (a.importance || 5))
      .slice(0, 5);

    return topMemories
      .map((m) => `- ${m.summary} (Importance: ${m.importance}/10)`)
      .join("\n");
  }
}

import { GoogleGenAI, Type } from "@google/genai";

export class MissionGenerationService {
  public static async generateDynamicQuest(
    ai: GoogleGenAI,
    playerLevel: string,
    districtName: string,
    weakSkills: string[] = []
  ) {
    const prompt = `Generate a realistic English learning roleplay mission in the ${districtName} district of English City.
Target CEFR Level: ${playerLevel}.
Learner's Weak Skills to target: ${weakSkills.length > 0 ? weakSkills.join(", ") : "general spoken fluency, situational vocabulary"}.

Create an engaging multi-step quest with 3 clear progressive objectives.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            arabicTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            level: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1"] },
            xpReward: { type: Type.INTEGER },
            coinReward: { type: Type.INTEGER },
            targetVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetGrammar: { type: Type.ARRAY, items: { type: Type.STRING } },
            objectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  arabicText: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["id", "text", "completed"]
              }
            }
          },
          required: ["title", "description", "level", "xpReward", "coinReward", "targetVocabulary", "targetGrammar", "objectives"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Failed to generate dynamic mission");
    }

    return JSON.parse(response.text);
  }
}

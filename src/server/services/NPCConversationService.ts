import { GoogleGenAI, Type } from "@google/genai";
import { NPCMemoryService } from "./NPCMemoryService.js";

export interface ConversationTurnRequest {
  npc: {
    id: string;
    name: string;
    occupation: string;
    personality: string;
    speakingStyle: string;
    accent: string;
    level: string;
    locationName: string;
  };
  player: {
    name: string;
    level: string;
    supportLanguage: string;
  };
  message: string;
  history: { speaker: string; text: string }[];
  memories?: { summary: string; importance: number }[];
  activeObjective?: string;
}

export class NPCConversationService {
  public static async generateTurn(ai: GoogleGenAI | null, data: ConversationTurnRequest) {
    const { npc, player, message, history, memories, activeObjective } = data;

    if (!ai) {
      return {
        reply: `Hello ${player.name}! It is wonderful to meet you here at ${npc.locationName}. How are your English studies coming along today?`,
        arabicSummary: `مرحباً بك! يسعدني لقاؤك هنا. كيف تسير دراستك للغة الإنجليزية اليوم؟`,
        missionObjectiveCompleted: false,
        evaluation: {
          fluencyScore: 88,
          grammarScore: 90,
          feedbackTip: "Great, polite phrasing!",
        },
        corrections: [],
        discoveredVocabulary: [
          {
            word: "delighted",
            phonetic: "/dɪˈlaɪ.tɪd/",
            partOfSpeech: "adjective",
            definition: "feeling or showing great pleasure",
            arabicTranslation: "مسرور / مبتهج",
            example: "I am delighted to meet you.",
            level: "B1",
          },
        ],
      };
    }

    const formattedMemories = NPCMemoryService.formatMemoriesForPrompt(memories || []);

    const historyFormatted = (history || [])
      .slice(-8)
      .map((h) => `${h.speaker === "player" ? player.name : npc.name}: ${h.text}`)
      .join("\n");

    const systemInstruction = `You are ${npc.name}, a ${npc.occupation} located at ${npc.locationName} in the virtual world of English City.
Personality: ${npc.personality}.
Speaking Style: ${npc.speakingStyle}.
Accent/Dialect: ${npc.accent}.

[TARGET LEARNER PROFILE]:
- Learner Name: ${player.name}
- CEFR English Level: ${player.level}
- Native Support Language: ${player.supportLanguage || "Arabic"}

[LONG-TERM MEMORIES WITH THIS LEARNER]:
${formattedMemories}

${activeObjective ? `[CURRENT ACTIVE MISSION OBJECTIVE]: "${activeObjective}". If the learner successfully completes or asks about this objective in natural English, acknowledge it in character and set missionObjectiveCompleted to true.` : ""}

[PEDAGOGICAL & DIALOGUE RULES]:
1. Stay strictly in-character as ${npc.name}. Respond with natural, spoken English appropriate for CEFR level ${player.level}.
2. For A1/A2 learners, use clear high-frequency vocabulary, shorter sentences, and helpful polite questions.
3. For B1/B2/C1 learners, use natural idiomatic phrasing, phrasal verbs, and authentic conversational nuance.
4. If you have long-term memories with the player, naturally reference them when relevant (e.g. asking how their job interview went or offering their favorite drink).
5. Analyze the learner's last sentence carefully:
   - If they made a grammar, tense, or word choice error, provide a gentle correction in the "corrections" array with a clear English explanation and an ${player.supportLanguage || "Arabic"} explanation.
   - Extract 1-3 useful vocabulary words from the context with phonetic transcription and ${player.supportLanguage || "Arabic"} translation.
   - Rate their sentence fluency and grammar on a 0-100 scale.`;

    const prompt = `Recent Conversation:
${historyFormatted}
${player.name}: "${message}"

Respond in-character as ${npc.name} according to the specified JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "NPC in-character spoken English response" },
            arabicSummary: { type: Type.STRING, description: "Brief Arabic translation of the NPC reply" },
            missionObjectiveCompleted: { type: Type.BOOLEAN, description: "True if learner satisfied the active quest goal" },
            evaluation: {
              type: Type.OBJECT,
              properties: {
                fluencyScore: { type: Type.INTEGER, description: "0 to 100" },
                grammarScore: { type: Type.INTEGER, description: "0 to 100" },
                feedbackTip: { type: Type.STRING },
              },
              required: ["fluencyScore", "grammarScore"],
            },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  corrected: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  arabicExplanation: { type: Type.STRING },
                },
                required: ["original", "corrected", "explanation"],
              },
            },
            discoveredVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  arabicTranslation: { type: Type.STRING },
                  example: { type: Type.STRING },
                  level: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1"] },
                },
                required: ["word", "phonetic", "definition", "arabicTranslation", "example", "level"],
              },
            },
          },
          required: ["reply", "evaluation", "corrections", "discoveredVocabulary"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI engine");
    }

    return JSON.parse(response.text);
  }
}

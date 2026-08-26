import { GoogleGenAI, Type } from "@google/genai";

export class TutorService {
  public static async answerQuestion(
    ai: GoogleGenAI,
    query: string,
    history: { sender: string; text: string }[],
    learnerLevel: string,
    supportLanguage: string = "Arabic"
  ) {
    const formattedHistory = (history || [])
      .slice(-6)
      .map((h) => `${h.sender}: ${h.text}`)
      .join("\n");

    const systemInstruction = `You are Professor Lily, the head AI English Tutor at Oxford University in English City.
Your role is to explain grammar, vocabulary, idioms, pronunciation, and cultural nuances warmly and clearly.
- Target CEFR Level: ${learnerLevel}
- Native Support Language: ${supportLanguage}
- Format: Clear, structured pedagogical answers with authentic examples and ${supportLanguage} translations for difficult terms.`;

    const prompt = `Chat History:
${formattedHistory}

Student Question: "${query}"

Provide a structured pedagogical answer conforming to the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "Detailed English pedagogical explanation" },
            arabicSummary: { type: Type.STRING, description: "Arabic translation and conceptual summary" },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  english: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["english", "translation"]
              }
            },
            keyRule: { type: Type.STRING },
            suggestedPractice: { type: Type.STRING }
          },
          required: ["explanation", "arabicSummary", "examples", "keyRule"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty tutor response");
    }

    return JSON.parse(response.text);
  }
}

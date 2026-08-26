import { GoogleGenAI, Type } from "@google/genai";

export class PronunciationService {
  public static async evaluateSpokenText(
    ai: GoogleGenAI,
    targetSentence: string,
    spokenTranscript: string,
    learnerCEFR: string = "A2"
  ) {
    const prompt = `You are an expert English phonetics coach.
Compare the expected sentence with the spoken transcript:
Expected: "${targetSentence}"
Spoken: "${spokenTranscript}"
Learner CEFR: ${learnerCEFR}

Analyze phonetic accuracy, identify difficult words, break down syllable stress, and provide a constructive praise and Arabic learning tip.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Overall 0-100 score" },
            accuracyScore: { type: Type.INTEGER },
            fluencyScore: { type: Type.INTEGER },
            phoneticBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  syllable: { type: Type.STRING },
                  correctStress: { type: Type.BOOLEAN },
                  tip: { type: Type.STRING }
                },
                required: ["syllable", "correctStress", "tip"]
              }
            },
            difficultWords: { type: Type.ARRAY, items: { type: Type.STRING } },
            arabicTip: { type: Type.STRING },
            praise: { type: Type.STRING }
          },
          required: ["score", "accuracyScore", "fluencyScore", "phoneticBreakdown", "difficultWords", "arabicTip", "praise"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty pronunciation evaluation");
    }

    return JSON.parse(response.text);
  }
}

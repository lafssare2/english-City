import { GoogleGenAI, Type } from "@google/genai";

export class EvaluationService {
  public static async evaluateInterview(
    ai: GoogleGenAI,
    career: {
      title: string;
      companyName: string;
      level: string;
      targetSkills: string[];
    },
    candidateName: string,
    transcript: { question: string; answer: string }[]
  ) {
    const transcriptFormatted = transcript
      .map((t, idx) => `Q${idx + 1}: ${t.question}\nCandidate: "${t.answer}"`)
      .join("\n\n");

    const systemInstruction = `You are the AI Hiring Board & English Evaluator for ${career.companyName} in English City.
Target Position: ${career.title} (CEFR Required: ${career.level}).
Candidate Name: ${candidateName}.
Target Industry Skills: ${career.targetSkills.join(", ")}.

Evaluate the candidate's interview transcript across 4 core pillars:
1. Professional Fluency (0-100)
2. Grammar & Sentence Structure (0-100)
3. Industry Vocabulary Usage (0-100)
4. STAR Method & Relevance (0-100)

Provide constructive feedback, highlight strengths and areas for improvement, state whether they are HIRED (score >= 70) or invited to retake, and provide tips in Arabic and English.`;

    const prompt = `Interview Transcript:
${transcriptFormatted}

Evaluate this candidate according to the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            fluencyScore: { type: Type.INTEGER },
            grammarScore: { type: Type.INTEGER },
            vocabularyScore: { type: Type.INTEGER },
            hired: { type: Type.BOOLEAN },
            decisionSummary: { type: Type.STRING },
            decisionArabic: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedCareerLevel: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1"] }
          },
          required: ["overallScore", "fluencyScore", "grammarScore", "vocabularyScore", "hired", "decisionSummary", "strengths", "improvements"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty interview evaluation");
    }

    return JSON.parse(response.text);
  }
}

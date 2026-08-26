import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Modular Services
import { NPCConversationService } from "./src/server/services/NPCConversationService.js";
import { NPCMemoryService } from "./src/server/services/NPCMemoryService.js";
import { LearnerModelService } from "./src/server/services/LearnerModelService.js";
import { SRSFlashcardService } from "./src/server/services/SRSFlashcardService.js";
import { EvaluationService } from "./src/server/services/EvaluationService.js";
import { TutorService } from "./src/server/services/TutorService.js";
import { MissionGenerationService } from "./src/server/services/MissionGenerationService.js";
import { PronunciationService } from "./src/server/services/PronunciationService.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Rate Limiter Map for API endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limit: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count += 1;
    rateLimitMap.set(ip, entry);

    if (entry.count > limit) {
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }
    next();
  };
}

// ── Health Check ──
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    aiConfigured: !!process.env.GEMINI_API_KEY,
    databaseConfigured: true,
    timestamp: new Date().toISOString(),
  });
});

// ── 1. NPC Dialogue Turn Engine (Delegated to NPCConversationService) ──
app.post("/api/ai/npc-chat", rateLimiter(40, 60000), async (req: Request, res: Response) => {
  try {
    const { npc, player, conversationHistory, playerMessage, activeMission, memories } = req.body;
    const ai = getAI();

    if (!ai) {
      // Graceful offline fallback
      return res.json({
        reply: `Hello ${player?.name || "there"}! Welcome to ${npc?.locationName || "the city"}. How can I assist you on your English journey today?`,
        arabicSummary: "مرحباً بك! كيف يمكنني مساعدتك في رحلتك لتعلم اللغة الإنجليزية اليوم؟",
        missionObjectiveCompleted: false,
        evaluation: {
          fluencyScore: 85,
          grammarScore: 88,
          feedbackTip: "Natural, polite greeting!",
        },
        corrections: [],
        discoveredVocabulary: [
          {
            word: "recommend",
            phonetic: "/ˌrek.əˈmend/",
            partOfSpeech: "verb",
            definition: "to advise or suggest something as suitable",
            arabicTranslation: "يوصي / يقترح",
            example: "Can you recommend a good dish?",
            level: "A2",
          },
        ],
      });
    }

    const turnResult = await NPCConversationService.generateTurn(ai, {
      npc: {
        id: npc?.id || "npc_default",
        name: npc?.name || "Resident",
        occupation: npc?.occupation || "Local Guide",
        personality: npc?.personality || "Warm, polite, helpful",
        speakingStyle: npc?.speakingStyle || "Natural, clear English",
        accent: npc?.accent || "Standard Neutral",
        level: npc?.level || "A2",
        locationName: npc?.locationName || "City Square",
      },
      player: {
        name: player?.name || "Explorer",
        level: player?.level || "A2",
        supportLanguage: player?.supportLanguage || "Arabic",
      },
      message: playerMessage || "",
      history: conversationHistory || [],
      memories: memories || [],
      activeObjective: activeMission?.objectives?.find((o: any) => !o.completed)?.text,
    });

    return res.json(turnResult);
  } catch (error: any) {
    console.error("Error in /api/ai/npc-chat:", error);
    res.status(500).json({
      reply: "Excuse me, I missed that for a moment. Could you repeat that?",
      arabicSummary: "عذراً، لم أسمعك جيداً. هل يمكنك التكرار؟",
      corrections: [],
      discoveredVocabulary: [],
      error: error.message,
    });
  }
});

// ── 2. Long-Term Memory Extraction (Delegated to NPCMemoryService) ──
app.post("/api/player/extract-memories", rateLimiter(30, 60000), async (req: Request, res: Response) => {
  try {
    const { npcName, history } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.json({ extractedMemories: [] });
    }

    const memories = await NPCMemoryService.extractMemories(ai, npcName || "Sarah", history || []);
    res.json({ extractedMemories: memories });
  } catch (err: any) {
    console.error("Error extracting memories:", err);
    res.status(500).json({ extractedMemories: [] });
  }
});

// ── 3. Spaced Repetition (SRS) Engine via SM-2 ──
app.post("/api/player/srs-review", (req: Request, res: Response) => {
  try {
    const { card, quality } = req.body;
    if (!card || quality === undefined) {
      return res.status(400).json({ error: "Missing card state or quality rating" });
    }

    const updatedCard = SRSFlashcardService.calculateSM2(card, quality);
    res.json({ success: true, updatedCard });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. Persistent Learner Telemetry Model ──
app.post("/api/player/telemetry-update", (req: Request, res: Response) => {
  try {
    const { currentScores, interaction } = req.body;
    if (!currentScores) {
      return res.status(400).json({ error: "Missing currentScores" });
    }

    const updated = LearnerModelService.updateScores(currentScores, interaction || {});
    const cefr = LearnerModelService.calculateCEFRLevel(
      Object.values(updated).reduce((a, b) => a + b, 0) / 7
    );

    res.json({ success: true, updatedScores: updated, calculatedCEFR: cefr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 5. Server-Authoritative Economy & XP Validation ──
app.post("/api/player/reward-xp", (req: Request, res: Response) => {
  try {
    const { currentXp, currentLevel, deltaXp, deltaCoins, reason } = req.body;
    const cleanDeltaXp = Math.min(1000, Math.max(0, Number(deltaXp) || 0));
    const cleanDeltaCoins = Math.min(500, Math.max(0, Number(deltaCoins) || 0));

    let newXp = (Number(currentXp) || 0) + cleanDeltaXp;
    let newLevel = Number(currentLevel) || 1;
    let leveledUp = false;

    const xpNeeded = newLevel * 1000;
    if (newXp >= xpNeeded) {
      newXp = newXp - xpNeeded;
      newLevel += 1;
      leveledUp = true;
    }

    res.json({
      success: true,
      xp: newXp,
      level: newLevel,
      leveledUp,
      coinsAwarded: cleanDeltaCoins,
      reason: reason || "Learning activity reward",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 6. 24/7 AI English Tutor Coach (Delegated to TutorService) ──
app.post("/api/ai/tutor", rateLimiter(40, 60000), async (req: Request, res: Response) => {
  try {
    const { playerQuery, player, history } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        explanation: `In English, polite requests in shops and cafes use modal verbs like "Could I please have..." or "May I see..."`,
        arabicSummary: `في اللغة الإنجليزية، نستخدم صيغ التهذيب مثل 'Could I please have' بدلاً من صيغة الأمر المباشر.`,
        examples: [
          { english: "Could I please have a cappuccino?", translation: "هل يمكنني الحصول على كابتشينو من فضلك؟" },
          { english: "May I have the bill, please?", translation: "هل يمكنني الحصول على الحساب من فضلك؟" },
        ],
        keyRule: "Use modal verbs (could, would, may) for natural polite English.",
        suggestedPractice: "Visit Sarah's Artisan Coffee in Downtown to practice ordering drinks!",
      });
    }

    const answer = await TutorService.answerQuestion(
      ai,
      playerQuery || "",
      history || [],
      player?.level || "A2",
      player?.supportLanguage || "Arabic"
    );

    return res.json(answer);
  } catch (error: any) {
    console.error("Error in /api/ai/tutor:", error);
    res.status(500).json({
      explanation: "I'm always here to assist with your English studies! Ask me about vocabulary, grammar tenses, or job interview phrasing.",
      arabicSummary: "أنا هنا دائماً لمساعدتك في تعلم الإنجليزية! اسألني عن القواعد أو المفردات.",
      examples: [{ english: "How do I use 'in' vs 'at' for locations?", translation: "كيف أستخدم in و at للأماكن؟" }],
      keyRule: "Practice speaking every day in the city districts.",
    });
  }
});

// ── 7. Dynamic Mission Generator (Delegated to MissionGenerationService) ──
app.post("/api/ai/dynamic-mission", rateLimiter(20, 60000), async (req: Request, res: Response) => {
  try {
    const { player, weakSkills, targetDistrict } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        id: `dyn_${Date.now()}`,
        title: "Artisan Coffee Order",
        arabicTitle: "طلب قهوة مميزة في مقهى سارة",
        district: targetDistrict || "Downtown",
        locationName: "Sarah's Artisan Cafe",
        level: player?.level || "A2",
        description: "Order a custom coffee beverage and ask about milk alternatives politely.",
        objectives: [
          { id: "o1", text: "Greet Sarah warmly in English", arabicText: "قم بإلقاء التحية على سارة بالإنجليزية", completed: false },
          { id: "o2", text: "Ask if they have oat milk or almond milk", arabicText: "اسأل عن توفر حليب الشوفان أو اللوز", completed: false },
          { id: "o3", text: "Ask for the total price and thank the barista", arabicText: "اسأل عن السعر الإجمالي واشكر الباريستا", completed: false },
        ],
        targetVocabulary: ["alternative", "beverage", "receipt", "cappuccino"],
        targetGrammar: ["Polite Modals", "Questions with 'Do you have'"],
        xpReward: 250,
        coinReward: 60,
      });
    }

    const mission = await MissionGenerationService.generateDynamicQuest(
      ai,
      player?.level || "A2",
      targetDistrict || "Downtown",
      weakSkills || []
    );

    return res.json({
      id: `dyn_${Date.now()}`,
      ...mission,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/dynamic-mission:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── 8. Job Interview Simulator & Evaluator (Delegated to EvaluationService) ──
app.post("/api/ai/interview-evaluator", rateLimiter(20, 60000), async (req: Request, res: Response) => {
  try {
    const { jobRole, companyName, answersHistory, player } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        overallScore: 88,
        fluencyScore: 85,
        grammarScore: 86,
        vocabularyScore: 90,
        hired: true,
        decisionSummary: "Strong technical vocabulary, polite articulation, and clear career motivation. Hired!",
        decisionArabic: "تهانينا! أظهرت طلاقة ممتازة ومصطلحات مهنية دقيقة، وقد تم قبولك في الوظيفة.",
        strengths: ["Clear project descriptions", "Appropriate professional register", "Polite demeanor"],
        improvements: ["Elaborate further using the STAR structure for past challenges"],
        recommendedCareerLevel: "B1",
      });
    }

    const evaluation = await EvaluationService.evaluateInterview(
      ai,
      {
        title: jobRole || "Junior Software Engineer",
        companyName: companyName || "Nexus Tech Innovations",
        level: player?.level || "B1",
        targetSkills: ["System Architecture", "Team Collaboration", "Debugging"],
      },
      player?.name || "Candidate",
      answersHistory || []
    );

    return res.json(evaluation);
  } catch (error: any) {
    console.error("Error in /api/ai/interview-evaluator:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── 9. Pronunciation Analyzer (Delegated to PronunciationService) ──
app.post("/api/ai/pronounce-eval", rateLimiter(30, 60000), async (req: Request, res: Response) => {
  try {
    const { targetPhrase, spokenText, playerLevel } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        score: 92,
        accuracyScore: 94,
        fluencyScore: 90,
        phoneticBreakdown: [
          { syllable: "ca-ppu-cci-no", correctStress: true, tip: "Clear syllable cadence" },
        ],
        difficultWords: [],
        arabicTip: "نطق سليم وواضح للحروف الصامتة!",
        praise: "Great clarity and natural rhythm!",
      });
    }

    const result = await PronunciationService.evaluateSpokenText(
      ai,
      targetPhrase || "Hello, nice to meet you.",
      spokenText || "Hello, nice to meet you.",
      playerLevel || "A2"
    );

    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/ai/pronounce-eval:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Vite middleware or production static serving ──
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[English City Backend] running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type DistrictId =
  | "downtown"
  | "residential"
  | "shopping"
  | "business"
  | "transportation"
  | "university"
  | "medical"
  | "entertainment"
  | "suburbs"
  | "tourist"
  | "beach";

export type WeatherType = "sunny" | "cloudy" | "rainy" | "windy" | "foggy";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

// ── SuperMemo SM-2 Spaced Repetition Flashcard Interface ──
export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  arabicTranslation: string;
  example: string;
  level: CEFRLevel;
  mastery: number; // 0 to 5 visual stars
  // SM-2 Mathematical Parameters
  repetitions: number; // Consecutive successful reviews
  interval: number; // Interval in days until next review
  easeFactor: number; // Default 2.5, min 1.3
  lapses: number; // Total number of times forgotten
  retentionEstimate: number; // 0.0 - 1.0 (calculated forgetting curve)
  lastQuality?: number; // 0 (blackout) - 5 (perfect)
  lastReviewedAt?: string; // ISO date string
  nextReviewDate: string; // ISO date string
  timesReviewed: number;
  tags: string[];
}

export interface GrammarSkill {
  id: string;
  name: string;
  arabicName: string;
  category: "tenses" | "modals" | "prepositions" | "questions" | "conditionals" | "passives";
  level: CEFRLevel;
  masteryScore: number; // 0 to 100
  ruleSummary: string;
  examples: string[];
}

// ── Persistent 7-Dimension Learner Model ──
export interface SkillScores {
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  listening: number;
  speaking: number;
  fluency: number;
  comprehension: number;
}

export interface LearnerTelemetry {
  userId: string;
  cefrLevel: CEFRLevel;
  overallScore: number;
  skills: SkillScores;
  identifiedWeaknesses: string[];
  masteredStrengths: string[];
  totalSpeakingSeconds: number;
  totalConversationsCount: number;
  totalWordsLearned: number;
  completedMissionsCount: number;
  lastUpdated: string;
}

// ── NPC Long-Term Memory Entity ──
export interface NPCMemory {
  id: string;
  npcId: string;
  userId: string;
  memoryType: "preference" | "personal_fact" | "shared_event" | "goal" | "opinion";
  summary: string; // concise high-level fact (e.g., "Learner loves iced matcha and is an aspiring software engineer")
  importance: number; // 1 (low) to 10 (crucial milestone)
  confidence: number; // 0.0 to 1.0
  emotionalTone?: "positive" | "neutral" | "urgent" | "reflective";
  sourceConversationId?: string;
  createdAt: string;
  lastAccessedAt?: string;
}

export type NPCRelationshipTier =
  | "Stranger"
  | "Acquaintance"
  | "Regular Customer"
  | "Friend"
  | "Trusted Friend";

export interface NPCScheduleSlot {
  timeOfDay: TimeOfDay;
  hour: number; // 0-23
  locationId: string;
  roomName?: string;
  activityDescription: string;
  arabicActivity: string;
  dialogueTopic: string;
}

export interface NPCSchedule {
  npcId: string;
  slots: NPCScheduleSlot[];
}

export interface NPC {
  id: string;
  name: string;
  age: number;
  gender: "female" | "male" | "non-binary";
  occupation: string;
  districtId: DistrictId;
  locationId: string;
  locationName: string;
  avatarEmoji: string;
  avatarColor: string;
  personality: string;
  speakingStyle: string;
  accent: string;
  level: CEFRLevel;
  relationshipScore: number; // 0 - 100
  relationshipTier: NPCRelationshipTier;
  memory: string[];
  currentScheduleActivity: string;
  greetingText: string;
  defaultTopics: string[];
  voicePitch: number;
  voiceRate: number;
  voiceGender: "female" | "male";
  // Living City Expanded Properties
  interests?: string[];
  dislikes?: string[];
  goals?: string[];
  schedule?: NPCScheduleSlot[];
  homeLocationId?: string;
  workplaceLocationId?: string;
  preferredHangouts?: string[];
  currentMood?: "cheerful" | "busy" | "helpful" | "tired" | "strict" | "curious";
  vocabularyObjectives?: string[];
}

// ── Environmental English Signs & Notices ──
export type SignCategory =
  | "transit"
  | "safety"
  | "store_promo"
  | "restaurant_menu"
  | "civic_direction"
  | "hospital_notice"
  | "airport_board"
  | "campus_announcement"
  | "cultural_plaque";

export interface CitySign {
  id: string;
  text: string;
  subtext?: string;
  arabicMeaning: string;
  category: SignCategory;
  districtId: DistrictId;
  locationId?: string;
  streetName?: string;
  cefrLevel: CEFRLevel;
  pronunciationIpa: string;
  audioPronunciation?: string;
  practicalTip: string;
  arabicTip?: string;
  vocabularyWords: VocabularyWord[];
  comprehensionQuestion?: {
    question: string;
    arabicQuestion?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

// ── World Hierarchy & Modular Architecture ──
export interface RoomData {
  id: string;
  name: string;
  arabicName: string;
  floorNumber: number;
  description: string;
  themeColor?: string;
  interactiveObjects: InteractiveObject[];
  signs: CitySign[];
  npcsHere: string[]; // NPC IDs
  availableTasks: RealWorldTask[];
}

export interface FloorData {
  floorNumber: number;
  name: string;
  arabicName: string;
  rooms: RoomData[];
}

export interface BuildingData {
  id: string;
  name: string;
  arabicName: string;
  templateType:
    | "cafe"
    | "restaurant"
    | "hotel"
    | "hospital"
    | "university"
    | "office"
    | "bank"
    | "supermarket"
    | "clothing_store"
    | "electronics_store"
    | "pharmacy"
    | "police_station"
    | "airport_terminal"
    | "train_station"
    | "cinema"
    | "library"
    | "gym"
    | "barber"
    | "post_office"
    | "museum"
    | "beach_club"
    | "community_center"
    | "residential_loft"
    | "bakery"
    | "bookstore"
    | "hardware_store"
    | "pet_store"
    | "theater"
    | "school"
    | "art_gallery"
    | "coworking_space"
    | "surf_shop"
    | "car_rental";
  districtId: DistrictId;
  neighborhoodId: string;
  streetName: string;
  addressNumber: string;
  exteriorDescription: string;
  color: string;
  icon: string;
  canvasX: number;
  canvasY: number;
  minLevel: CEFRLevel;
  unlocked: boolean;
  floors: FloorData[];
  exteriorSigns: CitySign[];
}

export interface StreetData {
  id: string;
  name: string;
  arabicName: string;
  districtId: DistrictId;
  neighborhoodId: string;
  description: string;
  signs: CitySign[];
  buildings: BuildingData[];
  pedestrianTraffic: "low" | "medium" | "high";
}

export interface NeighborhoodData {
  id: string;
  name: string;
  arabicName: string;
  districtId: DistrictId;
  description: string;
  streets: StreetData[];
}

export interface DistrictData {
  id: DistrictId;
  name: string;
  arabicName: string;
  tagline: string;
  description: string;
  color: string;
  iconName: string;
  minLevel: CEFRLevel;
  atmosphere: string;
  neighborhoods: NeighborhoodData[];
  transitPoints: TransitStation[];
}

// ── Dynamic City Events ──
export type EventSeverity = "casual" | "medium" | "urgent";

export interface CityEvent {
  id: string;
  title: string;
  arabicTitle: string;
  category:
    | "lost_item"
    | "tourist_direction"
    | "transit_delay"
    | "restaurant_rush"
    | "weather_disruption"
    | "store_sale"
    | "street_busker"
    | "police_checkpoint"
    | "medical_triage"
    | "medical_inquiry"
    | "business_challenge"
    | "academic_debate"
    | "community_event"
    | "safety_alert"
    | "hospitality_negotiation"
    | "job_fair"
    | "university_debate";
  districtId: DistrictId;
  locationId?: string;
  streetName?: string;
  severity: EventSeverity;
  activeTimeOfDay?: TimeOfDay[];
  description: string;
  arabicDescription: string;
  cefrLevel: CEFRLevel;
  npcInvolvedId?: string;
  situationPrompt: string; // The dialogue or problem presented in English
  sampleAnswers: { level: CEFRLevel; text: string; explanation: string }[];
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
  activeUntil?: string;
}

// ── Real-World Task Engine ──
export interface RealWorldTask {
  id: string;
  title: string;
  arabicTitle: string;
  locationCategory: string;
  roomName: string;
  cefrLevel: CEFRLevel;
  scenarioContext: string;
  objectiveText: string;
  arabicObjective?: string;
  targetVocab: string[];
  targetGrammar: string[];
  starterPhrase: string;
  sampleExchanges: { prompt: string; expectedReply: string }[];
  rewardXp: number;
  rewardCoins: number;
}

// ── Public Transportation Network ──
export interface TransitStation {
  id: string;
  name: string;
  arabicName: string;
  type: "subway" | "taxi_stand" | "bus_stop" | "airport_gate";
  districtId: DistrictId;
  lines: string[];
  signs: CitySign[];
}

export interface CityLocation {
  id: string;
  name: string;
  districtId: DistrictId;
  category:
    | "cafe"
    | "restaurant"
    | "hotel"
    | "airport"
    | "airport_terminal"
    | "car_rental"
    | "hospital"
    | "pharmacy"
    | "store"
    | "supermarket"
    | "clothing_store"
    | "electronics_store"
    | "hardware_store"
    | "pet_store"
    | "bakery"
    | "bookstore"
    | "office"
    | "coworking_space"
    | "subway"
    | "train_station"
    | "taxi"
    | "university"
    | "library"
    | "school"
    | "gym"
    | "cinema"
    | "theater"
    | "museum"
    | "art_gallery"
    | "home"
    | "residential_loft"
    | "beach"
    | "beach_club"
    | "surf_shop"
    | "police_station"
    | "community_center"
    | "barber"
    | "park"
    | string;
  description: string;
  icon: string;
  color: string;
  x: number; // map coordinates (0-1000)
  y: number;
  canvasX: number; // 2D viewport coordinates
  canvasY: number;
  npcs: string[]; // NPC IDs
  interactiveObjects: InteractiveObject[];
  unlocked: boolean;
  minLevel: CEFRLevel;
  interiorTheme: string;
}

export interface InteractiveObject {
  id: string;
  name: string;
  actionText: string;
  icon: string;
  type: "menu" | "atm" | "schedule" | "board" | "computer" | "kiosk" | "book" | "door" | "seat";
  dialogueTrigger?: string;
  vocabularyTags: string[];
}

export interface MissionObjective {
  id: string;
  text: string;
  arabicText?: string;
  completed: boolean;
  targetNpcId?: string;
  targetLocationId?: string;
}

export interface Mission {
  id: string;
  title: string;
  arabicTitle?: string;
  category: "story" | "district" | "daily" | "dynamic" | "career";
  districtId: DistrictId;
  locationId: string;
  npcId?: string;
  level: CEFRLevel;
  description: string;
  objectives: MissionObjective[];
  targetVocabulary: string[];
  targetGrammar: string[];
  xpReward: number;
  coinReward: number;
  unlockedItemReward?: string;
  status: "available" | "active" | "completed";
  progressPercent: number;
}

export interface Career {
  id: string;
  title: string;
  companyName: string;
  districtId: DistrictId;
  level: CEFRLevel;
  description: string;
  salaryPerShift: number; // in English coins
  unlocked: boolean;
  interviewCompleted: boolean;
  interviewQuestions: string[];
  targetSkills: string[];
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: "top" | "bottom" | "hat" | "shoes" | "accessory" | "bag";
  color: string;
  price: number;
  icon: string;
  equipped: boolean;
  purchased: boolean;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: "desk" | "bed" | "sofa" | "board" | "plant" | "lamp" | "bookshelf";
  price: number;
  icon: string;
  placed: boolean;
  purchased: boolean;
  description: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
  xpReward: number;
  coinReward: number;
}

export interface PlayerProfile {
  id: string;
  userId?: string; // Firebase Auth UID
  email?: string;
  name: string;
  avatarSeed: string;
  avatarStyle: "explorer" | "scholar" | "casual" | "business" | "urban";
  avatarColor: string;
  gender: "female" | "male" | "custom";
  level: CEFRLevel;
  overallScore: number;
  xp: number;
  coins: number;
  streakDays: number;
  lastActiveDate: string;
  supportLanguage: "Arabic" | "French" | "Spanish" | "German" | "Japanese";
  currentDistrictId: DistrictId;
  currentLocationId: string;
  activeMissionId?: string;
  completedMissionIds: string[];
  skillScores: SkillScores;
  totalSpeakingSeconds: number;
  totalConversations: number;
  wordsLearnedCount: number;
  reputation: number;
  wardrobe: WardrobeItem[];
  furniture: FurnitureItem[];
  currentCareer?: string;
  achievements: Achievement[];
  dailyGoals: DailyGoal[];
}

export interface Achievement {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  category: "speaking" | "missions" | "vocabulary" | "city" | "streak";
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  explanation: string;
  arabicExplanation?: string;
}

export interface DialogueMessage {
  id: string;
  speaker: "player" | "npc" | "system";
  speakerName: string;
  text: string;
  timestamp: string;
  audioGenerated?: boolean;
  corrections?: CorrectionItem[];
  vocabulary?: VocabularyWord[];
}

export interface ConversationSession {
  id: string;
  npcId: string;
  userId: string;
  startedAt: string;
  lastMessageAt: string;
  messages: DialogueMessage[];
  memoriesExtracted: boolean;
}

export interface PronunciationEvaluation {
  score: number;
  accuracyScore: number;
  fluencyScore: number;
  phoneticBreakdown: { syllable: string; correctStress: boolean; tip: string }[];
  difficultWords: string[];
  arabicTip: string;
  praise: string;
}

// ── Voice & Audio Service Abstraction Interfaces ──
export type VoiceEngineType = "browser" | "cloud_neural";

export interface SpeechRecognitionService {
  isSupported: () => boolean;
  startListening: (onResult: (transcript: string, isFinal: boolean) => void, onError: (err: string) => void) => void;
  stopListening: () => void;
}

export interface TextToSpeechService {
  speak: (text: string, options: { pitch?: number; rate?: number; gender?: "female" | "male"; onEnd?: () => void }) => void;
  stop: () => void;
  isSpeaking: () => boolean;
}

// ── Auth User Session ──
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

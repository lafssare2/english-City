import { DistrictId, TransitStation, CEFRLevel } from "../../types";

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  stationIds: string[];
}

export const TRANSIT_LINES: TransitLine[] = [
  {
    id: "metro_blue",
    name: "Blue Metro Line (Express)",
    color: "#3b82f6",
    stationIds: ["st_airport", "st_downtown", "st_tech", "st_university"],
  },
  {
    id: "metro_red",
    name: "Red Promenade Line",
    color: "#ef4444",
    stationIds: ["st_shopping", "st_downtown", "st_medical", "st_entertainment"],
  },
  {
    id: "metro_green",
    name: "Green Coast & Heritage Line",
    color: "#10b981",
    stationIds: ["st_suburbs", "st_residential", "st_tourist", "st_beach"],
  },
];

export class TransitEngine {
  /**
   * Generates a conversational dialogue challenge before boarding public transit
   */
  public static getTransitDialoguePrompt(
    fromDistrict: DistrictId,
    toDistrict: DistrictId,
    mode: "subway" | "taxi" | "bus"
  ): {
    prompt: string;
    expectedPhrases: string[];
    arabicHelp: string;
  } {
    if (mode === "taxi") {
      return {
        prompt: `Taxi Driver: "Where to, friend?"`,
        expectedPhrases: [
          `Could you please take me to ${toDistrict}?`,
          `I need to go to ${toDistrict}, please.`,
          `How much will it cost to get to ${toDistrict}?`,
        ],
        arabicHelp: `أخبر السائق بالوجهة التي تريد الذهاب إليها بأسلوب مهذب.`,
      };
    } else if (mode === "bus") {
      return {
        prompt: `Bus Driver: "Fares please. Which stop are you getting off at?"`,
        expectedPhrases: [
          `One ticket to ${toDistrict}, please.`,
          `Does this bus stop near ${toDistrict}?`,
          `How many stops until ${toDistrict}?`,
        ],
        arabicHelp: `اطلب تذكرة واذكر المحطة المطلوبة بالإنجليزية.`,
      };
    } else {
      return {
        prompt: `Station Attendant: "Subway Information Desk. Which line or platform are you looking for?"`,
        expectedPhrases: [
          `Excuse me, which platform goes towards ${toDistrict}?`,
          `Could you tell me if this train stops at ${toDistrict}?`,
          `I would like to purchase a single pass to ${toDistrict}.`,
        ],
        arabicHelp: `اسأل موظف المحطة عن الرصيف الصحيح أو اتجاه القطار.`,
      };
    }
  }
}

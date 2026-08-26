import { NPC, TimeOfDay, NPCScheduleSlot, DistrictId } from "../../types";

export class NPCScheduleEngine {
  /**
   * Resolves an NPC's current simulated location, room, and activity for the given time of day.
   */
  public static getNPCStateAtTime(
    npc: NPC,
    timeOfDay: TimeOfDay,
    approxHour?: number
  ): {
    locationId: string;
    roomName?: string;
    activityDescription: string;
    arabicActivity: string;
    dialogueTopic: string;
    currentMood: "cheerful" | "busy" | "helpful" | "tired" | "strict" | "curious";
  } {
    // If explicit schedule exists on NPC, match slot
    if (npc.schedule && npc.schedule.length > 0) {
      const match = npc.schedule.find((s) => s.timeOfDay === timeOfDay);
      if (match) {
        return {
          locationId: match.locationId,
          roomName: match.roomName,
          activityDescription: match.activityDescription,
          arabicActivity: match.arabicActivity,
          dialogueTopic: match.dialogueTopic,
          currentMood: npc.currentMood || "helpful",
        };
      }
    }

    // Default time-of-day heuristic based on occupation
    switch (timeOfDay) {
      case "morning":
        return {
          locationId: npc.workplaceLocationId || npc.locationId,
          roomName: "Main Entrance",
          activityDescription: `Starting the morning shift as ${npc.occupation}`,
          arabicActivity: `بدء وردية الصباح كـ ${npc.occupation}`,
          dialogueTopic: "Morning greetings, orders & preparations",
          currentMood: "cheerful",
        };
      case "afternoon":
        return {
          locationId: npc.workplaceLocationId || npc.locationId,
          roomName: "Service Desk",
          activityDescription: `Handling busy afternoon consultations and customer requests`,
          arabicActivity: `التعامل مع الاستشارات وطلبات الزوار بعد الظهر`,
          dialogueTopic: "Specialized service inquiries & recommendations",
          currentMood: "busy",
        };
      case "evening":
        return {
          locationId: npc.preferredHangouts?.[0] || npc.locationId,
          roomName: "Lounge Area",
          activityDescription: `Unwinding after work and chatting with fellow citizens`,
          arabicActivity: `الاسترخاء بعد العمل والتحدث مع أهل المدينة`,
          dialogueTopic: "Daily experiences, city life & hobbies",
          currentMood: "curious",
        };
      case "night":
        return {
          locationId: npc.homeLocationId || npc.locationId,
          roomName: "Apartment Suite",
          activityDescription: `Resting at home and reviewing tomorrow's schedule`,
          arabicActivity: `الاستراحة في المنزل والاستعداد للغد`,
          dialogueTopic: "Reflections on the day and future goals",
          currentMood: "tired",
        };
    }
  }

  /**
   * Filters NPCs currently present at a given location and time of day.
   */
  public static getNPCsAtLocation(
    allNpcs: NPC[],
    locationId: string,
    timeOfDay: TimeOfDay
  ): (NPC & { currentSimulatedActivity: string; currentSimulatedRoom?: string })[] {
    return allNpcs
      .map((npc) => {
        const state = this.getNPCStateAtTime(npc, timeOfDay);
        return {
          ...npc,
          currentLocationId: state.locationId,
          currentScheduleActivity: state.activityDescription,
          currentSimulatedActivity: state.activityDescription,
          currentSimulatedRoom: state.roomName,
          currentMood: state.currentMood,
        };
      })
      .filter((npc) => npc.currentLocationId === locationId);
  }

  /**
   * Filters NPCs roaming the streets in a given district during a specific time of day.
   */
  public static getRoamingNPCsForDistrict(
    allNpcs: NPC[],
    districtId: DistrictId,
    timeOfDay: TimeOfDay
  ): NPC[] {
    return allNpcs.filter(
      (npc) =>
        npc.districtId === districtId &&
        (timeOfDay === "evening" || timeOfDay === "morning") &&
        (npc.occupation.includes("Student") ||
          npc.occupation.includes("Tourist") ||
          npc.occupation.includes("Journalist") ||
          npc.occupation.includes("Officer"))
    );
  }
}

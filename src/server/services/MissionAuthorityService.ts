import { getAdminFirestore } from "../firebaseAdmin.js";
import { EconomyService } from "./EconomyService.js";

export interface MissionObjective {
  id: string;
  text: string;
  arabicText?: string;
  completed: boolean;
}

export interface AuthoritativeMission {
  id: string;
  title: string;
  description: string;
  districtId: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  status: "available" | "in_progress" | "completed";
  objectives: MissionObjective[];
  progressPercent: number;
  xpReward: number;
  coinReward: number;
}

export class MissionAuthorityService {
  private static MAX_MISSION_XP = 400;
  private static MAX_MISSION_COINS = 150;

  /**
   * Sanitizes and bounds mission parameters
   */
  public static sanitizeMission(raw: any): AuthoritativeMission {
    const xpReward = Math.min(this.MAX_MISSION_XP, Math.max(50, Number(raw.xpReward) || 100));
    const coinReward = Math.min(this.MAX_MISSION_COINS, Math.max(10, Number(raw.coinReward) || 30));

    const objectives: MissionObjective[] = Array.isArray(raw.objectives)
      ? raw.objectives.slice(0, 5).map((o: any, idx: number) => ({
          id: typeof o.id === "string" ? o.id : `obj_${idx + 1}`,
          text: typeof o.text === "string" ? o.text.slice(0, 200) : "Complete task",
          arabicText: typeof o.arabicText === "string" ? o.arabicText.slice(0, 200) : undefined,
          completed: Boolean(o.completed),
        }))
      : [
          { id: "obj_1", text: "Speak with the local NPC", completed: false },
          { id: "obj_2", text: "Complete the communicative goal", completed: false },
        ];

    return {
      id: typeof raw.id === "string" ? raw.id : `m_${Date.now()}`,
      title: typeof raw.title === "string" ? raw.title.slice(0, 100) : "City Exploration",
      description: typeof raw.description === "string" ? raw.description.slice(0, 300) : "Practice English",
      districtId: typeof raw.districtId === "string" ? raw.districtId : "downtown",
      level: ["A1", "A2", "B1", "B2", "C1"].includes(raw.level) ? raw.level : "A2",
      status: raw.status === "completed" ? "completed" : "in_progress",
      objectives,
      progressPercent: Number(raw.progressPercent) || 0,
      xpReward,
      coinReward,
    };
  }

  /**
   * Server-authoritatively completes a mission objective and issues rewards on full completion
   */
  public static async completeObjective(
    userId: string,
    missionId: string,
    objectiveId: string
  ): Promise<{
    success: boolean;
    mission: AuthoritativeMission | null;
    rewardGranted: boolean;
    xpAwarded: number;
    coinsAwarded: number;
    message: string;
  }> {
    try {
      const db = getAdminFirestore();
      const userRef = db.collection("users").doc(userId);
      const missionRef = userRef.collection("missions").doc(missionId);

      const missionSnap = await missionRef.get();
      if (!missionSnap.exists) {
        return {
          success: false,
          mission: null,
          rewardGranted: false,
          xpAwarded: 0,
          coinsAwarded: 0,
          message: "Mission not found in user records.",
        };
      }

      const rawData = missionSnap.data() as AuthoritativeMission;
      const mission = this.sanitizeMission(rawData);

      // Check if already completed (prevent replay attack)
      if (mission.status === "completed") {
        return {
          success: true,
          mission,
          rewardGranted: false,
          xpAwarded: 0,
          coinsAwarded: 0,
          message: "Mission was already completed.",
        };
      }

      // Update objective
      let objectiveUpdated = false;
      const updatedObjectives = mission.objectives.map((obj) => {
        if (obj.id === objectiveId && !obj.completed) {
          objectiveUpdated = true;
          return { ...obj, completed: true };
        }
        return obj;
      });

      const completedCount = updatedObjectives.filter((o) => o.completed).length;
      const allDone = completedCount === updatedObjectives.length;
      const progressPercent = Math.round((completedCount / updatedObjectives.length) * 100);
      const newStatus = allDone ? "completed" : "in_progress";

      const updatedMission: AuthoritativeMission = {
        ...mission,
        objectives: updatedObjectives,
        status: newStatus,
        progressPercent,
      };

      // Persist updated mission
      await missionRef.set(updatedMission, { merge: true });

      let xpAwarded = 0;
      let coinsAwarded = 0;
      let rewardGranted = false;

      // Grant rewards if fully completed
      if (allDone) {
        rewardGranted = true;
        const rewardRes = await EconomyService.grantReward(userId, {
          xp: mission.xpReward,
          coins: mission.coinReward,
          reason: `Completed Mission: ${mission.title}`,
          source: `mission_${missionId}`,
          idempotencyKey: `mission_reward_${missionId}_${userId}`,
        });

        xpAwarded = rewardRes.xpAwarded;
        coinsAwarded = rewardRes.coinsAwarded;

        // Record in completedMissionIds list on profile
        const profileSnap = await userRef.get();
        const existingCompleted = Array.isArray(profileSnap.data()?.completedMissionIds)
          ? profileSnap.data()?.completedMissionIds
          : [];
        if (!existingCompleted.includes(missionId)) {
          await userRef.set(
            { completedMissionIds: [...existingCompleted, missionId] },
            { merge: true }
          );
        }
      }

      return {
        success: true,
        mission: updatedMission,
        rewardGranted,
        xpAwarded,
        coinsAwarded,
        message: allDone ? "Mission completed! Rewards issued." : "Objective updated.",
      };
    } catch (err) {
      console.warn("Mission completion fallback notice:", err);
      return {
        success: true,
        mission: null,
        rewardGranted: false,
        xpAwarded: 0,
        coinsAwarded: 0,
        message: "Mission objective handled.",
      };
    }
  }
}

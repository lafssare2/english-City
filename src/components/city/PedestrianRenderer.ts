import { NPC, PlayerProfile, TimeOfDay } from "../../types";
import { getDirectionalShadow } from "./BuildingArchetypeRenderer";

export interface SimulatedPedestrian {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  speed: number;
  type?: "citizen" | "student" | "doctor" | "police" | "dog_walker";
  thought?: string;
  thoughtTimer?: number;
}

/**
 * High-fidelity pedestrian and NPC character renderer for English City.
 * Focuses on in-world visual immersion:
 * - Natural animated walk cycles and directional strides
 * - Directional ground cast shadows based on time of day
 * - Eliminates artificial HUD boxes from wandering crowd
 * - Subtle contextual [E] TALK cue only on close player proximity
 * - Profession-specific attire and accessories
 */
export class PedestrianRenderer {
  /**
   * Renders the player character with high fidelity and smooth movement interpolation
   */
  public static drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    isMoving: boolean,
    animTime: number,
    playerProfile?: PlayerProfile | null,
    timeOfDay: TimeOfDay = "afternoon"
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. Directional Ground Cast Shadow
    const shadow = getDirectionalShadow(timeOfDay);
    ctx.fillStyle = shadow.color;
    ctx.beginPath();
    ctx.ellipse(shadow.dx * 6, 4 + shadow.dy * 4, 9, 4, shadow.dx * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animated Walk Stride
    const stride = isMoving ? Math.sin(animTime * 0.012) * 5 : 0;

    // Legs / Trousers
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-4, 0 + stride, 3.5, 9);
    ctx.fillRect(1, 0 - stride, 3.5, 9);

    // Shoes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-5, 8 + stride, 4.5, 3);
    ctx.fillRect(1, 8 - stride, 4.5, 3);

    // Torso / Jacket (Player's custom color or royal blue)
    ctx.fillStyle = playerProfile?.avatarColor || "#2563eb";
    ctx.beginPath();
    ctx.roundRect(-6, -13, 12, 13, 2.5);
    ctx.fill();

    // Head / Face
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(0, -17, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair Cap
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(0, -19, 5, Math.PI, 0);
    ctx.fill();

    // Directional Vision Cone / Flashlight at night
    if (timeOfDay === "night" || timeOfDay === "evening") {
      ctx.rotate(angle);
      const lightGrad = ctx.createRadialGradient(0, 0, 4, 36, 0, 40);
      lightGrad.addColorStop(0, "rgba(254, 240, 138, 0.4)");
      lightGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(36, -16);
      ctx.lineTo(36, 16);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Subtle unobtrusive player indicator
    ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOU", x, y - 28);
  }

  /**
   * Renders an NPC with profession attire and unobtrusive contextual interaction prompt
   */
  public static drawNPC(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    x: number,
    y: number,
    animTime: number,
    isNearPlayer: boolean,
    timeOfDay: TimeOfDay = "afternoon"
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. Directional Ground Cast Shadow
    const shadow = getDirectionalShadow(timeOfDay);
    ctx.fillStyle = shadow.color;
    ctx.beginPath();
    ctx.ellipse(shadow.dx * 6, 4 + shadow.dy * 4, 9, 4, shadow.dx * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 2. NPC Body & Outfit
    const bob = Math.sin(animTime * 0.003 + x) * 1.5;

    // Legs
    ctx.fillStyle = "#334155";
    ctx.fillRect(-4, 0, 3.5, 8);
    ctx.fillRect(1, 0, 3.5, 8);

    // Shoes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-5, 7, 4.5, 3);
    ctx.fillRect(1, 7, 4.5, 3);

    // Outfit based on NPC role / color
    ctx.fillStyle = npc.avatarColor || "#0284c7";
    ctx.beginPath();
    ctx.roundRect(-6, -13 + bob, 12, 13, 2.5);
    ctx.fill();

    // Profession Accessories
    const role = (npc.occupation || "").toLowerCase();
    if (role.includes("doctor") || role.includes("nurse")) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-5, -13 + bob, 10, 13);
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1;
      ctx.strokeRect(-5, -13 + bob, 10, 13);
    } else if (role.includes("police") || role.includes("officer")) {
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(-6, -22 + bob, 12, 4);
    } else if (role.includes("barista") || role.includes("waiter") || role.includes("chef")) {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-4, -7 + bob, 8, 7);
    }

    // Head
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(0, -17 + bob, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(0, -19 + bob, 5, Math.PI, 0);
    ctx.fill();

    ctx.restore();

    // 3. Clean Proximity Cue: Only shown when player approaches close to this NPC
    if (isNearPlayer) {
      // Subtle interactive prompt
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.roundRect(x - 24, y - 36, 48, 14, 3);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 7.5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("[E] TALK", x, y - 29);
    }
  }

  /**
   * Draws wandering pedestrian or dog walker without heavy UI badges
   */
  public static drawPedestrian(
    ctx: CanvasRenderingContext2D,
    ped: SimulatedPedestrian,
    animTime: number,
    timeOfDay: TimeOfDay = "afternoon"
  ): void {
    ctx.save();
    ctx.translate(ped.x, ped.y);

    // Stride
    const stride = Math.sin(animTime * 0.01 + ped.x) * 4;

    // Directional Shadow
    const shadow = getDirectionalShadow(timeOfDay);
    ctx.fillStyle = shadow.color;
    ctx.beginPath();
    ctx.ellipse(shadow.dx * 5, 4 + shadow.dy * 3, 7, 3.5, shadow.dx * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-3.5, 0 + stride, 3, 7);
    ctx.fillRect(0.5, 0 - stride, 3, 7);

    // Torso
    ctx.fillStyle = ped.color || "#0ea5e9";
    ctx.beginPath();
    ctx.roundRect(-4.5, -10, 9, 10, 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(0, -14, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (ped.type === "dog_walker") {
      // Leash line to dog
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, -6);
      ctx.lineTo(14, 2);
      ctx.stroke();

      // Dog
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.roundRect(12, -2, 9, 5, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(21, -1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Natural thought bubble if active
    if (ped.thought) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.roundRect(ped.x - 26, ped.y - 30, 52, 13, 3);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 6.5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ped.thought, ped.x, ped.y - 23.5);
    }
  }
}

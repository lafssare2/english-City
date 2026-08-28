import { TimeOfDay } from "../../types";
import { getDirectionalShadow } from "./BuildingArchetypeRenderer";

export interface SimulatedVehicle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "car" | "bus" | "taxi" | "ambulance" | "delivery_van" | "police" | "fire_engine" | "bicycle";
  color: string;
  angle: number; // in radians
  speed: number;
  width: number;
  height: number;
  isParked?: boolean;
}

/**
 * High-fidelity 2.5D GTA-style vehicle renderer for English City.
 * Renders authentic metropolitan vehicles:
 * - 2.5D perspective chassis with roofline and side panel depth
 * - Glass windshields with horizon glare reflections
 * - Directional ground cast shadows and contact ambient occlusion
 * - Volumetric forward headlight cones on asphalt at dusk and night
 * - Glowing taillights, brake lights, and emergency beacons
 */
export class VehicleRenderer {
  public static drawVehicle(
    ctx: CanvasRenderingContext2D,
    v: SimulatedVehicle,
    animTime: number,
    timeOfDay: TimeOfDay
  ): void {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    const isNight = timeOfDay === "night";
    const isDusk = timeOfDay === "evening";
    const halfW = v.width / 2;
    const halfH = v.height / 2;

    // 1. Directional Ground Cast Shadow
    const shadow = getDirectionalShadow(timeOfDay);
    ctx.fillStyle = shadow.color;
    ctx.beginPath();
    ctx.roundRect(-halfW + shadow.dx * 8, -halfH + 3 + shadow.dy * 5, v.width, v.height, 4);
    ctx.fill();

    // 2. Volumetric Headlight Beams at Night/Dusk (if not parked)
    if (!v.isParked && (isNight || isDusk)) {
      const beamGrad = ctx.createRadialGradient(halfW, 0, 4, halfW + 80, 0, 70);
      beamGrad.addColorStop(0, "rgba(254, 240, 138, 0.65)");
      beamGrad.addColorStop(0.5, "rgba(254, 240, 138, 0.22)");
      beamGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(halfW, -halfH + 3);
      ctx.lineTo(halfW + 85, -halfH - 26);
      ctx.lineTo(halfW + 85, halfH + 26);
      ctx.lineTo(halfW, halfH - 3);
      ctx.closePath();
      ctx.fill();
    }

    if (v.type === "bicycle") {
      this.drawBicycle(ctx, animTime, isNight);
      ctx.restore();
      return;
    }

    // 3. Wheels / Tires with Alloy Rims
    ctx.fillStyle = "#0f172a";
    // Wheels
    ctx.fillRect(halfW - 9, -halfH - 2, 7, 3);
    ctx.fillRect(halfW - 9, halfH - 1, 7, 3);
    ctx.fillRect(-halfW + 2, -halfH - 2, 7, 3);
    ctx.fillRect(-halfW + 2, halfH - 1, 7, 3);

    // Alloy Hubcaps
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(halfW - 7, -halfH - 1, 3, 1);
    ctx.fillRect(halfW - 7, halfH, 3, 1);
    ctx.fillRect(-halfW + 4, -halfH - 1, 3, 1);
    ctx.fillRect(-halfW + 4, halfH, 3, 1);

    // 4. Chassis Base & Lower Bodywork
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, v.width, v.height, 4);
    ctx.fill();

    // 2.5D Roofline (Slightly raised & lighter tone for top panel)
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, -halfH + 2, v.width - 12, v.height - 4, 3);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-halfW, -halfH, v.width, v.height);

    // 5. Windshields & Horizon Glare
    // Front Windshield
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(halfW * 0.18, -halfH + 2, halfW * 0.38, v.height - 4);

    // Glare line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW * 0.22, -halfH + 3);
    ctx.lineTo(halfW * 0.45, halfH - 3);
    ctx.stroke();

    // Rear Windshield
    ctx.fillStyle = "#0369a1";
    ctx.fillRect(-halfW * 0.6, -halfH + 2, halfW * 0.28, v.height - 4);

    // Side Windows
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(-halfW * 0.25, -halfH + 1, halfW * 0.4, 2);
    ctx.fillRect(-halfW * 0.25, halfH - 3, halfW * 0.4, 2);

    // 6. Front Headlights & Taillights
    ctx.fillStyle = isNight ? "#fef08a" : "#ffffff";
    ctx.fillRect(halfW - 2, -halfH + 2, 2, 4);
    ctx.fillRect(halfW - 2, halfH - 6, 2, 4);

    // Rear Taillights
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-halfW, -halfH + 2, 2, 4);
    ctx.fillRect(-halfW, halfH - 6, 2, 4);

    // 7. Type-Specific Fixtures
    if (v.type === "taxi") {
      // Yellow Taxi Roof Pod
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-4, -6, 8, 12);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAXI", 0, 0);

      // Flank Checker Stripes
      for (let s = -halfW + 4; s < halfW - 4; s += 6) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(s, -halfH + 1, 3, 2);
        ctx.fillRect(s, halfH - 3, 3, 2);
      }
    } else if (v.type === "bus") {
      // Bus Destination Display
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(halfW * 0.35, -halfH + 1, 6, v.height - 2);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("101", halfW * 0.45, 0);
    } else if (v.type === "ambulance") {
      const flash = Math.sin(animTime * 0.02) > 0;
      ctx.fillStyle = flash ? "#ef4444" : "#3b82f6";
      ctx.fillRect(-4, -halfH + 2, 8, 4);
      ctx.fillStyle = flash ? "#3b82f6" : "#ef4444";
      ctx.fillRect(-4, halfH - 6, 8, 4);

      // Red Cross on Roof
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-2, -5, 4, 10);
      ctx.fillRect(-5, -2, 10, 4);
    } else if (v.type === "police") {
      const flash = Math.sin(animTime * 0.025) > 0;
      ctx.fillStyle = flash ? "#3b82f6" : "#ef4444";
      ctx.fillRect(-3, -halfH + 2, 6, 4);
      ctx.fillStyle = flash ? "#ef4444" : "#3b82f6";
      ctx.fillRect(-3, halfH - 6, 6, 4);
    }

    ctx.restore();
  }

  private static drawBicycle(
    ctx: CanvasRenderingContext2D,
    animTime: number,
    isNight: boolean
  ): void {
    // Wheels
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(8, 0, 4, 0, Math.PI * 2);
    ctx.arc(-8, 0, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Frame
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();

    // Cyclist Head & Torso
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front Light
    if (isNight) {
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(10, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import { DistrictId } from "../../types";
import { EnvironmentalLearningObject } from "../../content/vocabulary/environmentalVocabulary";

/**
 * High-fidelity street prop, nature, lighting, traffic signal, and environmental sign renderer.
 */
export class StreetPropRenderer {
  /**
   * Renders realistic street lamps with atmospheric night lighting glows
   */
  public static drawStreetLamp(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isNight: boolean,
    isDusk: boolean
  ): void {
    ctx.save();

    // 1. Cast-Iron Base & Pole
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - 3, y - 36, 6, 36);

    // Lamp Cap & Glass Lantern
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 36);
    ctx.lineTo(x + 8, y - 36);
    ctx.lineTo(x + 5, y - 48);
    ctx.lineTo(x - 5, y - 48);
    ctx.closePath();
    ctx.fill();

    // Bulb Glow
    if (isNight || isDusk) {
      // Warm Amber Lantern Light
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(x, y - 42, 5, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Radial Light Pool on the ground
      const lampGrad = ctx.createRadialGradient(x, y, 5, x, y, 70);
      lampGrad.addColorStop(0, "rgba(254, 240, 138, 0.35)");
      lampGrad.addColorStop(0.6, "rgba(254, 240, 138, 0.12)");
      lampGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(x, y - 42, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Renders organic multi-layered trees with foliage sway and soft ground shadows
   */
  public static drawTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    districtId: DistrictId,
    animTime: number
  ): void {
    ctx.save();

    // Tree Ground Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 2, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (districtId === "beach") {
      // Coastal Palm Tree
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 8, y - 25, x, y - 50);
      ctx.stroke();

      const sway = Math.sin(animTime * 0.002 + x) * 4;
      ctx.fillStyle = "#15803d";
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 + (sway * Math.PI) / 180;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(angle) * 18, y - 50 + Math.sin(angle) * 12, 18, 6, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (districtId === "suburbs" || districtId === "residential") {
      // English Cherry Blossom / Birch Tree
      ctx.fillStyle = "#451a03";
      ctx.fillRect(x - 4, y - 26, 8, 26);

      const swayX = Math.sin(animTime * 0.002 + x) * 2;
      const swayY = Math.cos(animTime * 0.002 + y) * 1.5;

      ctx.fillStyle = districtId === "suburbs" ? "#f472b6" : "#15803d";
      ctx.beginPath();
      ctx.arc(x + swayX, y - 36 + swayY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = districtId === "suburbs" ? "#fbcfe8" : "#22c55e";
      ctx.beginPath();
      ctx.arc(x - 6 + swayX, y - 42 + swayY, 16, 0, Math.PI * 2);
      ctx.arc(x + 6 + swayX, y - 42 + swayY, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Lush Deciduous Oak / English Birch
      ctx.fillStyle = "#451a03";
      ctx.fillRect(x - 4, y - 26, 8, 26);

      const swayX = Math.sin(animTime * 0.002 + x) * 2;
      const swayY = Math.cos(animTime * 0.002 + y) * 1.5;

      ctx.fillStyle = "#14532d";
      ctx.beginPath();
      ctx.arc(x + swayX, y - 36 + swayY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.arc(x - 8 + swayX, y - 42 + swayY, 18, 0, Math.PI * 2);
      ctx.arc(x + 8 + swayX, y - 42 + swayY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(x + swayX, y - 50 + swayY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Renders a classic wooden park bench with cast iron armrests
   */
  public static drawParkBench(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(x - 18, y + 2, 36, 6);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - 16, y - 8, 4, 10);
    ctx.fillRect(x + 12, y - 8, 4, 10);

    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - 18, y - 14, 36, 5);
    ctx.fillRect(x - 18, y - 8, 36, 5);
    ctx.restore();
  }

  /**
   * Renders a modern glass & steel bus shelter with route timetable
   */
  public static drawBusShelter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.fillRect(x - 22, y - 34, 44, 4);

    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.fillRect(x - 20, y - 30, 40, 26);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 20, y - 30, 40, 26);

    // Timetable Board
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 8, y - 24, 16, 14);
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 6px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BUS 101", x, y - 16);

    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - 14, y - 8, 28, 4);
    ctx.restore();
  }

  /**
   * Renders a British Red Post Box
   */
  public static drawPostBox(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 18, 12, 18, [5, 5, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - 4, y - 14, 8, 2);

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(x, y - 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders a red fire hydrant
   */
  public static drawFireHydrant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x - 4, y - 12, 8, 12);
    ctx.beginPath();
    ctx.arc(x, y - 12, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x - 6, y - 8, 2, 4);
    ctx.fillRect(x + 4, y - 8, 2, 4);
    ctx.restore();
  }

  /**
   * Renders a metal manhole cover in the asphalt
   */
  public static drawManhole(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crosshatch texture
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renders a storm drain grate along the road curb
   */
  public static drawStormDrain(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - 10, y - 4, 20, 8);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let gx = x - 8; gx <= x + 8; gx += 4) {
      ctx.beginPath();
      ctx.moveTo(gx, y - 4);
      ctx.lineTo(gx, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders a physical British street name plate on a post
   */
  public static drawStreetNameSign(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    streetName: string
  ): void {
    ctx.save();
    // Metal Post
    ctx.fillStyle = "#334155";
    ctx.fillRect(x - 2, y - 28, 4, 28);

    // Signboard
    const signW = Math.max(50, streetName.length * 6 + 12);
    const signH = 14;
    const signX = x - signW / 2;
    const signY = y - 36;

    ctx.fillStyle = "#0284c7"; // Blue street sign
    ctx.beginPath();
    ctx.roundRect(signX, signY, signW, signH, 3);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(streetName, signX + signW / 2, signY + signH / 2);
    ctx.restore();
  }

  /**
   * Renders physical regulatory traffic signs (STOP, NO ENTRY, ONE WAY, SPEED LIMIT 30, PEDESTRIAN CROSSING)
   */
  public static drawRoadSign(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    signType: "STOP" | "NO_ENTRY" | "ONE_WAY" | "SPEED_30" | "PED_CROSSING" | "PARKING" | "TAXI_RANK"
  ): void {
    ctx.save();
    // Post
    ctx.fillStyle = "#475569";
    ctx.fillRect(x - 2, y - 28, 4, 28);

    const signCenterY = y - 36;

    if (signType === "STOP") {
      // Red Octagon
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      const r = 10;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + Math.PI / 8;
        const sx = x + Math.cos(angle) * r;
        const sy = signCenterY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6.5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("STOP", x, signCenterY);
    } else if (signType === "NO_ENTRY") {
      // Red Circle with White Horizontal Bar
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(x, signCenterY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 6, signCenterY - 2, 12, 4);
    } else if (signType === "ONE_WAY") {
      // Blue Rectangle with White Arrow
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.roundRect(x - 12, signCenterY - 7, 24, 14, 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ONE WAY ➔", x, signCenterY);
    } else if (signType === "SPEED_30") {
      // White Circle with Red Border and "30"
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, signCenterY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("30", x, signCenterY);
    } else if (signType === "PARKING") {
      // Blue Square with "P"
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.roundRect(x - 8, signCenterY - 8, 16, 16, 3);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", x, signCenterY);
    } else if (signType === "TAXI_RANK") {
      // Yellow / Black TAXI sign
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.roundRect(x - 14, signCenterY - 7, 28, 14, 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.font = "bold 6px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAXI RANK", x, signCenterY);
    }

    ctx.restore();
  }

  /**
   * Renders outdoor cafe dining table with bistro chairs and umbrella
   */
  public static drawOutdoorCafeTable(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(x, y - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 16, y - 12, 5, 10);
    ctx.fillRect(x + 11, y - 12, 5, 10);

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(x, y - 24, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    for (let i = -18; i < 18; i += 9) {
      ctx.fillRect(x + i, y - 24, 4, 12);
    }
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x - 1, y - 24, 2, 16);

    ctx.restore();
  }

  /**
   * Renders a public park / plaza water fountain
   */
  public static drawFountain(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.fillRect(x - 4, y - 18, 8, 18);

    const sprayH = 12 + Math.sin(animTime * 0.008) * 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 18 - sprayH);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - 4, y - 14, 2, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 14, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders a physical British directional fingerpost sign in the world
   */
  public static drawFingerpost(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    leftText: string = "HOSPITAL",
    rightText: string = "LIBRARY"
  ): void {
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - 2, y - 32, 4, 32);

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(x - 28, y - 28);
    ctx.lineTo(x - 2, y - 28);
    ctx.lineTo(x - 2, y - 20);
    ctx.lineTo(x - 28, y - 20);
    ctx.lineTo(x - 34, y - 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 5.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`← ${leftText.slice(0, 7)}`, x - 16, y - 22.5);

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 18);
    ctx.lineTo(x + 28, y - 18);
    ctx.lineTo(x + 34, y - 14);
    ctx.lineTo(x + 28, y - 10);
    ctx.lineTo(x + 2, y - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 5.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${rightText.slice(0, 7)} →`, x + 18, y - 12.5);

    ctx.restore();
  }

  /**
   * Renders a floral planter box
   */
  public static drawFlowerPlanter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.roundRect(x - 14, y - 10, 28, 10, 2);
    ctx.fill();

    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(x - 8, y - 12, 5, 0, Math.PI * 2);
    ctx.arc(x, y - 13, 6, 0, Math.PI * 2);
    ctx.arc(x + 8, y - 12, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(x - 7, y - 14, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(x, y - 15, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders a coastal lifeguard observation tower
   */
  public static drawLifeguardTower(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x - 8, y - 30);
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + 8, y - 30);
    ctx.stroke();

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x - 14, y - 50, 28, 20);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 50);
    ctx.lineTo(x, y - 62);
    ctx.lineTo(x + 18, y - 50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x - 8, y - 44, 16, 8);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + 10, y - 40, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders interactive environmental vocabulary objects in the world with glowing examination beacons
   */
  public static drawEnvironmentalLearningObject(
    ctx: CanvasRenderingContext2D,
    obj: EnvironmentalLearningObject,
    animTime: number,
    isNearPlayer: boolean
  ): void {
    ctx.save();
    const x = obj.x;
    const y = obj.y;

    if (isNearPlayer) {
      const pulse = Math.sin(animTime * 0.006) * 4;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 22 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(x - 32, y - 36, 64, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("[E] EXAMINE", x, y - 28);
    }

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(x - 14, y - 14, 28, 28, 6);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(obj.signText.slice(0, 8), x, y);

    ctx.restore();
  }
}

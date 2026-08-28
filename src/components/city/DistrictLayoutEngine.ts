import { DistrictId, TimeOfDay } from "../../types";

export interface RoadSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "avenue" | "street" | "lane" | "bus_lane" | "pedestrian_paved" | "railway" | "boardwalk" | "path";
  direction?: "horizontal" | "vertical";
  hasMarkings?: boolean;
  isBusLane?: boolean;
}

export interface CrosswalkData {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
}

export interface StopLineData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoadStencilData {
  x: number;
  y: number;
  text: string;
  angle?: number;
}

export interface DistrictGeoLayout {
  roads: RoadSegment[];
  crosswalks: CrosswalkData[];
  stopLines: StopLineData[];
  stencils: RoadStencilData[];
  parkingBays?: { x: number; y: number; width: number; height: number; orientation: "horizontal" | "vertical"; label?: string }[];
}

/**
 * High-performance 2.5D urban layout and terrain engine for English City.
 * Generates rich asphalt textures, paving slab joints, curved curb transitions,
 * tactile crossing pads, manholes, drainage grates, and organic district parks.
 */
export class DistrictLayoutEngine {
  /**
   * Draws realistic ground terrain (manicured grass, cobblestone quads, sandy beaches, pedestrian plazas)
   */
  public static drawGroundTerrain(
    ctx: CanvasRenderingContext2D,
    districtId: DistrictId,
    width: number,
    height: number,
    animTime: number,
    timeOfDay: TimeOfDay
  ): void {
    ctx.save();

    // 1. Base City Foundation Sub-base (Dark slate asphalt foundation)
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    switch (districtId) {
      case "beach": {
        // Coastal Promenade, Boardwalk, and Layered Ocean
        // A. Upper Promenade Paving (Y: 0 to 240)
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, 240);

        // Sidewalk Paving Slabs (tile grid)
        ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 240);
          ctx.stroke();
        }
        for (let y = 0; y < 240; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // B. Wooden Boardwalk (Y: 240 to 330)
        ctx.fillStyle = "#78350f";
        ctx.fillRect(0, 240, width, 90);
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1.5;
        for (let y = 240; y < 330; y += 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        // Boardwalk Decking Screws & Planks
        ctx.fillStyle = "#451a03";
        for (let x = 30; x < width; x += 80) {
          ctx.fillRect(x, 240, 2, 90);
        }

        // C. Golden Sand Beach (Y: 330 to 690)
        const sandGrad = ctx.createLinearGradient(0, 330, 0, 690);
        sandGrad.addColorStop(0, "#fde68a"); // Warm dry sand
        sandGrad.addColorStop(0.65, "#fcd34d"); // Mid-tide sand
        sandGrad.addColorStop(1.0, "#d97706"); // Wet shoreline sand
        ctx.fillStyle = sandGrad;
        ctx.fillRect(0, 330, width, 360);

        // Organic Sand Dunes & Shell Scatter
        ctx.fillStyle = "rgba(217, 119, 6, 0.12)";
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();
          ctx.ellipse(90 + i * 110, 410 + (i % 3) * 45, 65, 16, 0.08, 0, Math.PI * 2);
          ctx.fill();
        }

        // D. Azure Ocean with Animated Waves (Y: 670 to 1000)
        const oceanGrad = ctx.createLinearGradient(0, 670, 0, height);
        oceanGrad.addColorStop(0, "#0284c7");
        oceanGrad.addColorStop(0.3, "#0369a1");
        oceanGrad.addColorStop(1.0, "#082f49");
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 670, width, height - 670);

        // Wave Foam 1
        const wave1 = Math.sin(animTime * 0.002) * 12;
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.beginPath();
        ctx.moveTo(0, 680 + wave1);
        for (let x = 0; x <= width; x += 25) {
          const wy = 680 + wave1 + Math.sin(x * 0.02 + animTime * 0.003) * 6;
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Wave Foam 2
        const wave2 = Math.cos(animTime * 0.0025) * 8;
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.moveTo(0, 730 + wave2);
        for (let x = 0; x <= width; x += 30) {
          const wy = 730 + wave2 + Math.cos(x * 0.015 + animTime * 0.0035) * 7;
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Pier Boardwalk Extension
        ctx.fillStyle = "#78350f";
        ctx.fillRect(680, 240, 160, 600);
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2;
        for (let py = 240; py < 840; py += 14) {
          ctx.beginPath();
          ctx.moveTo(680, py);
          ctx.lineTo(840, py);
          ctx.stroke();
        }
        // Pier Railings
        ctx.strokeStyle = "#fed7aa";
        ctx.lineWidth = 3;
        ctx.strokeRect(680, 240, 160, 600);
        break;
      }

      case "university": {
        // Oxford Quadrangle: Manicured Lawns, Collegiate Flagstone Concourse, Central Fountain
        // Quad Lawns
        ctx.fillStyle = "#14532d";
        ctx.beginPath();
        ctx.roundRect(70, 70, 370, 290, 16);
        ctx.roundRect(560, 70, 370, 290, 16);
        ctx.roundRect(70, 570, 370, 290, 16);
        ctx.roundRect(560, 570, 370, 290, 16);
        ctx.fill();

        // Mowing Stripes in Lawns
        ctx.fillStyle = "rgba(22, 101, 52, 0.45)";
        for (let y = 80; y < 350; y += 22) {
          ctx.fillRect(75, y, 360, 11);
          ctx.fillRect(565, y, 360, 11);
        }
        for (let y = 580; y < 850; y += 22) {
          ctx.fillRect(75, y, 360, 11);
          ctx.fillRect(565, y, 360, 11);
        }

        // Flower & Shrubbery Borders around Lawns
        ctx.fillStyle = "#15803d";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.strokeRect(70, 70, 370, 290);
        ctx.strokeRect(560, 70, 370, 290);
        ctx.strokeRect(70, 570, 370, 290);
        ctx.strokeRect(560, 570, 370, 290);

        // Stone Pathways (Flagstones)
        ctx.fillStyle = "#334155";
        ctx.fillRect(440, 0, 120, height);
        ctx.fillRect(0, 440, width, 120);

        // Flagstone Paving Tile Seams
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 440);
          ctx.lineTo(x, 560);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 32) {
          ctx.beginPath();
          ctx.moveTo(440, y);
          ctx.lineTo(560, y);
          ctx.stroke();
        }

        // Central Stone Monument & Grand Fountain
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(500, 500, 95, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Water basin with concentric ripples
        const fRipple = Math.sin(animTime * 0.003) * 3;
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(500, 500, 75 + fRipple, 0, Math.PI * 2);
        ctx.fill();

        // Inner Fountain Tier & Spout
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(500, 500, 24, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "residential":
      case "suburbs": {
        // Residential English Green Yards, Brick Driveways, Flower Beds
        ctx.fillStyle = "#14532d";
        ctx.fillRect(40, 50, 420, 370);
        ctx.fillRect(540, 50, 420, 370);
        ctx.fillRect(40, 580, 420, 370);
        ctx.fillRect(540, 580, 420, 370);

        // Grass Texture Pattern
        ctx.fillStyle = "rgba(22, 101, 52, 0.4)";
        for (let y = 60; y < 410; y += 20) {
          ctx.fillRect(45, y, 410, 10);
          ctx.fillRect(545, y, 410, 10);
        }
        for (let y = 590; y < 940; y += 20) {
          ctx.fillRect(45, y, 410, 10);
          ctx.fillRect(545, y, 410, 10);
        }

        // Wooden Picket Garden Fences
        ctx.strokeStyle = "rgba(248, 250, 252, 0.45)";
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 50, 420, 370);
        ctx.strokeRect(540, 50, 420, 370);
        ctx.strokeRect(40, 580, 420, 370);
        ctx.strokeRect(540, 580, 420, 370);

        // Brick Driveways leading to homes
        ctx.fillStyle = "#78350f";
        ctx.fillRect(160, 380, 60, 70);
        ctx.fillRect(660, 380, 60, 70);
        ctx.fillRect(160, 550, 60, 70);
        ctx.fillRect(660, 550, 60, 70);

        // Driveway Paver lines
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1;
        for (let dy = 380; dy < 450; dy += 8) {
          ctx.beginPath();
          ctx.moveTo(160, dy);
          ctx.lineTo(220, dy);
          ctx.moveTo(660, dy);
          ctx.lineTo(720, dy);
          ctx.stroke();
        }
        break;
      }

      case "medical": {
        // Medical Campus: Clean paving, Healing Garden, Helipad
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, height);

        // Healing Garden Lawns
        ctx.fillStyle = "#14532d";
        ctx.beginPath();
        ctx.roundRect(60, 60, 360, 240, 12);
        ctx.roundRect(580, 60, 360, 240, 12);
        ctx.fill();

        // Helipad in NW courtyard
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(240, 180, 65, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 42px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("H", 240, 180);
        break;
      }

      case "shopping": {
        // Shopping Promenade: Terracotta Herringbone Brick Pavers & Planters
        ctx.fillStyle = "#451a03";
        ctx.fillRect(30, 420, width - 60, 160);

        // Herringbone Pattern
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1.5;
        for (let x = 30; x < width - 30; x += 28) {
          ctx.beginPath();
          ctx.moveTo(x, 420);
          ctx.lineTo(x + 18, 580);
          ctx.stroke();
        }

        // Outdoor Dining Decks
        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.roundRect(90, 360, 190, 50, 8);
        ctx.roundRect(570, 360, 190, 50, 8);
        ctx.fill();
        break;
      }

      case "business": {
        // High-Tech Business Plaza: Geometric Pavers & Reflecting Pools
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(60, 60, 380, 340);
        ctx.fillRect(560, 60, 380, 340);
        ctx.fillRect(60, 600, 380, 340);
        ctx.fillRect(560, 600, 380, 340);

        // Cyan LED Inlays
        ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
        ctx.lineWidth = 2;
        ctx.strokeRect(70, 70, 360, 320);
        ctx.strokeRect(570, 70, 360, 320);
        ctx.strokeRect(70, 610, 360, 320);
        ctx.strokeRect(570, 610, 360, 320);

        // Minimalist Reflecting Pool
        ctx.fillStyle = "#083344";
        ctx.fillRect(460, 460, 80, 80);
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(460, 460, 80, 80);
        break;
      }

      case "tourist": {
        // Heritage Quarter: English Cobblestone Town Square
        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 420, width, 160);
        ctx.fillRect(420, 0, 160, height);

        // Cobblestone Texture Grid
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 16) {
          for (let y = 420; y < 580; y += 12) {
            ctx.strokeRect(x, y, 14, 10);
          }
        }
        break;
      }

      default: {
        // Downtown / Metropolitan Sidewalk Blocks
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(50, 50, 390, 350);
        ctx.fillRect(560, 50, 390, 350);
        ctx.fillRect(50, 600, 390, 350);
        ctx.fillRect(560, 600, 390, 350);

        // Sidewalk Paving Slabs
        ctx.strokeStyle = "rgba(71, 85, 105, 0.35)";
        ctx.lineWidth = 1;
        for (let x = 50; x < 440; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 50);
          ctx.lineTo(x, 400);
          ctx.moveTo(x, 600);
          ctx.lineTo(x, 950);
          ctx.stroke();
        }
        for (let x = 560; x < 950; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 50);
          ctx.lineTo(x, 400);
          ctx.moveTo(x, 600);
          ctx.lineTo(x, 950);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Retrieves the authentic road geometry, crosswalks, stop lines, and stencils for each district
   */
  public static getDistrictRoadLayout(districtId: DistrictId, width: number = 1000, height: number = 1000): DistrictGeoLayout {
    switch (districtId) {
      case "beach":
        return {
          roads: [
            { x: 0, y: 140, width, height: 100, type: "avenue", direction: "horizontal", hasMarkings: true },
            { x: 0, y: 240, width, height: 80, type: "boardwalk", direction: "horizontal" },
          ],
          crosswalks: [
            { x: 380, y: 144, width: 36, height: 92, orientation: "horizontal" },
            { x: 740, y: 144, width: 36, height: 92, orientation: "horizontal" },
          ],
          stopLines: [
            { x: 370, y: 144, width: 6, height: 44 },
            { x: 780, y: 194, width: 6, height: 44 },
          ],
          stencils: [
            { x: 260, y: 168, text: "PROMENADE ➔" },
            { x: 620, y: 216, text: "BEACH ACCESS" },
          ],
          parkingBays: [
            { x: 80, y: 106, width: 220, height: 34, orientation: "horizontal", label: "BEACH PARKING" },
          ],
        };

      case "university":
        return {
          roads: [
            { x: 0, y: 440, width, height: 120, type: "pedestrian_paved", direction: "horizontal" },
            { x: 440, y: 0, width: 120, height, type: "pedestrian_paved", direction: "vertical" },
          ],
          crosswalks: [],
          stopLines: [],
          stencils: [
            { x: 260, y: 470, text: "CAMPUS ONLY" },
            { x: 740, y: 530, text: "QUIET ZONE" },
            { x: 470, y: 260, text: "LIBRARY QUAD" },
          ],
        };

      case "shopping":
        return {
          roads: [
            { x: 0, y: 430, width, height: 140, type: "pedestrian_paved", direction: "horizontal" },
            { x: 460, y: 0, width: 80, height: 430, type: "lane", direction: "vertical" },
          ],
          crosswalks: [
            { x: 464, y: 390, width: 72, height: 32, orientation: "vertical" },
          ],
          stopLines: [
            { x: 464, y: 380, width: 72, height: 6 },
          ],
          stencils: [
            { x: 300, y: 480, text: "PEDESTRIAN ZONE" },
            { x: 700, y: 480, text: "HIGH STREET" },
            { x: 500, y: 240, text: "DELIVERIES ONLY" },
          ],
          parkingBays: [
            { x: 80, y: 386, width: 220, height: 38, orientation: "horizontal", label: "SHOPPING BAY" },
          ],
        };

      case "medical":
        return {
          roads: [
            { x: 0, y: 440, width, height: 120, type: "avenue", direction: "horizontal", hasMarkings: true },
            { x: 440, y: 0, width: 120, height, type: "avenue", direction: "vertical", hasMarkings: true },
          ],
          crosswalks: [
            { x: 400, y: 444, width: 36, height: 112, orientation: "horizontal" },
            { x: 564, y: 444, width: 36, height: 112, orientation: "horizontal" },
            { x: 444, y: 400, width: 112, height: 36, orientation: "vertical" },
            { x: 444, y: 564, width: 112, height: 36, orientation: "vertical" },
          ],
          stopLines: [
            { x: 390, y: 444, width: 6, height: 52 },
            { x: 604, y: 504, width: 6, height: 52 },
            { x: 444, y: 390, width: 52, height: 6 },
            { x: 504, y: 604, width: 52, height: 6 },
          ],
          stencils: [
            { x: 260, y: 472, text: "AMBULANCE ONLY" },
            { x: 740, y: 528, text: "EMERGENCY ➔" },
            { x: 472, y: 260, text: "HOSPITAL DROP-OFF" },
          ],
          parkingBays: [
            { x: 80, y: 390, width: 240, height: 44, orientation: "horizontal", label: "AMBULANCE BAY" },
          ],
        };

      case "suburbs":
      case "residential":
        return {
          roads: [
            { x: 0, y: 450, width, height: 100, type: "street", direction: "horizontal", hasMarkings: true },
            { x: 460, y: 0, width: 100, height, type: "street", direction: "vertical", hasMarkings: true },
          ],
          crosswalks: [
            { x: 420, y: 454, width: 32, height: 92, orientation: "horizontal" },
            { x: 564, y: 454, width: 32, height: 92, orientation: "horizontal" },
          ],
          stopLines: [
            { x: 410, y: 454, width: 6, height: 44 },
            { x: 600, y: 504, width: 6, height: 44 },
          ],
          stencils: [
            { x: 280, y: 475, text: "SLOW - 20 MPH" },
            { x: 720, y: 525, text: "RESIDENTS ONLY" },
          ],
          parkingBays: [
            { x: 80, y: 406, width: 220, height: 38, orientation: "horizontal", label: "RESIDENT PARKING" },
          ],
        };

      default:
        // Downtown / Business / Entertainment / Tourist Standard Grid
        return {
          roads: [
            { x: 0, y: 440, width, height: 120, type: "avenue", direction: "horizontal", hasMarkings: true },
            { x: 440, y: 0, width: 120, height, type: "avenue", direction: "vertical", hasMarkings: true },
          ],
          crosswalks: [
            { x: 400, y: 444, width: 36, height: 112, orientation: "horizontal" },
            { x: 564, y: 444, width: 36, height: 112, orientation: "horizontal" },
            { x: 444, y: 400, width: 112, height: 36, orientation: "vertical" },
            { x: 444, y: 564, width: 112, height: 36, orientation: "vertical" },
          ],
          stopLines: [
            { x: 390, y: 444, width: 6, height: 52 },
            { x: 604, y: 504, width: 6, height: 52 },
            { x: 444, y: 390, width: 52, height: 6 },
            { x: 504, y: 604, width: 52, height: 6 },
          ],
          stencils: [
            { x: 260, y: 472, text: "CITY CENTRE" },
            { x: 740, y: 528, text: "ONE WAY ➔" },
            { x: 472, y: 260, text: "BUS LANE" },
            { x: 528, y: 740, text: "KEEP CLEAR" },
          ],
          parkingBays: [
            { x: 80, y: 394, width: 240, height: 40, orientation: "horizontal", label: "PAY & DISPLAY" },
          ],
        };
    }
  }

  /**
   * Renders the complete realistic road network (Asphalt aggregate grain, curved intersection fillets,
   * granite curb bevels, tactile paving, zebra stripes, stop lines, stencils, parking bays)
   */
  public static drawRoads(
    ctx: CanvasRenderingContext2D,
    districtId: DistrictId,
    width: number = 1000,
    height: number = 1000
  ): void {
    const layout = this.getDistrictRoadLayout(districtId, width, height);

    ctx.save();

    // 1. Draw Road Asphalt Surfaces & Curbs
    for (const r of layout.roads) {
      if (r.type === "boardwalk" || r.type === "pedestrian_paved") {
        continue;
      }

      // Asphalt Base with subtle gradient
      const asphaltGrad = ctx.createLinearGradient(r.x, r.y, r.x + r.width, r.y + r.height);
      if (r.isBusLane) {
        asphaltGrad.addColorStop(0, "#7f1d1d");
        asphaltGrad.addColorStop(1, "#5b1313");
      } else {
        asphaltGrad.addColorStop(0, "#1e293b");
        asphaltGrad.addColorStop(0.5, "#1a2434");
        asphaltGrad.addColorStop(1, "#161e2e");
      }
      ctx.fillStyle = asphaltGrad;
      ctx.fillRect(r.x, r.y, r.width, r.height);

      // Subtle Aggregate Grain / Tarmac noise (deterministic without math random every frame)
      ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
      for (let dotX = r.x + 8; dotX < r.x + r.width; dotX += 28) {
        for (let dotY = r.y + 8; dotY < r.y + r.height; dotY += 28) {
          ctx.fillRect(dotX, dotY, 2, 2);
        }
      }

      // Subtle Tire Wear Markings along lanes
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      if (r.direction === "horizontal") {
        ctx.fillRect(r.x, r.y + r.height * 0.22, r.width, 10);
        ctx.fillRect(r.x, r.y + r.height * 0.72, r.width, 10);
      } else {
        ctx.fillRect(r.x + r.width * 0.22, r.y, 10, r.height);
        ctx.fillRect(r.x + r.width * 0.72, r.y, 10, r.height);
      }

      // Raised Granite Curbs with Bevel Highlights & Shadows
      if (r.direction === "horizontal") {
        // Top Curb (Bevel + Shadow)
        ctx.fillStyle = "#64748b"; // Curb Stone
        ctx.fillRect(r.x, r.y - 6, r.width, 6);
        ctx.fillStyle = "#94a3b8"; // Top Bevel Highlight
        ctx.fillRect(r.x, r.y - 6, r.width, 1.5);
        ctx.fillStyle = "#0f172a"; // Curb Drop Shadow onto asphalt
        ctx.fillRect(r.x, r.y, r.width, 2);

        // Bottom Curb (Bevel + Shadow)
        ctx.fillStyle = "#64748b";
        ctx.fillRect(r.x, r.y + r.height, r.width, 6);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(r.x, r.y + r.height + 4.5, r.width, 1.5);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(r.x, r.y + r.height - 2, r.width, 2);
      } else {
        // Left Curb
        ctx.fillStyle = "#64748b";
        ctx.fillRect(r.x - 6, r.y, 6, r.height);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(r.x - 6, r.y, 1.5, r.height);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(r.x, r.y, 2, r.height);

        // Right Curb
        ctx.fillStyle = "#64748b";
        ctx.fillRect(r.x + r.width, r.y, 6, r.height);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(r.x + r.width + 4.5, r.y, 1.5, r.height);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(r.x + r.width - 2, r.y, 2, r.height);
      }

      // Center Lane Markings
      if (r.hasMarkings) {
        ctx.strokeStyle = "#f59e0b"; // Vibrant British / Urban Traffic Yellow
        ctx.lineWidth = 3;
        ctx.setLineDash([22, 16]);
        ctx.beginPath();
        if (r.direction === "horizontal") {
          const midY = r.y + r.height / 2;
          ctx.moveTo(r.x, midY);
          ctx.lineTo(r.x + r.width, midY);
        } else {
          ctx.strokeStyle = "#f8fafc";
          const midX = r.x + r.width / 2;
          ctx.moveTo(midX, r.y);
          ctx.lineTo(midX, r.y + r.height);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 2. Curved Corner Curb Transitions (Intersection Fillets)
    if (layout.roads.length >= 2 && districtId !== "university" && districtId !== "beach") {
      const mainH = layout.roads.find((r) => r.direction === "horizontal");
      const mainV = layout.roads.find((r) => r.direction === "vertical");
      if (mainH && mainV) {
        const ix = mainV.x;
        const iy = mainH.y;
        const iw = mainV.width;
        const ih = mainH.height;
        const radius = 24;

        // Draw 4 rounded corner curb transitions
        const corners = [
          { cx: ix, cy: iy, startA: Math.PI, endA: Math.PI * 1.5 }, // Top-Left
          { cx: ix + iw, cy: iy, startA: Math.PI * 1.5, endA: Math.PI * 2 }, // Top-Right
          { cx: ix, cy: iy + ih, startA: Math.PI * 0.5, endA: Math.PI }, // Bottom-Left
          { cx: ix + iw, cy: iy + ih, startA: 0, endA: Math.PI * 0.5 }, // Bottom-Right
        ];

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 6;
        for (const c of corners) {
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, radius, c.startA, c.endA);
          ctx.stroke();
        }
      }
    }

    // 3. Parking Bays
    if (layout.parkingBays) {
      for (const p of layout.parkingBays) {
        ctx.fillStyle = "#172033";
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // White parking bay markings
        ctx.strokeStyle = "rgba(248, 250, 252, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Individual slot lines
        for (let bx = p.x + 44; bx < p.x + p.width; bx += 44) {
          ctx.beginPath();
          ctx.moveTo(bx, p.y);
          ctx.lineTo(bx, p.y + p.height);
          ctx.stroke();
        }

        if (p.label) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 7.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(p.label, p.x + p.width / 2, p.y - 4);
        }
      }
    }

    // 4. Zebra Crosswalks with Tactile Warning Paving Pads
    for (const cw of layout.crosswalks) {
      // Tactile Yellow Warning Paver at sidewalk curb entry
      ctx.fillStyle = "#fbbf24";
      if (cw.orientation === "horizontal") {
        ctx.fillRect(cw.x - 8, cw.y, 6, cw.height);
        ctx.fillRect(cw.x + cw.width + 2, cw.y, 6, cw.height);
      } else {
        ctx.fillRect(cw.x, cw.y - 8, cw.width, 6);
        ctx.fillRect(cw.x, cw.y + cw.height + 2, cw.width, 6);
      }

      // Zebra Stripes
      ctx.fillStyle = "#ffffff";
      if (cw.orientation === "horizontal") {
        for (let x = cw.x; x < cw.x + cw.width; x += 14) {
          ctx.fillRect(x, cw.y, 8, cw.height);
        }
      } else {
        for (let y = cw.y; y < cw.y + cw.height; y += 14) {
          ctx.fillRect(cw.x, y, cw.width, 8);
        }
      }
    }

    // 5. Solid White Stop Lines
    ctx.fillStyle = "#ffffff";
    for (const sl of layout.stopLines) {
      ctx.fillRect(sl.x, sl.y, sl.width, sl.height);
    }

    // 6. Directional Arrows and Road Stencils
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "bold 9.5px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const st of layout.stencils) {
      ctx.fillText(st.text, st.x, st.y);
    }

    ctx.restore();
  }
}

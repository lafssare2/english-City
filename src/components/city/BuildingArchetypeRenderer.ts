import { CityLocation, TimeOfDay } from "../../types";

export interface ShadowVector {
  dx: number;
  dy: number;
  length: number;
  alpha: number;
  color: string;
}

/**
 * Helper to compute directional shadow parameters based on TimeOfDay
 */
export function getDirectionalShadow(timeOfDay: TimeOfDay): ShadowVector {
  switch (timeOfDay) {
    case "morning":
      return { dx: 0.55, dy: 0.45, length: 1.15, alpha: 0.35, color: "rgba(15, 23, 42, 0.38)" };
    case "afternoon":
      return { dx: 0.25, dy: 0.35, length: 0.65, alpha: 0.45, color: "rgba(15, 23, 42, 0.45)" };
    case "evening":
      return { dx: -0.75, dy: 0.35, length: 1.55, alpha: 0.48, color: "rgba(45, 10, 10, 0.5)" };
    case "night":
      return { dx: 0.15, dy: 0.25, length: 0.4, alpha: 0.25, color: "rgba(2, 6, 23, 0.3)" };
  }
}

/**
 * True 2.5D Architectural Archetype Renderer for English City.
 * Renders authentic building volumes comprising:
 * 1. Ground contact foundation & ambient occlusion
 * 2. Multi-story front facade with floor trim cornices
 * 3. 2.5D isometric shaded side extrusion wall
 * 4. Angled rooftop plane with realistic roof membrane / shingles
 * 5. Roof overhang casting ambient shadow onto upper facade
 * 6. Recessed architectural entrance
 * 7. Multi-story windows with diverse interior silhouettes & night occupancy
 * 8. Physical English storefront fascias and signboards
 * 9. Directional cast shadows extending across ground
 */
export class BuildingArchetypeRenderer {
  public static drawBuilding(
    ctx: CanvasRenderingContext2D,
    loc: CityLocation,
    x: number,
    y: number,
    animTime: number,
    timeOfDay: TimeOfDay = "afternoon",
    isSelected: boolean = false,
    isHovered: boolean = false
  ): void {
    const category = (loc as any).templateType || loc.category || "civic";
    
    // Archetype dimensions & Multi-story height scale
    let w = 156;
    let h = 132;
    let stories = 2;
    const sideDepth = 22; // 2.5D isometric side extrusion width
    const roofPitch = 18; // Roof plane projection height

    if (category === "hospital" || category === "medical" || category === "airport" || category === "train_station") {
      w = 176;
      h = 148;
      stories = 4;
    } else if (category === "business" || category === "tech" || category === "office") {
      w = 164;
      h = 156;
      stories = 5;
    } else if (category === "hotel" || category === "theatre" || category === "cinema") {
      w = 168;
      h = 144;
      stories = 3;
    } else if (category === "cafe" || category === "bakery" || category === "shop" || category === "store" || category === "bookstore") {
      w = 144;
      h = 120;
      stories = 2;
    } else if (category === "residential" || category === "suburbs" || category === "townhouse") {
      w = 140;
      h = 126;
      stories = 2;
    } else if (category === "police" || category === "fire_station" || category === "bank") {
      w = 160;
      h = 136;
      stories = 3;
    }

    const posX = x - w / 2;
    const posY = y - h / 2;
    const isNight = timeOfDay === "night";
    const isEvening = timeOfDay === "evening";

    ctx.save();

    // 1. Directional Ground Cast Shadow
    const shadow = getDirectionalShadow(timeOfDay);
    this.renderDirectionalShadow(ctx, posX, posY, w, h, sideDepth, shadow);

    // 2. Foundation Ambient Occlusion Line
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(posX - 4, posY + h - 2, w + sideDepth + 8, 5);

    // 3. Shaded 2.5D Side Extrusion Wall (Right side isometric volume)
    this.renderSideExtrusion(ctx, posX, posY, w, h, sideDepth, roofPitch, category);

    // 4. Angled Rooftop Plane with Roof Equipment
    this.renderRoofPlane(ctx, posX, posY, w, sideDepth, roofPitch, category, animTime);

    // 5. Main Multi-Story Front Facade
    this.renderFrontFacade(ctx, posX, posY, w, h, category, loc, stories, animTime, isNight, isEvening);

    // 6. Roof Overhang & Cornice Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(posX, posY, w, 6);

    // 7. Interactive Selection Highlight
    if (isSelected || isHovered) {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 16;
      ctx.strokeRect(posX, posY, w, h);
      ctx.shadowBlur = 0;
    }

    // 8. Multi-Story Windows with Varied Interiors & Night Occupancy
    this.renderMultiStoryWindows(ctx, posX, posY, w, h, stories, category, isNight, isEvening, animTime);

    // 9. Architectural Ground Floor Entrance & Display Windows
    this.renderEntranceAndStorefront(ctx, posX, posY, w, h, category, loc, isNight, animTime);

    // 10. Physically Integrated English Storefront Signboard
    this.renderSignboard(ctx, posX, posY, w, loc, category, isNight);

    ctx.restore();
  }

  private static renderDirectionalShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    sideDepth: number,
    shadow: ShadowVector
  ): void {
    const sx = shadow.dx * h * shadow.length;
    const sy = shadow.dy * h * shadow.length;

    ctx.fillStyle = shadow.color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + sx, y + h + sy);
    ctx.lineTo(x + w + sideDepth + sx, y + h + sy);
    ctx.lineTo(x + w + sideDepth, y + h);
    ctx.closePath();
    ctx.fill();
  }

  private static renderSideExtrusion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    sideDepth: number,
    roofPitch: number,
    category: string
  ): void {
    // Darker shaded tone for the extruded side wall to create realistic depth
    let sideColor = "#0f172a";
    if (category === "bank" || category === "hospital" || category === "medical") {
      sideColor = "#475569";
    } else if (category === "university" || category === "cafe" || category === "bakery") {
      sideColor = "#451a03";
    } else if (category === "police") {
      sideColor = "#0f172a";
    } else if (category === "fire_station") {
      sideColor = "#450a0a";
    }

    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + sideDepth, y - roofPitch);
    ctx.lineTo(x + w + sideDepth, y + h - roofPitch);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // Side wall brick / panel seams
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let sy = y + 20; sy < y + h; sy += 24) {
      ctx.beginPath();
      ctx.moveTo(x + w, sy);
      ctx.lineTo(x + w + sideDepth, sy - roofPitch);
      ctx.stroke();
    }
  }

  private static renderRoofPlane(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    sideDepth: number,
    roofPitch: number,
    category: string,
    animTime: number
  ): void {
    // Angled Roof Top Polygon
    let roofColor = "#1e293b";
    if (category === "university" || category === "residential" || category === "suburbs") {
      roofColor = "#78350f"; // Shingle / Slate Terracotta
    } else if (category === "bank") {
      roofColor = "#64748b"; // Classical Limestone
    } else if (category === "hospital" || category === "medical") {
      roofColor = "#334155";
    }

    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sideDepth, y - roofPitch);
    ctx.lineTo(x + w + sideDepth, y - roofPitch);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();

    // Roof border trim
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rooftop Mechanical Units & Fixtures
    if (category === "hospital" || category === "medical") {
      // Rooftop Helipad
      const hx = x + w / 2 + 10;
      const hy = y - roofPitch / 2;
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(hx, hy, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("H", hx, hy);
    } else if (category === "tech" || category === "business" || category === "office") {
      // HVAC units & Satellite dish
      const hx = x + 24;
      const hy = y - roofPitch + 4;
      ctx.fillStyle = "#475569";
      ctx.fillRect(hx, hy, 22, 10);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(hx, hy, 22, 10);

      // Communications Spire
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - roofPitch);
      ctx.lineTo(x + w / 2, y - roofPitch - 24);
      ctx.stroke();

      const beacon = Math.sin(animTime * 0.008) > 0;
      ctx.fillStyle = beacon ? "#22d3ee" : "#0891b2";
      ctx.beginPath();
      ctx.arc(x + w / 2, y - roofPitch - 24, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (category === "residential" || category === "suburbs" || category === "townhouse") {
      // Brick Chimney
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(x + w - 24, y - roofPitch - 12, 10, 16);
      ctx.fillStyle = "#450a0a";
      ctx.fillRect(x + w - 26, y - roofPitch - 14, 14, 3);
    }
  }

  private static renderFrontFacade(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    category: string,
    loc: CityLocation,
    stories: number,
    animTime: number,
    isNight: boolean,
    isEvening: boolean
  ): void {
    const grad = ctx.createLinearGradient(x, y, x, y + h);

    switch (category) {
      case "hospital":
      case "medical":
      case "pharmacy":
        grad.addColorStop(0, "#f8fafc");
        grad.addColorStop(0.5, "#e2e8f0");
        grad.addColorStop(1, "#94a3b8");
        break;

      case "police":
        grad.addColorStop(0, "#1e3a8a");
        grad.addColorStop(0.6, "#172554");
        grad.addColorStop(1, "#0f172a");
        break;

      case "fire_station":
        grad.addColorStop(0, "#b91c1c");
        grad.addColorStop(0.6, "#991b1b");
        grad.addColorStop(1, "#450a0a");
        break;

      case "bank":
        grad.addColorStop(0, "#f1f5f9");
        grad.addColorStop(0.6, "#cbd5e1");
        grad.addColorStop(1, "#94a3b8");
        break;

      case "university":
      case "academic":
      case "library":
        grad.addColorStop(0, "#9a3412");
        grad.addColorStop(0.6, "#7c2d12");
        grad.addColorStop(1, "#431407");
        break;

      case "cafe":
      case "bakery":
      case "bistro":
        grad.addColorStop(0, "#b45309");
        grad.addColorStop(0.7, "#92400e");
        grad.addColorStop(1, "#78350f");
        break;

      case "business":
      case "tech":
      case "office":
        grad.addColorStop(0, "#0e7490");
        grad.addColorStop(0.5, "#155e75");
        grad.addColorStop(1, "#083344");
        break;

      default:
        grad.addColorStop(0, "#1e293b");
        grad.addColorStop(0.7, "#0f172a");
        grad.addColorStop(1, "#020617");
        break;
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Architectural Floor Trim Cornices (Separates 1st, 2nd, 3rd, 4th floors)
    const floorHeight = (h - 44) / Math.max(1, stories - 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;

    for (let f = 1; f < stories; f++) {
      const cornY = y + 30 + f * floorHeight;
      ctx.fillRect(x, cornY, w, 4);
      ctx.strokeRect(x, cornY, w, 4);
    }
  }

  private static renderMultiStoryWindows(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    stories: number,
    category: string,
    isNight: boolean,
    isEvening: boolean,
    animTime: number
  ): void {
    if (category === "fire_station") return;

    const cols = category === "hospital" || category === "business" || category === "hotel" ? 5 : 4;
    const winW = 15;
    const winH = 13;
    const gapX = (w - 24 - cols * winW) / (cols - 1);
    const floorHeight = (h - 48) / Math.max(1, stories);

    for (let r = 0; r < stories - 1; r++) {
      const wy = y + 34 + r * floorHeight;

      for (let c = 0; c < cols; c++) {
        const wx = x + 12 + c * (winW + gapX);

        // Window Illumination & Occupancy
        const seed = (c * 3 + r * 7 + (category.charCodeAt(0) || 0)) % 10;
        const isLit = (isNight || isEvening) && seed > 3;

        if (isLit) {
          ctx.fillStyle = seed > 7 ? "#fef08a" : "#fed7aa"; // Warm amber / candlelight
          ctx.shadowColor = "#fef08a";
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = isNight ? "#0f172a" : "#bae6fd"; // Daytime sky blue reflection
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(wx, wy, winW, winH);
        ctx.shadowBlur = 0;

        // Window Sill & Frame
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, winW, winH);

        // Interior Silhouettes (Blinds, Curtains, Plants, Office worker silhouettes)
        if (seed === 4 || seed === 5) {
          // Horizontal Venetian Blinds
          ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
          ctx.beginPath();
          ctx.moveTo(wx, wy + 4);
          ctx.lineTo(wx + winW, wy + 4);
          ctx.moveTo(wx, wy + 8);
          ctx.lineTo(wx + winW, wy + 8);
          ctx.stroke();
        } else if (seed === 6) {
          // Potted Fern / Plant on window sill
          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.arc(wx + winW / 2, wy + winH - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (seed === 8 && isLit) {
          // Silhouette of desk lamp
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.fillRect(wx + 3, wy + 6, 4, 6);
        }
      }
    }
  }

  private static renderEntranceAndStorefront(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    category: string,
    loc: CityLocation,
    isNight: boolean,
    animTime: number
  ): void {
    const doorW = 34;
    const doorH = 34;
    const doorX = x + w / 2 - doorW / 2;
    const doorY = y + h - doorH - 2;

    // 1. Flanking Storefront Windows for Retail/Cafes
    if (category === "cafe" || category === "bakery" || category === "shop" || category === "store" || category === "bookstore") {
      // Striped Fabric Awning over storefront
      const awningW = doorW + 54;
      const awningH = 14;
      const awningX = doorX - 27;
      const awningY = doorY - 14;

      ctx.fillStyle = category === "bookstore" ? "#047857" : "#dc2626";
      ctx.fillRect(awningX, awningY, awningW, awningH);

      ctx.fillStyle = "#ffffff";
      for (let s = awningX; s < awningX + awningW; s += 14) {
        ctx.fillRect(s, awningY, 7, awningH);
      }
      ctx.strokeStyle = "#7f1d1d";
      ctx.strokeRect(awningX, awningY, awningW, awningH);

      // Flanking Display Windows
      const winW = 30;
      const winH = 26;
      const leftWinX = x + 10;
      const rightWinX = x + w - 10 - winW;
      const winY = doorY + 6;

      for (const dwx of [leftWinX, rightWinX]) {
        ctx.fillStyle = isNight ? "#fef08a" : "#bae6fd";
        ctx.fillRect(dwx, winY, winW, winH);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dwx, winY, winW, winH);

        // Store interior items
        ctx.fillStyle = "#0f172a";
        if (category === "bookstore") {
          ctx.fillRect(dwx + 4, winY + 16, 22, 3);
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(dwx + 6, winY + 8, 4, 8);
          ctx.fillStyle = "#2563eb";
          ctx.fillRect(dwx + 12, winY + 6, 4, 10);
        } else {
          ctx.beginPath();
          ctx.arc(dwx + winW / 2, winY + winH / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Main Entrance Glass Doors
    ctx.fillStyle = category === "hospital" ? "#e0f2fe" : "#0284c7";
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door Split & Brass Handles
    ctx.beginPath();
    ctx.moveTo(doorX + doorW / 2, doorY);
    ctx.lineTo(doorX + doorW / 2, doorY + doorH);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.fillRect(doorX + doorW / 2 - 3, doorY + 14, 2, 7);
    ctx.fillRect(doorX + doorW / 2 + 1, doorY + 14, 2, 7);

    // 3. Entrance Recess & Overhead Step
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(doorX - 4, doorY - 8, doorW + 8, 7);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ENTRANCE", doorX + doorW / 2, doorY - 2.5);
  }

  private static renderSignboard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    loc: CityLocation,
    category: string,
    isNight: boolean
  ): void {
    const signW = w - 16;
    const signH = 20;
    const signX = x + 8;
    const signY = y + 8;

    // Dark Enamel / Acrylic Signboard Background
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(signX, signY, signW, signH, 4);
    ctx.fill();

    // Metallic Sign Brackets
    ctx.fillStyle = "#64748b";
    ctx.fillRect(signX + 2, signY - 2, 4, 3);
    ctx.fillRect(signX + signW - 6, signY - 2, 4, 3);

    // Neon / Illuminated Sign Border
    if (isNight) {
      const neonColor =
        category === "hospital" || category === "police" || category === "fire_station"
          ? "#ef4444"
          : category === "entertainment" || category === "theatre"
          ? "#f43f5e"
          : category === "tech" || category === "business"
          ? "#06b6d4"
          : "#facc15";

      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(signX, signY, signW, signH);
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.strokeRect(signX, signY, signW, signH);
    }

    // Physical English Signboard Typography
    const text = loc.name.toUpperCase();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text.length > 22 ? text.slice(0, 20) + "..." : text,
      signX + signW / 2,
      signY + signH / 2
    );
  }
}

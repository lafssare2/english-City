import { DistrictId, TimeOfDay, WeatherType } from "../../types";

/**
 * High-performance 2.5D / Isometric Procedural Game Renderer for English City.
 * Renders rich streets, sidewalks, crosswalks, detailed architectural facades,
 * street furniture, trees, vehicles, and environmental English signage.
 */
export class CityAssetRenderer {
  /**
   * Draws district-specific ground terrain (asphalt, stone plazas, green lawns, or golden beach)
   */
  public static drawTerrain(
    ctx: CanvasRenderingContext2D,
    districtId: DistrictId,
    width: number,
    height: number,
    animTime: number
  ): void {
    ctx.save();

    if (districtId === "beach") {
      // 1. Ocean Water & Sandy Coastline
      const gradSand = ctx.createLinearGradient(0, 0, width, height);
      gradSand.addColorStop(0, "#0f172a"); // Top urban edge
      gradSand.addColorStop(0.3, "#475569"); // Promenade concrete
      gradSand.addColorStop(0.5, "#d97706"); // Wet boardwalk
      gradSand.addColorStop(0.65, "#fde68a"); // Golden sand
      gradSand.addColorStop(0.85, "#0284c7"); // Shallow turquoise water
      gradSand.addColorStop(1.0, "#0369a1"); // Deep ocean blue
      ctx.fillStyle = gradSand;
      ctx.fillRect(0, 0, width, height);

      // Animated Shoreline Waves
      const waveOffset = Math.sin(animTime * 0.002) * 15;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.72 + waveOffset);
      for (let x = 0; x <= width; x += 40) {
        const wy =
          height * 0.72 +
          waveOffset +
          Math.sin(x * 0.02 + animTime * 0.003) * 8;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Wooden Boardwalk Pier
      ctx.fillStyle = "#78350f";
      ctx.fillRect(600, 350, 180, 500);
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      for (let y = 350; y < 850; y += 16) {
        ctx.beginPath();
        ctx.moveTo(600, y);
        ctx.lineTo(780, y);
        ctx.stroke();
      }
    } else if (districtId === "university") {
      // 2. Oxford University: Collegiate Green Lawns & Flagstone Paths
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, width, height);

      // Manicured Campus Quad Lawns
      ctx.fillStyle = "#14532d";
      ctx.beginPath();
      ctx.roundRect(100, 120, 320, 260, 16);
      ctx.roundRect(580, 120, 320, 260, 16);
      ctx.roundRect(100, 580, 320, 260, 16);
      ctx.roundRect(580, 580, 320, 260, 16);
      ctx.fill();

      // Stone Pathways
      ctx.fillStyle = "#475569";
      ctx.fillRect(440, 0, 120, height);
      ctx.fillRect(0, 420, width, 120);

      // Central Stone Plaza & Fountain Base
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(500, 480, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Water inside fountain with subtle wave
      const fWave = Math.sin(animTime * 0.003) * 3;
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(500, 480, 70 + fWave, 0, Math.PI * 2);
      ctx.fill();
    } else if (districtId === "suburbs" || districtId === "residential") {
      // 3. Residential / Suburbs: Quiet Green Lots & Paved Streets
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Residential Front Yards
      ctx.fillStyle = "#166534";
      ctx.fillRect(40, 80, 400, 320);
      ctx.fillRect(560, 80, 400, 320);
      ctx.fillRect(40, 600, 400, 320);
      ctx.fillRect(560, 600, 400, 320);

      // Garden fences
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 80, 400, 320);
      ctx.strokeRect(560, 80, 400, 320);
    } else {
      // 4. Metropolitan Asphalt & Modern Granite Tiles
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Plaza Granite Pavements
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(60, 60, 380, 340);
      ctx.fillRect(560, 60, 380, 340);
      ctx.fillRect(60, 600, 380, 340);
      ctx.fillRect(560, 600, 380, 340);
    }

    ctx.restore();
  }

  /**
   * Draws the realistic road network with lanes, zebra crosswalks, stop lines, and arrows
   */
  public static drawRoadNetwork(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.save();

    // 1. Horizontal Main Avenue (Y: 440 to 560, Height: 120px)
    ctx.fillStyle = "#1e293b"; // Rich dark asphalt
    ctx.fillRect(0, 440, width, 120);

    // Sidewalk Borders (Curbstones)
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 432, width, 8);
    ctx.fillRect(0, 560, width, 8);

    // 2. Vertical Cross Boulevard (X: 440 to 560, Width: 120px)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(440, 0, 120, height);

    ctx.fillStyle = "#475569";
    ctx.fillRect(432, 0, 8, height);
    ctx.fillRect(560, 0, 8, height);

    // 3. Center Dashed Yellow Road Markings (Horizontal)
    ctx.strokeStyle = "#f59e0b"; // Vibrant traffic yellow
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(440, 500);
    ctx.moveTo(560, 500);
    ctx.lineTo(width, 500);
    ctx.stroke();

    // Center Dashed White Road Markings (Vertical)
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(500, 0);
    ctx.lineTo(500, 440);
    ctx.moveTo(500, 560);
    ctx.lineTo(500, height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 4. Zebra Crosswalks at 4 Intersection Corners
    ctx.fillStyle = "#ffffff";
    const drawZebra = (x1: number, y1: number, w: number, h: number, horizontal: boolean) => {
      if (horizontal) {
        for (let x = x1; x < x1 + w; x += 14) {
          ctx.fillRect(x, y1, 8, h);
        }
      } else {
        for (let y = y1; y < y1 + h; y += 14) {
          ctx.fillRect(x1, y, w, 8);
        }
      }
    };

    // West Crosswalk (Horizontal Road, West side of intersection)
    drawZebra(400, 444, 36, 112, true);
    // East Crosswalk
    drawZebra(564, 444, 36, 112, true);
    // North Crosswalk
    drawZebra(444, 400, 112, 36, false);
    // South Crosswalk
    drawZebra(444, 564, 112, 36, false);

    // 5. White Stop Lines before Crosswalks
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(390, 444, 6, 52); // West stop line (eastbound lane)
    ctx.fillRect(604, 504, 6, 52); // East stop line (westbound lane)
    ctx.fillRect(444, 390, 52, 6); // North stop line (southbound lane)
    ctx.fillRect(504, 604, 52, 6); // South stop line (northbound lane)

    // 6. Directional Painted Road Arrows
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("➔", 280, 472); // Eastbound
    ctx.fillText("⬅", 720, 528); // Westbound
    ctx.fillText("⬇", 472, 280); // Southbound
    ctx.fillText("⬆", 528, 720); // Northbound

    // Road Stencil Labels
    ctx.font = "bold 10px monospace";
    ctx.fillText("SLOW", 230, 472);
    ctx.fillText("SLOW", 770, 528);

    ctx.restore();
  }

  /**
   * Draws rich 2.5D Building Facades with 3D Depth, Windows, Roofs, and Signage
   */
  public static drawBuilding(
    ctx: CanvasRenderingContext2D,
    bld: {
      id: string;
      name: string;
      category?: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      color?: string;
      icon?: string;
      signText?: string;
      isHighlighted?: boolean;
    },
    timeOfDay: TimeOfDay
  ): void {
    const w = bld.width || 140;
    const h = bld.height || 120;
    const x = bld.x - w / 2;
    const y = bld.y - h / 2;
    const depth = 20; // 2.5D Isometric Extrusion Height

    ctx.save();

    // 1. Drop Shadow under Building
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(x + 8, y + depth + 8, w, h, 12);
    ctx.fill();

    // 2. 3D Extruded South/East Wall (Darker Tone)
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.roundRect(x, y + depth, w, h, 12);
    ctx.fill();

    // 3. Main Building Front Facade
    let facadeGradient = ctx.createLinearGradient(x, y, x, y + h);
    if (bld.category === "hospital" || bld.name.toLowerCase().includes("hospital")) {
      facadeGradient.addColorStop(0, "#f8fafc");
      facadeGradient.addColorStop(1, "#cbd5e1");
    } else if (bld.category === "university" || bld.name.toLowerCase().includes("library")) {
      facadeGradient.addColorStop(0, "#7c2d12");
      facadeGradient.addColorStop(1, "#451a03");
    } else if (bld.category === "cafe" || bld.name.toLowerCase().includes("coffee")) {
      facadeGradient.addColorStop(0, "#b45309");
      facadeGradient.addColorStop(1, "#78350f");
    } else if (bld.category === "airport" || bld.name.toLowerCase().includes("airport")) {
      facadeGradient.addColorStop(0, "#0284c7");
      facadeGradient.addColorStop(1, "#0369a1");
    } else {
      facadeGradient.addColorStop(0, "#1e293b");
      facadeGradient.addColorStop(1, "#0f172a");
    }

    ctx.fillStyle = facadeGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();

    // Highlight Border if near player
    if (bld.isHighlighted) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Roof Trim / Parapet
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, 16, 6);
    ctx.fill();

    // 5. Architectural Window Grid (Lights on at evening/night!)
    const isNight = timeOfDay === "night" || timeOfDay === "evening";
    const windowColor = isNight ? "rgba(254, 240, 138, 0.9)" : "rgba(148, 163, 184, 0.6)";
    const windowCols = 4;
    const windowRows = 2;
    const winW = 14;
    const winH = 14;
    const gapX = (w - 24 - windowCols * winW) / (windowCols - 1);

    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const wx = x + 12 + c * (winW + gapX);
        const wy = y + 28 + r * 22;

        ctx.fillStyle = windowColor;
        if (isNight && Math.random() > 0.3) {
          ctx.shadowColor = "#fef08a";
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(wx, wy, winW, winH);
        ctx.shadowBlur = 0;

        // Window Mullions
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, winW, winH);
      }
    }

    // 6. Ground Floor Entrance Canopy / Awning
    const doorW = 28;
    const doorH = 34;
    const doorX = x + w / 2 - doorW / 2;
    const doorY = y + h - doorH - 4;

    // Striped Awning for Cafes/Shops
    if (bld.category === "cafe" || bld.category === "store" || bld.name.toLowerCase().includes("cafe")) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(doorX - 16, doorY - 14, doorW + 32, 12, [4, 4, 0, 0]);
      ctx.fill();

      // White Stripes
      ctx.fillStyle = "#ffffff";
      for (let s = doorX - 16; s < doorX + doorW + 16; s += 12) {
        ctx.fillRect(s, doorY - 14, 6, 12);
      }
    }

    // Main Entrance Glass Double Doors
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY, doorW, doorH);
    ctx.beginPath();
    ctx.moveTo(doorX + doorW / 2, doorY);
    ctx.lineTo(doorX + doorW / 2, doorY + doorH);
    ctx.stroke();

    // "ENTRANCE" Overhead Door Sign
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(doorX - 6, doorY - 10, doorW + 12, 9);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ENTRANCE", doorX + doorW / 2, doorY - 3);

    // 7. Bold Environmental English Signboard on Roof/Fascia
    const signBoxW = w - 16;
    const signBoxH = 22;
    const signBoxX = x + 8;
    const signBoxY = y + 2;

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(signBoxX, signBoxY, signBoxW, signBoxH, 6);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sign Text (Readable English Word)
    const displayName = bld.signText || bld.name.toUpperCase();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      displayName.length > 20 ? displayName.slice(0, 18) + "..." : displayName,
      signBoxX + signBoxW / 2,
      signBoxY + signBoxH / 2
    );

    ctx.restore();
  }

  /**
   * Draws Environmental Street Props (Street Lamps with light halos, Trees with swaying foliage, Benches, Trash Bins, Mailboxes, ATMs)
   */
  public static drawStreetProp(
    ctx: CanvasRenderingContext2D,
    prop: {
      type:
        | "street_lamp"
        | "tree"
        | "bench"
        | "trash_bin"
        | "mailbox"
        | "atm"
        | "traffic_light"
        | "bus_stop_shelter"
        | "crosswalk_sign"
        | "fire_hydrant";
      x: number;
      y: number;
      state?: any;
    },
    timeOfDay: TimeOfDay,
    animTime: number
  ): void {
    ctx.save();
    const isDark = timeOfDay === "night" || timeOfDay === "evening";

    switch (prop.type) {
      case "street_lamp": {
        // Cast Iron Pole
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(prop.x - 2, prop.y - 32, 4, 32);
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 34, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Lamp Head at Night
        if (isDark) {
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(prop.x, prop.y - 34, 4, 0, Math.PI * 2);
          ctx.fill();

          // Ambient Radial Light Halo onto Pavement
          const halo = ctx.createRadialGradient(
            prop.x,
            prop.y,
            4,
            prop.x,
            prop.y,
            75
          );
          halo.addColorStop(0, "rgba(254, 240, 138, 0.45)");
          halo.addColorStop(0.6, "rgba(254, 240, 138, 0.15)");
          halo.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(prop.x, prop.y, 75, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case "tree": {
        // Drop Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(prop.x + 4, prop.y + 4, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tree Trunk
        ctx.fillStyle = "#78350f";
        ctx.fillRect(prop.x - 3, prop.y - 20, 6, 20);

        // Swaying Leaf Canopies
        const sway = Math.sin(animTime * 0.002 + prop.x) * 2;
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.arc(prop.x + sway, prop.y - 26, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(prop.x + sway - 3, prop.y - 32, 14, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "bench": {
        // Wooden Slats Bench
        ctx.fillStyle = "#92400e";
        ctx.fillRect(prop.x - 14, prop.y - 8, 28, 6);
        ctx.fillRect(prop.x - 14, prop.y - 16, 28, 4); // Backrest

        // Metal Legs
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(prop.x - 12, prop.y - 2, 3, 6);
        ctx.fillRect(prop.x + 9, prop.y - 2, 3, 6);
        break;
      }

      case "trash_bin": {
        // Recycling & Trash Can
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.roundRect(prop.x - 6, prop.y - 14, 12, 14, 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("♻", prop.x, prop.y - 5);
        break;
      }

      case "mailbox": {
        // Blue Postal Box
        ctx.fillStyle = "#1d4ed8";
        ctx.beginPath();
        ctx.roundRect(prop.x - 7, prop.y - 16, 14, 16, [4, 4, 1, 1]);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(prop.x - 5, prop.y - 12, 10, 2); // Mail slot
        break;
      }

      case "atm": {
        // Bank ATM Kiosk
        ctx.fillStyle = "#334155";
        ctx.fillRect(prop.x - 10, prop.y - 22, 20, 22);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(prop.x - 7, prop.y - 19, 14, 8); // Screen
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 6px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ATM", prop.x, prop.y - 4);
        break;
      }

      case "traffic_light": {
        const lightState = prop.state || "green";
        // Black Housing Box
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(prop.x - 6, prop.y - 28, 12, 28);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1;
        ctx.strokeRect(prop.x - 6, prop.y - 28, 12, 28);

        // Red Light
        ctx.fillStyle = lightState === "red" ? "#ef4444" : "#450a0a";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 22, 3, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Light
        ctx.fillStyle = lightState === "yellow" ? "#facc15" : "#422006";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Green Light
        ctx.fillStyle = lightState === "green" ? "#22c55e" : "#052e16";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "bus_stop_shelter": {
        // Glass Bus Shelter
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(prop.x - 24, prop.y - 30, 48, 30);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(prop.x - 24, prop.y - 30, 48, 30);

        // Signboard
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(prop.x - 22, prop.y - 28, 44, 9);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BUS STOP • ROUTE 42", prop.x, prop.y - 22);

        // Small Bench Inside
        ctx.fillStyle = "#92400e";
        ctx.fillRect(prop.x - 16, prop.y - 10, 32, 4);
        break;
      }

      case "crosswalk_sign": {
        // Yellow Diamond Pedestrian Crossing Sign
        ctx.save();
        ctx.translate(prop.x, prop.y - 24);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();

        // Pole
        ctx.fillStyle = "#64748b";
        ctx.fillRect(prop.x - 1.5, prop.y - 18, 3, 18);

        // Pedestrian figure
        ctx.fillStyle = "#000000";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🚶", prop.x, prop.y - 20);
        break;
      }

      case "fire_hydrant": {
        // Red Fire Hydrant
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(prop.x - 4, prop.y - 12, 8, 12, 3);
        ctx.fill();
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(prop.x - 6, prop.y - 8, 12, 3); // Nozzle
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Draws Animated Player Character with Walking Stride, Direction Facing, and Level Badge
   */
  public static drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: "left" | "right" | "up" | "down",
    isWalking: boolean,
    animTime: number,
    avatarColor: string = "#3b82f6",
    playerName: string = "Citizen",
    level: string = "A1"
  ): void {
    ctx.save();

    // 1. Drop Shadow underneath Player Feet
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Walking Bobbing calculation
    const stride = isWalking ? Math.sin(animTime * 0.015) : 0;
    const walkOffsetY = isWalking ? Math.abs(Math.sin(animTime * 0.015)) * 3 : 0;
    const py = y - walkOffsetY;

    // 3. Legs
    ctx.fillStyle = "#1e293b"; // Dark denim pants
    if (isWalking) {
      ctx.fillRect(x - 5 + stride * 3, py - 8, 4, 10);
      ctx.fillRect(x + 1 - stride * 3, py - 8, 4, 10);
    } else {
      ctx.fillRect(x - 5, py - 8, 4, 10);
      ctx.fillRect(x + 1, py - 8, 4, 10);
    }

    // 4. Torso / Jacket
    ctx.fillStyle = avatarColor;
    ctx.beginPath();
    ctx.roundRect(x - 8, py - 24, 16, 17, 4);
    ctx.fill();

    // 5. Head & Hair
    ctx.fillStyle = "#fbcfe8"; // Skin tone
    ctx.beginPath();
    ctx.arc(x, py - 30, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Cap
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(x, py - 32, 7.5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Directional Eyes
    ctx.fillStyle = "#000000";
    if (facing === "right") {
      ctx.fillRect(x + 2, py - 31, 2, 2);
    } else if (facing === "left") {
      ctx.fillRect(x - 4, py - 31, 2, 2);
    } else if (facing === "down") {
      ctx.fillRect(x - 3, py - 30, 2, 2);
      ctx.fillRect(x + 1, py - 30, 2, 2);
    }

    // 6. Overhead Player Tag (Name + CEFR Level Badge)
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    const tagText = `${playerName} [${level}]`;
    const tagW = ctx.measureText(tagText).width + 12;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.roundRect(x - tagW / 2, py - 48, tagW, 14, 4);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(tagText, x, py - 38);

    ctx.restore();
  }
}

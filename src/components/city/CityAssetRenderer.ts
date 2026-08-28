import { DistrictId, TimeOfDay, WeatherType, CityLocation, NPC } from "../../types";
import { EnvironmentalLearningObject } from "../../content/vocabulary/environmentalVocabulary";
import { DistrictLayoutEngine } from "./DistrictLayoutEngine";
import { BuildingArchetypeRenderer } from "./BuildingArchetypeRenderer";
import { StreetPropRenderer } from "./StreetPropRenderer";
import { VehicleRenderer, SimulatedVehicle } from "./VehicleRenderer";
import { PedestrianRenderer, SimulatedPedestrian } from "./PedestrianRenderer";

export interface RenderableEntity {
  type: "building" | "prop" | "vehicle" | "npc" | "pedestrian" | "player" | "env_object";
  y: number;
  data: any;
}

/**
 * Master 2.5D City Asset Renderer for English City.
 * Orchestrates terrain generation, district road layouts, architectural archetypes,
 * dynamic street props, day/night lighting, weather atmospheres, and Y-sorted entity rendering.
 */
export class CityAssetRenderer {
  /**
   * Draws the foundation ground terrain for any of the 11 districts
   */
  public static drawTerrain(
    ctx: CanvasRenderingContext2D,
    districtId: DistrictId,
    width: number,
    height: number,
    animTime: number,
    timeOfDay: TimeOfDay = "afternoon"
  ): void {
    DistrictLayoutEngine.drawGroundTerrain(ctx, districtId, width, height, animTime, timeOfDay);
  }

  /**
   * Draws the authentic district-specific road network, crosswalks, stop lines, and painted road stencils
   */
  public static drawRoadNetwork(
    ctx: CanvasRenderingContext2D,
    districtId: DistrictId,
    width: number = 1000,
    height: number = 1000
  ): void {
    DistrictLayoutEngine.drawRoads(ctx, districtId, width, height);
  }

  /**
   * Draws an architectural archetype building with 3D depth, material textures, and environmental English signs
   */
  public static drawBuilding(
    ctx: CanvasRenderingContext2D,
    location: CityLocation | {
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
    timeOfDay: TimeOfDay = "afternoon",
    animTime: number = 0,
    isSelected: boolean = false,
    isHovered: boolean = false
  ): void {
    const loc: CityLocation = {
      id: location.id,
      name: location.name,
      districtId: (location as any).districtId || "downtown",
      category: (location as any).category || (location as any).templateType || "store",
      description: (location as any).description || "",
      icon: (location as any).icon || "Building",
      color: (location as any).color || "from-blue-600 to-indigo-900",
      x: (location as any).x || (location as any).canvasX || 500,
      y: (location as any).y || (location as any).canvasY || 500,
      canvasX: (location as any).canvasX || (location as any).x || 500,
      canvasY: (location as any).canvasY || (location as any).y || 500,
      npcs: (location as any).npcs || [],
      interactiveObjects: (location as any).interactiveObjects || [],
      unlocked: true,
      minLevel: (location as any).minLevel || "A1",
      interiorTheme: (location as any).interiorTheme || "store",
    };

    const posX = (location as any).canvasX || (location as any).x || 500;
    const posY = (location as any).canvasY || (location as any).y || 500;
    const highlighted = (location as any).isHighlighted || isSelected;

    BuildingArchetypeRenderer.drawBuilding(
      ctx,
      loc,
      posX,
      posY,
      animTime,
      timeOfDay,
      highlighted,
      isHovered
    );
  }

  /**
   * Draws street furniture, nature props, and lighting
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
        | "fire_hydrant"
        | "cafe_table"
        | "fountain"
        | "fingerpost"
        | "planter"
        | "lifeguard_tower"
        | "street_name_sign"
        | "road_sign"
        | "manhole"
        | "storm_drain";
      x: number;
      y: number;
      districtId?: DistrictId;
      state?: any;
      leftText?: string;
      rightText?: string;
      signType?: any;
      streetName?: string;
    },
    timeOfDay: TimeOfDay,
    animTime: number
  ): void {
    const isDark = timeOfDay === "night";
    const isDusk = timeOfDay === "evening";

    switch (prop.type) {
      case "street_lamp":
        StreetPropRenderer.drawStreetLamp(ctx, prop.x, prop.y, isDark, isDusk);
        break;
      case "tree":
        StreetPropRenderer.drawTree(ctx, prop.x, prop.y, prop.districtId || "downtown", animTime);
        break;
      case "bench":
        StreetPropRenderer.drawParkBench(ctx, prop.x, prop.y);
        break;
      case "bus_stop_shelter":
        StreetPropRenderer.drawBusShelter(ctx, prop.x, prop.y);
        break;
      case "mailbox":
        StreetPropRenderer.drawPostBox(ctx, prop.x, prop.y);
        break;
      case "fire_hydrant":
        StreetPropRenderer.drawFireHydrant(ctx, prop.x, prop.y);
        break;
      case "cafe_table":
        StreetPropRenderer.drawOutdoorCafeTable(ctx, prop.x, prop.y, animTime);
        break;
      case "fountain":
        StreetPropRenderer.drawFountain(ctx, prop.x, prop.y, animTime);
        break;
      case "fingerpost":
        StreetPropRenderer.drawFingerpost(ctx, prop.x, prop.y, prop.leftText || "HOSPITAL", prop.rightText || "LIBRARY");
        break;
      case "planter":
        StreetPropRenderer.drawFlowerPlanter(ctx, prop.x, prop.y);
        break;
      case "lifeguard_tower":
        StreetPropRenderer.drawLifeguardTower(ctx, prop.x, prop.y);
        break;
      case "street_name_sign":
        StreetPropRenderer.drawStreetNameSign(ctx, prop.x, prop.y, prop.streetName || "Oxford Street");
        break;
      case "road_sign":
        StreetPropRenderer.drawRoadSign(ctx, prop.x, prop.y, prop.signType || "STOP");
        break;
      case "manhole":
        StreetPropRenderer.drawManhole(ctx, prop.x, prop.y);
        break;
      case "storm_drain":
        StreetPropRenderer.drawStormDrain(ctx, prop.x, prop.y);
        break;
      default:
        if (prop.type === "atm") {
          ctx.save();
          ctx.fillStyle = "#334155";
          ctx.fillRect(prop.x - 10, prop.y - 22, 20, 22);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(prop.x - 7, prop.y - 19, 14, 8);
          ctx.fillStyle = "#facc15";
          ctx.font = "bold 6px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("ATM", prop.x, prop.y - 4);
          ctx.restore();
        } else if (prop.type === "traffic_light") {
          const lightState = prop.state || "green";
          ctx.save();
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(prop.x - 6, prop.y - 28, 12, 28);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 1;
          ctx.strokeRect(prop.x - 6, prop.y - 28, 12, 28);

          ctx.fillStyle = lightState === "red" ? "#ef4444" : "#450a0a";
          ctx.beginPath();
          ctx.arc(prop.x, prop.y - 22, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = lightState === "yellow" ? "#facc15" : "#422006";
          ctx.beginPath();
          ctx.arc(prop.x, prop.y - 14, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = lightState === "green" ? "#22c55e" : "#052e16";
          ctx.beginPath();
          ctx.arc(prop.x, prop.y - 6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;
    }
  }

  /**
   * Draws interactive environmental vocabulary objects
   */
  public static drawEnvironmentalObject(
    ctx: CanvasRenderingContext2D,
    obj: EnvironmentalLearningObject,
    animTime: number,
    isNearPlayer: boolean
  ): void {
    StreetPropRenderer.drawEnvironmentalLearningObject(ctx, obj, animTime, isNearPlayer);
  }

  /**
   * Draws realistic vehicles
   */
  public static drawVehicle(
    ctx: CanvasRenderingContext2D,
    v: SimulatedVehicle,
    animTime: number,
    timeOfDay: TimeOfDay
  ): void {
    VehicleRenderer.drawVehicle(ctx, v, animTime, timeOfDay);
  }

  /**
   * Draws player avatar with walk cycle and CEFR level badge
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
    const angle =
      facing === "right"
        ? 0
        : facing === "down"
        ? Math.PI / 2
        : facing === "left"
        ? Math.PI
        : -Math.PI / 2;

    PedestrianRenderer.drawPlayer(
      ctx,
      x,
      y,
      angle,
      isWalking,
      animTime,
      {
        id: "player",
        name: playerName,
        avatarColor,
        level: level as any,
      } as any
    );
  }

  /**
   * Draws NPC character
   */
  public static drawNPC(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    x: number,
    y: number,
    animTime: number,
    isNearPlayer: boolean
  ): void {
    PedestrianRenderer.drawNPC(ctx, npc, x, y, animTime, isNearPlayer);
  }

  /**
   * Draws wandering pedestrian
   */
  public static drawPedestrian(
    ctx: CanvasRenderingContext2D,
    ped: SimulatedPedestrian,
    animTime: number
  ): void {
    PedestrianRenderer.drawPedestrian(ctx, ped, animTime);
  }

  /**
   * Draws atmospheric day/night and weather overlays (golden hour tint, night darkness mask, rain fog)
   */
  public static drawAtmosphericOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeOfDay: TimeOfDay,
    weather: WeatherType
  ): void {
    ctx.save();

    // 1. Time-of-Day Atmospheric Color Grading
    if (timeOfDay === "night") {
      ctx.fillStyle = "rgba(10, 15, 30, 0.45)"; // Deep Midnight Tint
      ctx.fillRect(0, 0, width, height);
    } else if (timeOfDay === "evening") {
      ctx.fillStyle = "rgba(251, 146, 60, 0.12)"; // Golden Sunset Amber
      ctx.fillRect(0, 0, width, height);
    } else if (timeOfDay === "morning") {
      ctx.fillStyle = "rgba(253, 224, 71, 0.06)"; // Crisp Morning Sun
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Weather Atmospheres
    if (weather === "foggy") {
      ctx.fillStyle = "rgba(203, 213, 225, 0.25)";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}

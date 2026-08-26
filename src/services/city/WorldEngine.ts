import {
  DistrictData,
  BuildingData,
  RoomData,
  CitySign,
  DistrictId,
  InteractiveObject,
} from "../../types";
import { WORLD_DISTRICTS } from "../../content/districts/worldData";
import { ENVIRONMENTAL_SIGNS } from "../../content/signs/environmentalSigns";
import { REAL_WORLD_TASKS } from "../../content/tasks/realWorldTasks";

export class WorldEngine {
  /**
   * Retrieves all districts
   */
  public static getAllDistricts(): DistrictData[] {
    return WORLD_DISTRICTS;
  }

  /**
   * Retrieves a single district by its ID
   */
  public static getDistrictById(districtId: DistrictId): DistrictData | undefined {
    return WORLD_DISTRICTS.find((d) => d.id === districtId);
  }

  /**
   * Retrieves all buildings across all districts or filtered by district
   */
  public static getBuildings(districtId?: DistrictId): BuildingData[] {
    const districts = districtId
      ? WORLD_DISTRICTS.filter((d) => d.id === districtId)
      : WORLD_DISTRICTS;

    const buildings: BuildingData[] = [];
    districts.forEach((d) => {
      d.neighborhoods.forEach((nh) => {
        nh.streets.forEach((st) => {
          buildings.push(...st.buildings);
        });
      });
    });
    return buildings;
  }

  /**
   * Finds a building by its ID
   */
  public static getBuildingById(buildingId: string): BuildingData | undefined {
    for (const district of WORLD_DISTRICTS) {
      for (const neighborhood of district.neighborhoods) {
        for (const street of neighborhood.streets) {
          const match = street.buildings.find((b) => b.id === buildingId);
          if (match) return match;
        }
      }
    }
    return undefined;
  }

  /**
   * Finds all rooms in a given building
   */
  public static getRoomsInBuilding(buildingId: string): RoomData[] {
    const building = this.getBuildingById(buildingId);
    if (!building) return [];

    const rooms: RoomData[] = [];
    building.floors.forEach((floor) => {
      rooms.push(...floor.rooms);
    });
    return rooms;
  }

  /**
   * Finds all signs for a district (both street level and inside buildings)
   */
  public static getSignsForDistrict(districtId: DistrictId): CitySign[] {
    return ENVIRONMENTAL_SIGNS.filter((s) => s.districtId === districtId);
  }

  /**
   * Converts all modular BuildingData records into unified CityLocation objects
   */
  public static getCityLocations(districtId?: DistrictId): import("../../types").CityLocation[] {
    const buildings = this.getBuildings(districtId);
    return buildings.map((b) => {
      const allObjects: InteractiveObject[] = [];
      const npcIds: string[] = [];

      b.floors.forEach((f) => {
        f.rooms.forEach((r) => {
          allObjects.push(...r.interactiveObjects);
          npcIds.push(...r.npcsHere);
        });
      });

      return {
        id: b.id,
        name: b.name,
        districtId: b.districtId,
        category: b.templateType,
        description: b.exteriorDescription,
        icon: b.icon,
        color: b.color,
        x: b.canvasX,
        y: b.canvasY,
        canvasX: b.canvasX,
        canvasY: b.canvasY,
        npcs: Array.from(new Set(npcIds)),
        interactiveObjects: allObjects,
        unlocked: b.unlocked,
        minLevel: b.minLevel,
        interiorTheme: b.templateType,
      };
    });
  }
}

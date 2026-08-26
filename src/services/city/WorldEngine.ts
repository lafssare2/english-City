import {
  DistrictData,
  BuildingData,
  RoomData,
  CitySign,
  DistrictId,
  InteractiveObject,
  CityLocation,
  NeighborhoodData,
  StreetData,
} from "../../types";
import { WORLD_DISTRICTS } from "../../content/districts/worldData";
import { ENVIRONMENTAL_SIGNS } from "../../content/signs/environmentalSigns";
import { REAL_WORLD_TASKS } from "../../content/tasks/realWorldTasks";

export class WorldEngine {
  // Pre-indexed fast lookup hash maps
  private static districtsById = new Map<string, DistrictData>();
  private static neighborhoodsById = new Map<string, NeighborhoodData>();
  private static streetsById = new Map<string, StreetData>();
  private static buildingsById = new Map<string, BuildingData>();
  private static roomsById = new Map<string, RoomData>();
  private static signsByDistrict = new Map<DistrictId, CitySign[]>();
  private static locationsByDistrict = new Map<string, CityLocation[]>();
  private static allLocationsCache: CityLocation[] | null = null;
  private static isInitialized = false;

  private static initializeIndices(): void {
    if (this.isInitialized) return;

    // 1. Index Districts, Neighborhoods, Streets, Buildings, and Rooms
    for (const district of WORLD_DISTRICTS) {
      this.districtsById.set(district.id, district);

      for (const neighborhood of district.neighborhoods) {
        this.neighborhoodsById.set(neighborhood.id, neighborhood);

        for (const street of neighborhood.streets) {
          this.streetsById.set(street.id, street);

          for (const building of street.buildings) {
            this.buildingsById.set(building.id, building);

            for (const floor of building.floors) {
              for (const room of floor.rooms) {
                this.roomsById.set(room.id, room);
              }
            }
          }
        }
      }
    }

    // 2. Index Environmental Signs by District
    for (const sign of ENVIRONMENTAL_SIGNS) {
      const existing = this.signsByDistrict.get(sign.districtId) || [];
      existing.push(sign);
      this.signsByDistrict.set(sign.districtId, existing);
    }

    this.isInitialized = true;
  }

  /**
   * Retrieves all districts
   */
  public static getAllDistricts(): DistrictData[] {
    return WORLD_DISTRICTS;
  }

  /**
   * Retrieves a single district by its ID (O(1) lookup)
   */
  public static getDistrictById(districtId: DistrictId): DistrictData | undefined {
    this.initializeIndices();
    return this.districtsById.get(districtId) || WORLD_DISTRICTS.find((d) => d.id === districtId);
  }

  /**
   * Retrieves all buildings or filtered by district
   */
  public static getBuildings(districtId?: DistrictId): BuildingData[] {
    this.initializeIndices();
    if (!districtId) {
      return Array.from(this.buildingsById.values());
    }
    const district = this.getDistrictById(districtId);
    if (!district) return [];

    const buildings: BuildingData[] = [];
    district.neighborhoods.forEach((nh) => {
      nh.streets.forEach((st) => {
        buildings.push(...st.buildings);
      });
    });
    return buildings;
  }

  /**
   * Finds a building by its ID (O(1) lookup)
   */
  public static getBuildingById(buildingId: string): BuildingData | undefined {
    this.initializeIndices();
    return this.buildingsById.get(buildingId);
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
   * Finds a room by ID (O(1) lookup)
   */
  public static getRoomById(roomId: string): RoomData | undefined {
    this.initializeIndices();
    return this.roomsById.get(roomId);
  }

  /**
   * Finds all signs for a district (O(1) lookup)
   */
  public static getSignsForDistrict(districtId: DistrictId): CitySign[] {
    this.initializeIndices();
    return this.signsByDistrict.get(districtId) || [];
  }

  /**
   * Converts all modular BuildingData records into unified CityLocation objects with caching
   */
  public static getCityLocations(districtId?: DistrictId): CityLocation[] {
    this.initializeIndices();

    if (districtId) {
      const cached = this.locationsByDistrict.get(districtId);
      if (cached) return cached;
    } else if (this.allLocationsCache) {
      return this.allLocationsCache;
    }

    const buildings = this.getBuildings(districtId);
    const locations: CityLocation[] = buildings.map((b) => {
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

    if (districtId) {
      this.locationsByDistrict.set(districtId, locations);
    } else {
      this.allLocationsCache = locations;
    }

    return locations;
  }
}

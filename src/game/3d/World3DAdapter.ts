import { DistrictId, TimeOfDay } from "../../types";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * World3DAdapter converts 2D city coordinates (0-1000 space)
 * into 3D world space coordinates centered at origin (X: -50 to +50, Z: -50 to +50).
 */
export class World3DAdapter {
  public static readonly WORLD_SCALE = 0.1; // 1000px -> 100 3D units (-50 to +50)
  public static readonly WORLD_OFFSET_X = -50;
  public static readonly WORLD_OFFSET_Z = -50;

  /**
   * Converts a 2D point (x: 0..1000, y: 0..1000) to 3D world coordinates (x, y=0, z).
   */
  public static to3D(canvasX: number, canvasY: number, elevation: number = 0): Vector3D {
    return {
      x: (canvasX / 1000) * 100 + this.WORLD_OFFSET_X,
      y: elevation,
      z: (canvasY / 1000) * 100 + this.WORLD_OFFSET_Z,
    };
  }

  /**
   * Converts 3D world coordinates back to 2D canvas coordinates (0..1000).
   */
  public static to2D(worldX: number, worldZ: number): { x: number; y: number } {
    return {
      x: ((worldX - this.WORLD_OFFSET_X) / 100) * 1000,
      y: ((worldZ - this.WORLD_OFFSET_Z) / 100) * 1000,
    };
  }

  /**
   * Converts 2D width/height to 3D dimensions.
   */
  public static scale2Dto3D(size: number): number {
    return (size / 1000) * 100;
  }
}

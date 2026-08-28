import * as THREE from "three";
import { TimeOfDay } from "../../../types";

export class CityMaterials3D {
  private static asphaltTexture: THREE.CanvasTexture | null = null;
  private static sidewalkTexture: THREE.CanvasTexture | null = null;
  private static grassTexture: THREE.CanvasTexture | null = null;
  private static brickTexture: THREE.CanvasTexture | null = null;

  public static getAsphaltTexture(): THREE.CanvasTexture {
    if (!this.asphaltTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 128, 128);
      // Subtle tarmac speckle
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        ctx.fillRect(x, y, 2, 2);
      }
      this.asphaltTexture = new THREE.CanvasTexture(canvas);
      this.asphaltTexture.wrapS = THREE.RepeatWrapping;
      this.asphaltTexture.wrapT = THREE.RepeatWrapping;
      this.asphaltTexture.repeat.set(8, 8);
    }
    return this.asphaltTexture;
  }

  public static getSidewalkTexture(): THREE.CanvasTexture {
    if (!this.sidewalkTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 64, 64);
      // Tile joints
      ctx.strokeStyle = "rgba(15, 23, 42, 0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 64, 64);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeRect(2, 2, 60, 60);
      this.sidewalkTexture = new THREE.CanvasTexture(canvas);
      this.sidewalkTexture.wrapS = THREE.RepeatWrapping;
      this.sidewalkTexture.wrapT = THREE.RepeatWrapping;
      this.sidewalkTexture.repeat.set(16, 16);
    }
    return this.sidewalkTexture;
  }

  public static getGrassTexture(): THREE.CanvasTexture {
    if (!this.grassTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#14532d";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "rgba(22, 101, 52, 0.6)";
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        ctx.fillRect(x, y, 3, 3);
      }
      this.grassTexture = new THREE.CanvasTexture(canvas);
      this.grassTexture.wrapS = THREE.RepeatWrapping;
      this.grassTexture.wrapT = THREE.RepeatWrapping;
      this.grassTexture.repeat.set(12, 12);
    }
    return this.grassTexture;
  }

  public static getBrickTexture(): THREE.CanvasTexture {
    if (!this.brickTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 1.5;
      for (let y = 0; y < 64; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(64, y);
        ctx.stroke();
      }
      this.brickTexture = new THREE.CanvasTexture(canvas);
      this.brickTexture.wrapS = THREE.RepeatWrapping;
      this.brickTexture.wrapT = THREE.RepeatWrapping;
      this.brickTexture.repeat.set(4, 4);
    }
    return this.brickTexture;
  }

  // Pre-configured shared materials for high performance
  public static asphaltMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.1,
  });

  public static sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.75,
    metalness: 0.05,
  });

  public static curbMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.6,
  });

  public static grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.9,
  });

  public static glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75,
  });

  public static glowingWindowMaterial = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  public static darkWindowMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.5,
  });

  public static roadMarkingWhite = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  public static roadMarkingYellow = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
  });

  public static waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.85,
  });

  public static sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xfcd34d,
    roughness: 0.95,
  });

  public static woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.7,
  });
}

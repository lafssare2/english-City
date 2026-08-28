import * as THREE from "three";

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();

  // Oblique 3rd Quarter View Settings
  public pitchAngle: number = (68 * Math.PI) / 180; // 68 degrees tilt
  public baseDistance: number = 32;
  public zoom: number = 1.0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    this.camera.position.set(0, 30, 25);
    this.camera.lookAt(0, 0, 0);
  }

  public update(playerPos: THREE.Vector3, delta: number = 0.016): void {
    const dist = this.baseDistance / this.zoom;
    const height = dist * Math.sin(this.pitchAngle);
    const depth = dist * Math.cos(this.pitchAngle);

    this.targetPosition.set(playerPos.x, playerPos.y + height, playerPos.z + depth);

    // Smooth lerp camera tracking
    this.currentPosition.lerp(this.targetPosition, 0.08);
    this.camera.position.copy(this.currentPosition);

    const lookTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1.2, playerPos.z);
    this.camera.lookAt(lookTarget);
  }

  public setZoom(zoomLevel: number): void {
    this.zoom = Math.max(0.6, Math.min(1.6, zoomLevel));
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

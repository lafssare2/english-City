import * as THREE from "three";

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3(0, 18, 10);
  private lookTarget = new THREE.Vector3();

  // GTA-style oblique third-quarter camera.
  public pitchAngle = (68 * Math.PI) / 180;
  public baseDistance = 32;
  public zoom = 1.0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(0, 0, 0);
  }

  public update(playerPos: THREE.Vector3, delta = 0.016): void {
    const safeDelta = Math.min(Math.max(delta, 0.001), 0.05);
    const dist = this.baseDistance / this.zoom;
    const height = dist * Math.sin(this.pitchAngle);
    const depth = dist * Math.cos(this.pitchAngle);

    this.targetPosition.set(playerPos.x, playerPos.y + height, playerPos.z + depth);

    // Frame-rate independent camera damping.
    const smoothing = 1 - Math.exp(-8 * safeDelta);
    this.currentPosition.lerp(this.targetPosition, smoothing);
    this.camera.position.copy(this.currentPosition);

    this.lookTarget.set(playerPos.x, playerPos.y + 1.2, playerPos.z);
    this.camera.lookAt(this.lookTarget);
  }

  public setZoom(zoomLevel: number): void {
    this.zoom = Math.max(0.65, Math.min(1.55, zoomLevel));
  }

  public resize(width: number, height: number): void {
    if (height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

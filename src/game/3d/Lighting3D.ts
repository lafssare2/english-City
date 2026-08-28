import * as THREE from "three";
import { TimeOfDay } from "../../types";

export class Lighting3D {
  public group: THREE.Group;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fog: THREE.FogExp2;

  constructor(scene: THREE.Scene, timeOfDay: TimeOfDay = "afternoon") {
    this.group = new THREE.Group();
    this.group.name = "LightingGroup";

    // 1. Hemisphere Ambient Light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.6);
    this.group.add(this.hemiLight);

    // 2. Main Directional Sunlight with Soft PCF Shadows
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 150;
    this.dirLight.shadow.camera.left = -55;
    this.dirLight.shadow.camera.right = 55;
    this.dirLight.shadow.camera.top = 55;
    this.dirLight.shadow.camera.bottom = -55;
    this.dirLight.shadow.bias = -0.0005;
    this.group.add(this.dirLight);

    // 3. Distance Fog
    this.fog = new THREE.FogExp2(0x0f172a, 0.006);
    scene.fog = this.fog;

    this.updateTimeOfDay(timeOfDay, scene);
  }

  public updateTimeOfDay(timeOfDay: TimeOfDay, scene: THREE.Scene): void {
    switch (timeOfDay) {
      case "morning":
        this.dirLight.color.setHex(0xffedd5); // Warm morning glow
        this.dirLight.intensity = 1.3;
        this.dirLight.position.set(-40, 50, -30);
        this.hemiLight.color.setHex(0xffedd5);
        this.hemiLight.groundColor.setHex(0x334155);
        this.hemiLight.intensity = 0.6;
        scene.background = new THREE.Color(0xdbeafe);
        this.fog.color.setHex(0xdbeafe);
        break;

      case "afternoon":
        this.dirLight.color.setHex(0xffffff);
        this.dirLight.intensity = 1.4;
        this.dirLight.position.set(20, 60, 20);
        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0x1e293b);
        this.hemiLight.intensity = 0.7;
        scene.background = new THREE.Color(0x93c5fd);
        this.fog.color.setHex(0x93c5fd);
        break;

      case "evening":
        this.dirLight.color.setHex(0xf97316); // Amber Golden Hour
        this.dirLight.intensity = 1.5;
        this.dirLight.position.set(50, 30, 40);
        this.hemiLight.color.setHex(0xfb923c);
        this.hemiLight.groundColor.setHex(0x1e1b4b);
        this.hemiLight.intensity = 0.5;
        scene.background = new THREE.Color(0x431407);
        this.fog.color.setHex(0x431407);
        break;

      case "night":
        this.dirLight.color.setHex(0x38bdf8); // Cool moonlight
        this.dirLight.intensity = 0.3;
        this.dirLight.position.set(10, 45, -10);
        this.hemiLight.color.setHex(0x1e293b);
        this.hemiLight.groundColor.setHex(0x020617);
        this.hemiLight.intensity = 0.25;
        scene.background = new THREE.Color(0x020617);
        this.fog.color.setHex(0x020617);
        break;
    }
  }
}

import * as THREE from "three";
import { PlayerProfile, TimeOfDay } from "../../types";
import { World3DAdapter } from "./World3DAdapter";

export class Player3D {
  public mesh: THREE.Group;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private flashlight: THREE.SpotLight | null = null;
  private indicator: THREE.Sprite | null = null;

  constructor(playerProfile?: PlayerProfile | null) {
    this.mesh = new THREE.Group();
    this.mesh.name = "PlayerCharacter";

    const jacketColor = playerProfile?.avatarColor || "#2563eb";

    // 1. Shoes
    const shoeGeo = new THREE.BoxGeometry(0.35, 0.25, 0.6);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // 2. Legs / Trousers
    const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.32);
    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    this.leftLeg = new THREE.Mesh(legGeo, trouserMat);
    this.leftLeg.position.set(-0.24, 0.45, 0);
    this.leftLeg.castShadow = true;
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.35, 0.1);
    this.leftLeg.add(leftShoe);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, trouserMat);
    this.rightLeg.position.set(0.24, 0.45, 0);
    this.rightLeg.castShadow = true;
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.35, 0.1);
    this.rightLeg.add(rightShoe);
    this.mesh.add(this.rightLeg);

    // 3. Torso / Jacket
    const torsoGeo = new THREE.BoxGeometry(0.85, 1.1, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(jacketColor),
      roughness: 0.6,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.45, 0);
    torso.castShadow = true;
    this.mesh.add(torso);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const leftArm = new THREE.Mesh(armGeo, torsoMat);
    leftArm.position.set(-0.55, 1.4, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, torsoMat);
    rightArm.position.set(0.55, 1.4, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);

    // 5. Head & Face
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 2.3, 0);
    head.castShadow = true;
    this.mesh.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 2.35, 0);
    hair.castShadow = true;
    this.mesh.add(hair);

    // 6. Flashlight for night exploration
    this.flashlight = new THREE.SpotLight(0xfef08a, 0, 15, Math.PI / 6, 0.3, 1);
    this.flashlight.position.set(0, 1.4, 0.3);
    this.flashlight.target.position.set(0, 0.5, 6);
    this.mesh.add(this.flashlight);
    this.mesh.add(this.flashlight.target);

    // 7. Subtle floating "YOU" text indicator
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.roundRect(14, 12, 100, 40, 10);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOU", 64, 32);

    const spriteTex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true });
    this.indicator = new THREE.Sprite(spriteMat);
    this.indicator.position.set(0, 3.2, 0);
    this.indicator.scale.set(2, 1, 1);
    this.mesh.add(this.indicator);
  }

  public update(
    canvasX: number,
    canvasY: number,
    facing: "left" | "right" | "up" | "down",
    isMoving: boolean,
    animTime: number,
    timeOfDay: TimeOfDay
  ): void {
    const p3D = World3DAdapter.to3D(canvasX, canvasY, 0);
    this.mesh.position.set(p3D.x, 0, p3D.z);

    // Directional Facing Angle
    let targetAngle = 0;
    if (facing === "down") targetAngle = 0;
    else if (facing === "up") targetAngle = Math.PI;
    else if (facing === "left") targetAngle = -Math.PI / 2;
    else if (facing === "right") targetAngle = Math.PI / 2;

    this.mesh.rotation.y = targetAngle;

    // Walk Stride Animation
    if (isMoving) {
      const stride = Math.sin(animTime * 0.012) * 0.4;
      this.leftLeg.rotation.x = stride;
      this.rightLeg.rotation.x = -stride;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    // Flashlight Toggle
    if (this.flashlight) {
      this.flashlight.intensity = timeOfDay === "night" ? 2.5 : timeOfDay === "evening" ? 1.2 : 0;
    }
  }
}

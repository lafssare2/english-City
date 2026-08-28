import * as THREE from "three";
import { NPC, CityLocation, TimeOfDay } from "../../types";
import { World3DAdapter } from "./World3DAdapter";

export class NPCSystem3D {
  public static createNPCGroup(npcs: NPC[], locations: CityLocation[]): THREE.Group {
    const group = new THREE.Group();
    group.name = "NPCGroup";

    for (const npc of npcs) {
      const loc = locations.find((l) => l.id === npc.locationId) || locations[0];
      const npcX = loc ? loc.canvasX + 25 : 500;
      const npcY = loc ? loc.canvasY + 65 : 500;
      const npcMesh = this.createSingleNPC(npc, npcX, npcY);
      group.add(npcMesh);
    }

    return group;
  }

  public static createSingleNPC(npc: NPC, canvasX: number, canvasY: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `NPC_${npc.id}`;

    const p3D = World3DAdapter.to3D(canvasX, canvasY, 0);
    group.position.set(p3D.x, 0, p3D.z);

    const outfitColor = npc.avatarColor || "#0284c7";
    const role = (npc.occupation || "").toLowerCase();

    // 1. Shoes
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), shoeMat);
    leftShoe.position.set(-0.2, 0.1, 0);
    leftShoe.castShadow = true;
    group.add(leftShoe);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), shoeMat);
    rightShoe.position.set(0.2, 0.1, 0);
    rightShoe.castShadow = true;
    group.add(rightShoe);

    // 2. Legs / Trousers
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.28), legMat);
    leftLeg.position.set(-0.2, 0.55, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.28), legMat);
    rightLeg.position.set(0.2, 0.55, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // 3. Torso / Attire
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfitColor),
      roughness: 0.7,
    });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.45), torsoMat);
    torso.position.set(0, 1.45, 0);
    torso.castShadow = true;
    group.add(torso);

    // Role-specific apron/coat overlays
    if (role.includes("doctor") || role.includes("nurse")) {
      const coat = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.95, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
      );
      coat.position.set(0, 1.45, 0);
      group.add(coat);
    } else if (role.includes("barista") || role.includes("waiter") || role.includes("chef")) {
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.65, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
      );
      apron.position.set(0, 1.25, 0);
      group.add(apron);
    }

    // 4. Head & Face
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.7 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), headMat);
    head.position.set(0, 2.25, 0);
    head.castShadow = true;
    group.add(head);

    // Hair / Cap
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.37, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      hairMat
    );
    hair.position.set(0, 2.3, 0);
    hair.castShadow = true;
    group.add(hair);

    // 5. Name & Occupation Floating Billboard Badge
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.roundRect(10, 10, 236, 60, 12);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(npc.name, 128, 38);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px sans-serif";
    ctx.fillText(npc.occupation || "Citizen", 128, 58);

    const spriteTex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true });
    const badge = new THREE.Sprite(spriteMat);
    badge.position.set(0, 3.2, 0);
    badge.scale.set(3, 1, 1);
    group.add(badge);

    return group;
  }
}

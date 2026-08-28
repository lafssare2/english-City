import * as THREE from "three";
import { DistrictId, TimeOfDay } from "../../types";

export class SignSystem3D {
  public static createDistrictSigns(districtId: DistrictId): THREE.Group {
    const group = new THREE.Group();
    group.name = "SignsGroup";

    // 1. Road Signs along road edges
    group.add(this.createSignPost(-12, 6.5, "SPEED LIMIT\n30", "white", "circle"));
    group.add(this.createSignPost(12, -6.5, "PEDESTRIAN\nCROSSING", "blue", "square"));
    group.add(this.createSignPost(-24, 6.5, "STOP", "red", "octagon"));
    group.add(this.createSignPost(24, -6.5, "BUS\nSTOP", "blue", "square"));
    group.add(this.createSignPost(0, 6.5, "ONE WAY", "blue", "rectangle"));

    return group;
  }

  public static createSignPost(
    x: number,
    z: number,
    text: string,
    color: "red" | "blue" | "white",
    shape: "circle" | "square" | "octagon" | "rectangle"
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Metal Post
    const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), postMat);
    post.position.set(0, 1.2, 0);
    post.castShadow = true;
    group.add(post);

    // Sign Face Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    if (color === "red") {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 120, 120);
      ctx.fillStyle = "#ffffff";
    } else if (color === "blue") {
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 120, 120);
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(64, 64, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
    }

    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = text.split("\n");
    if (lines.length === 1) {
      ctx.fillText(lines[0], 64, 64);
    } else {
      ctx.fillText(lines[0], 64, 50);
      ctx.fillText(lines[1], 64, 76);
    }

    const signTexture = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.3,
    });

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.06), signMat);
    signBoard.position.set(0, 2.2, 0);
    signBoard.castShadow = true;
    group.add(signBoard);

    return group;
  }
}

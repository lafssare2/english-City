import * as THREE from "three";
import { DistrictId, TimeOfDay } from "../../types";
import { World3DAdapter } from "./World3DAdapter";
import { CityMaterials3D } from "./materials/CityMaterials3D";

export class StreetFurniture3D {
  public static createDistrictProps(
    districtId: DistrictId,
    timeOfDay: TimeOfDay = "afternoon"
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "StreetFurnitureGroup";

    const isNight = timeOfDay === "night";

    // 1. Street Lamps (Four corners of central avenues)
    const lampPositions = [
      [-28, -8],
      [28, -8],
      [-28, 8],
      [28, 8],
      [-12, -26],
      [12, -26],
      [-12, 26],
      [12, 26],
    ];

    for (const [lx, lz] of lampPositions) {
      const lamp = this.createStreetLamp(lx, lz, isNight);
      group.add(lamp);
    }

    // 2. Red Royal Mail Post Box
    const postBox = this.createPostBox(8, 6.5);
    group.add(postBox);

    // 3. Victorian Park Benches
    const benchPositions = [
      [-16, 6.8, 0],
      [16, 6.8, 0],
      [-16, -6.8, Math.PI],
      [16, -6.8, Math.PI],
    ];

    for (const [bx, bz, rot] of benchPositions) {
      const bench = this.createBench(bx, bz, rot);
      group.add(bench);
    }

    // 4. Metropolitan Trees (Foliage canopy + trunk)
    const treePositions = [
      [-36, -22],
      [-36, 22],
      [36, -22],
      [36, 22],
      [-22, -36],
      [22, -36],
      [-22, 36],
      [22, 36],
    ];

    for (const [tx, tz] of treePositions) {
      const tree = this.createTree(tx, tz);
      group.add(tree);
    }

    // 5. Bus Stop Shelter
    const busShelter = this.createBusShelter(24, 7);
    group.add(busShelter);

    return group;
  }

  public static createStreetLamp(x: number, z: number, isNight: boolean): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    // Base & Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 4.5, 8), metalMat);
    post.position.set(0, 2.25, 0);
    post.castShadow = true;
    group.add(post);

    // Arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), metalMat);
    arm.position.set(0.4, 4.4, 0);
    arm.rotation.z = -Math.PI / 4;
    group.add(arm);

    // Lantern Fixture
    const lampMat = new THREE.MeshBasicMaterial({
      color: isNight ? 0xfef08a : 0xffffff,
    });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.4, 6), lampMat);
    lantern.position.set(0.8, 4.2, 0);
    group.add(lantern);

    if (isNight) {
      const pointLight = new THREE.PointLight(0xfef08a, 1.5, 12);
      pointLight.position.set(0.8, 4.0, 0);
      group.add(pointLight);
    }

    return group;
  }

  public static createPostBox(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // Red Pillar Box
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16), redMat);
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    group.add(body);

    // Domed Cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    cap.position.set(0, 1.3, 0);
    group.add(cap);

    // Black Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.15, 16), blackMat);
    base.position.set(0, 0.08, 0);
    group.add(base);

    return group;
  }

  public static createBench(x: number, z: number, rotation: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const woodMat = CityMaterials3D.woodMaterial;
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });

    // Seat Slats
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.6), woodMat);
    seat.position.set(0, 0.5, 0);
    seat.castShadow = true;
    group.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), woodMat);
    back.position.set(0, 0.85, -0.28);
    back.castShadow = true;
    group.add(back);

    // Iron Legs
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), ironMat);
    leg1.position.set(-0.9, 0.25, 0);
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), ironMat);
    leg2.position.set(0.9, 0.25, 0);
    group.add(leg2);

    return group;
  }

  public static createTree(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.2, 8), trunkMat);
    trunk.position.set(0, 1.6, 0);
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage Canopy (Multi-layered spheres)
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12), foliageMat);
    c1.position.set(0, 3.8, 0);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), foliageMat);
    c2.position.set(0.6, 4.4, 0.4);
    c2.castShadow = true;
    group.add(c2);

    return group;
  }

  public static createBusShelter(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
    const glassMat = CityMaterials3D.glassMaterial;

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 1.8), metalMat);
    roof.position.set(0, 2.6, 0);
    roof.castShadow = true;
    group.add(roof);

    // Back Glass Pane
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.3, 0.08), glassMat);
    backGlass.position.set(0, 1.3, -0.8);
    group.add(backGlass);

    // Side Glass Panes
    const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 1.6), glassMat);
    side1.position.set(-1.6, 1.3, 0);
    group.add(side1);

    const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 1.6), glassMat);
    side2.position.set(1.6, 1.3, 0);
    group.add(side2);

    // Metal Posts
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), metalMat);
    p1.position.set(-1.6, 1.3, 0.8);
    group.add(p1);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), metalMat);
    p2.position.set(1.6, 1.3, 0.8);
    group.add(p2);

    return group;
  }
}

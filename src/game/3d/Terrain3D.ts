import * as THREE from "three";
import { DistrictId, TimeOfDay } from "../../types";
import { CityMaterials3D } from "./materials/CityMaterials3D";
import { World3DAdapter } from "./World3DAdapter";

export class Terrain3D {
  public static createDistrictTerrain(districtId: DistrictId): THREE.Group {
    const group = new THREE.Group();
    group.name = "TerrainGroup";

    // 1. Base Terrain Ground Plane (100 x 100 units)
    const baseGeo = new THREE.PlaneGeometry(100, 100);
    baseGeo.rotateX(-Math.PI / 2);

    let baseMat: THREE.Material = CityMaterials3D.sidewalkMaterial;

    if (districtId === "beach") {
      // Beach district: Promenade, Sand Dune, and Ocean Water
      const promGeo = new THREE.PlaneGeometry(100, 30);
      promGeo.rotateX(-Math.PI / 2);
      const promMesh = new THREE.Mesh(promGeo, CityMaterials3D.sidewalkMaterial);
      promMesh.position.set(0, 0, -35);
      promMesh.receiveShadow = true;
      group.add(promMesh);

      // Wooden Boardwalk
      const boardGeo = new THREE.PlaneGeometry(100, 10);
      boardGeo.rotateX(-Math.PI / 2);
      const boardMesh = new THREE.Mesh(boardGeo, CityMaterials3D.woodMaterial);
      boardMesh.position.set(0, 0.05, -15);
      boardMesh.receiveShadow = true;
      group.add(boardMesh);

      // Sand Beach
      const sandGeo = new THREE.PlaneGeometry(100, 35);
      sandGeo.rotateX(-Math.PI / 2);
      const sandMesh = new THREE.Mesh(sandGeo, CityMaterials3D.sandMaterial);
      sandMesh.position.set(0, -0.05, 7.5);
      sandMesh.receiveShadow = true;
      group.add(sandMesh);

      // Ocean Water
      const waterGeo = new THREE.PlaneGeometry(100, 35);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMesh = new THREE.Mesh(waterGeo, CityMaterials3D.waterMaterial);
      waterMesh.position.set(0, -0.2, 37.5);
      group.add(waterMesh);

      // Pier Boardwalk
      const pierGeo = new THREE.BoxGeometry(16, 0.4, 50);
      const pierMesh = new THREE.Mesh(pierGeo, CityMaterials3D.woodMaterial);
      pierMesh.position.set(20, 0.2, 10);
      pierMesh.castShadow = true;
      pierMesh.receiveShadow = true;
      group.add(pierMesh);

      return group;
    }

    if (districtId === "university") {
      // Oxford Quad: 4 Green Quad Lawns and Central Stone Monument
      const groundMesh = new THREE.Mesh(baseGeo, CityMaterials3D.sidewalkMaterial);
      groundMesh.receiveShadow = true;
      group.add(groundMesh);

      // 4 Large Manicured Lawns
      const lawnGeo = new THREE.BoxGeometry(36, 0.15, 30);
      const lawnPositions = [
        [-24, 0.08, -24],
        [24, 0.08, -24],
        [-24, 0.08, 24],
        [24, 0.08, 24],
      ];

      for (const [lx, ly, lz] of lawnPositions) {
        const lawnMesh = new THREE.Mesh(lawnGeo, CityMaterials3D.grassMaterial);
        lawnMesh.position.set(lx, ly, lz);
        lawnMesh.receiveShadow = true;
        group.add(lawnMesh);
      }

      // Central Grand Stone Fountain
      const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8.5, 0.6, 24),
        CityMaterials3D.curbMaterial
      );
      fountainBase.position.set(0, 0.3, 0);
      fountainBase.castShadow = true;
      fountainBase.receiveShadow = true;
      group.add(fountainBase);

      const fountainWater = new THREE.Mesh(
        new THREE.CylinderGeometry(7.2, 7.2, 0.1, 24),
        CityMaterials3D.waterMaterial
      );
      fountainWater.position.set(0, 0.55, 0);
      group.add(fountainWater);

      const fountainPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 2.2, 16),
        CityMaterials3D.curbMaterial
      );
      fountainPillar.position.set(0, 1.2, 0);
      fountainPillar.castShadow = true;
      group.add(fountainPillar);

      return group;
    }

    if (districtId === "suburbs" || districtId === "residential") {
      // Suburbs: Green garden lots with walkways
      const groundMesh = new THREE.Mesh(baseGeo, CityMaterials3D.sidewalkMaterial);
      groundMesh.receiveShadow = true;
      group.add(groundMesh);

      const lawnGeo = new THREE.BoxGeometry(38, 0.1, 38);
      const lawnPositions = [
        [-26, 0.05, -26],
        [26, 0.05, -26],
        [-26, 0.05, 26],
        [26, 0.05, 26],
      ];

      for (const [lx, ly, lz] of lawnPositions) {
        const lawnMesh = new THREE.Mesh(lawnGeo, CityMaterials3D.grassMaterial);
        lawnMesh.position.set(lx, ly, lz);
        lawnMesh.receiveShadow = true;
        group.add(lawnMesh);
      }

      return group;
    }

    // Default Metropolitan / Downtown Foundation
    const groundMesh = new THREE.Mesh(baseGeo, CityMaterials3D.sidewalkMaterial);
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    return group;
  }
}

import * as THREE from "three";
import { DistrictId } from "../../types";
import { DistrictLayoutEngine } from "../../components/city/DistrictLayoutEngine";
import { CityMaterials3D } from "./materials/CityMaterials3D";
import { World3DAdapter } from "./World3DAdapter";

export class RoadSystem3D {
  public static createRoadNetwork(districtId: DistrictId): THREE.Group {
    const group = new THREE.Group();
    group.name = "RoadNetworkGroup";

    const layout = DistrictLayoutEngine.getDistrictRoadLayout(districtId, 1000, 1000);

    // 1. Asphalt Road Surfaces
    for (const road of layout.roads) {
      if (road.type === "boardwalk" || road.type === "pedestrian_paved") continue;

      const p3D = World3DAdapter.to3D(road.x + road.width / 2, road.y + road.height / 2, 0.02);
      const w3D = World3DAdapter.scale2Dto3D(road.width);
      const d3D = World3DAdapter.scale2Dto3D(road.height);

      const roadGeo = new THREE.PlaneGeometry(w3D, d3D);
      roadGeo.rotateX(-Math.PI / 2);

      const roadMesh = new THREE.Mesh(roadGeo, CityMaterials3D.asphaltMaterial);
      roadMesh.position.set(p3D.x, 0.02, p3D.z);
      roadMesh.receiveShadow = true;
      group.add(roadMesh);

      // Raised Granite Curbs (Y: 0.15)
      const curbHeight = 0.12;
      const curbWidth = 0.4;

      if (road.direction === "horizontal") {
        // Top Curb
        const topCurb = new THREE.Mesh(
          new THREE.BoxGeometry(w3D, curbHeight, curbWidth),
          CityMaterials3D.curbMaterial
        );
        topCurb.position.set(p3D.x, curbHeight / 2, p3D.z - d3D / 2);
        topCurb.castShadow = true;
        topCurb.receiveShadow = true;
        group.add(topCurb);

        // Bottom Curb
        const botCurb = new THREE.Mesh(
          new THREE.BoxGeometry(w3D, curbHeight, curbWidth),
          CityMaterials3D.curbMaterial
        );
        botCurb.position.set(p3D.x, curbHeight / 2, p3D.z + d3D / 2);
        botCurb.castShadow = true;
        botCurb.receiveShadow = true;
        group.add(botCurb);
      } else {
        // Left Curb
        const leftCurb = new THREE.Mesh(
          new THREE.BoxGeometry(curbWidth, curbHeight, d3D),
          CityMaterials3D.curbMaterial
        );
        leftCurb.position.set(p3D.x - w3D / 2, curbHeight / 2, p3D.z);
        leftCurb.castShadow = true;
        leftCurb.receiveShadow = true;
        group.add(leftCurb);

        // Right Curb
        const rightCurb = new THREE.Mesh(
          new THREE.BoxGeometry(curbWidth, curbHeight, d3D),
          CityMaterials3D.curbMaterial
        );
        rightCurb.position.set(p3D.x + w3D / 2, curbHeight / 2, p3D.z);
        rightCurb.castShadow = true;
        rightCurb.receiveShadow = true;
        group.add(rightCurb);
      }

      // Center Lane Divider Markings
      if (road.hasMarkings) {
        if (road.direction === "horizontal") {
          const dashCount = Math.floor(w3D / 3.5);
          for (let i = 0; i < dashCount; i++) {
            const dash = new THREE.Mesh(
              new THREE.PlaneGeometry(1.8, 0.25),
              CityMaterials3D.roadMarkingYellow
            );
            dash.rotateX(-Math.PI / 2);
            dash.position.set(p3D.x - w3D / 2 + i * 3.5 + 1, 0.03, p3D.z);
            group.add(dash);
          }
        } else {
          const dashCount = Math.floor(d3D / 3.5);
          for (let i = 0; i < dashCount; i++) {
            const dash = new THREE.Mesh(
              new THREE.PlaneGeometry(0.25, 1.8),
              CityMaterials3D.roadMarkingWhite
            );
            dash.rotateX(-Math.PI / 2);
            dash.position.set(p3D.x, 0.03, p3D.z - d3D / 2 + i * 3.5 + 1);
            group.add(dash);
          }
        }
      }
    }

    // 2. 3D Zebra Crosswalks
    for (const cw of layout.crosswalks) {
      const cwPos = World3DAdapter.to3D(cw.x + cw.width / 2, cw.y + cw.height / 2, 0.035);
      const cwW = World3DAdapter.scale2Dto3D(cw.width);
      const cwH = World3DAdapter.scale2Dto3D(cw.height);

      if (cw.orientation === "horizontal") {
        const stripeCount = 6;
        const stripeW = cwW / stripeCount;
        for (let s = 0; s < stripeCount; s += 2) {
          const stripe = new THREE.Mesh(
            new THREE.PlaneGeometry(stripeW, cwH),
            CityMaterials3D.roadMarkingWhite
          );
          stripe.rotateX(-Math.PI / 2);
          stripe.position.set(cwPos.x - cwW / 2 + (s + 0.5) * stripeW, 0.035, cwPos.z);
          group.add(stripe);
        }
      } else {
        const stripeCount = 6;
        const stripeH = cwH / stripeCount;
        for (let s = 0; s < stripeCount; s += 2) {
          const stripe = new THREE.Mesh(
            new THREE.PlaneGeometry(cwW, stripeH),
            CityMaterials3D.roadMarkingWhite
          );
          stripe.rotateX(-Math.PI / 2);
          stripe.position.set(cwPos.x, 0.035, cwPos.z - cwH / 2 + (s + 0.5) * stripeH);
          group.add(stripe);
        }
      }
    }

    // 3. Stop Lines
    for (const sl of layout.stopLines) {
      const slPos = World3DAdapter.to3D(sl.x + sl.width / 2, sl.y + sl.height / 2, 0.035);
      const slW = World3DAdapter.scale2Dto3D(sl.width);
      const slH = World3DAdapter.scale2Dto3D(sl.height);

      const stopLine = new THREE.Mesh(
        new THREE.PlaneGeometry(slW, slH),
        CityMaterials3D.roadMarkingWhite
      );
      stopLine.rotateX(-Math.PI / 2);
      stopLine.position.set(slPos.x, 0.035, slPos.z);
      group.add(stopLine);
    }

    return group;
  }
}

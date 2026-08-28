import * as THREE from "three";
import { TimeOfDay } from "../../types";
import { World3DAdapter } from "./World3DAdapter";
import { CityMaterials3D } from "./materials/CityMaterials3D";

export interface SimulatedVehicle3D {
  id: string;
  type: "taxi" | "car" | "bus" | "ambulance" | "delivery_van" | "police" | "fire_engine" | "bicycle";
  x: number; // in 2D canvas coords (0..1000)
  y: number;
  direction: "left" | "right";
  speed: number;
  color: string;
  isParked?: boolean;
}

export class VehicleSystem3D {
  private group: THREE.Group;
  private vehicleMeshes: Map<string, THREE.Group> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "VehiclesGroup";
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public updateVehicles(
    vehicles: SimulatedVehicle3D[],
    timeOfDay: TimeOfDay,
    animTime: number
  ): void {
    const isNight = timeOfDay === "night";
    const currentIds = new Set<string>();

    for (const v of vehicles) {
      currentIds.add(v.id);
      let mesh = this.vehicleMeshes.get(v.id);

      if (!mesh) {
        mesh = this.buildVehicleMesh(v);
        this.vehicleMeshes.set(v.id, mesh);
        this.group.add(mesh);
      }

      const p3D = World3DAdapter.to3D(v.x, v.y, 0.4);
      mesh.position.set(p3D.x, 0.2, p3D.z);
      mesh.rotation.y = v.direction === "right" ? Math.PI / 2 : -Math.PI / 2;

      // Emergency Light Flashing
      if (v.type === "ambulance" || v.type === "police") {
        const beacon = mesh.getObjectByName("EmergencyBeacon") as THREE.PointLight;
        if (beacon) {
          beacon.color.setHex(Math.sin(animTime * 0.02) > 0 ? 0xef4444 : 0x3b82f6);
        }
      }
    }

    // Cleanup removed vehicles
    for (const [id, mesh] of this.vehicleMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.group.remove(mesh);
        this.vehicleMeshes.delete(id);
      }
    }
  }

  private buildVehicleMesh(v: SimulatedVehicle3D): THREE.Group {
    const vGroup = new THREE.Group();
    vGroup.name = `Vehicle_${v.id}`;

    let length = 4.2;
    let width = 1.9;
    let height = 1.4;

    if (v.type === "bus") {
      length = 8.5;
      width = 2.4;
      height = 2.8;
    } else if (v.type === "delivery_van") {
      length = 5.2;
      width = 2.1;
      height = 2.2;
    } else if (v.type === "ambulance" || v.type === "fire_engine") {
      length = 5.0;
      width = 2.1;
      height = 2.1;
    } else if (v.type === "bicycle") {
      length = 1.8;
      width = 0.6;
      height = 1.1;
      return this.buildBicycleMesh(v);
    }

    // 1. Lower Body Chassis
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(v.color),
      roughness: 0.4,
      metalness: 0.3,
    });
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.6, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, height * 0.3 + 0.3, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    vGroup.add(bodyMesh);

    // 2. Cabin / Roof (Narrower than chassis)
    if (v.type !== "bus") {
      const cabinGeo = new THREE.BoxGeometry(width * 0.88, height * 0.5, length * 0.55);
      const cabinMesh = new THREE.Mesh(cabinGeo, bodyMat);
      cabinMesh.position.set(0, height * 0.8 + 0.3, -length * 0.05);
      cabinMesh.castShadow = true;
      vGroup.add(cabinMesh);
    }

    // 3. Glass Windshields
    const windshieldGeo = new THREE.BoxGeometry(width * 0.85, height * 0.42, length * 0.52);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, CityMaterials3D.glassMaterial);
    windshieldMesh.position.set(0, height * 0.8 + 0.3, -length * 0.05);
    vGroup.add(windshieldMesh);

    // 4. Wheels with Rims
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const wheelOffsets = [
      [-width / 2, 0.35, length * 0.3],
      [width / 2, 0.35, length * 0.3],
      [-width / 2, 0.35, -length * 0.3],
      [width / 2, 0.35, -length * 0.3],
    ];

    for (const [wx, wy, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      vGroup.add(wheel);
    }

    // 5. Headlights & Taillights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), lightMat);
    leftHeadlight.position.set(-width * 0.35, height * 0.4, length / 2 + 0.02);
    vGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), lightMat);
    rightHeadlight.position.set(width * 0.35, height * 0.4, length / 2 + 0.02);
    vGroup.add(rightHeadlight);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), tailMat);
    leftTail.position.set(-width * 0.35, height * 0.4, -length / 2 - 0.02);
    vGroup.add(leftTail);

    const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), tailMat);
    rightTail.position.set(width * 0.35, height * 0.4, -length / 2 - 0.02);
    vGroup.add(rightTail);

    // 6. Type-Specific Accessories
    if (v.type === "taxi") {
      // Taxi Roof Sign
      const taxiSignMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: 0.6,
      });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.3), taxiSignMat);
      taxiSign.position.set(0, height + 0.45, 0);
      vGroup.add(taxiSign);
    } else if (v.type === "ambulance" || v.type === "police") {
      // Emergency Beacon
      const beaconLight = new THREE.PointLight(0xef4444, 2, 8);
      beaconLight.name = "EmergencyBeacon";
      beaconLight.position.set(0, height + 0.5, 0);
      vGroup.add(beaconLight);

      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.25, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beaconMesh.position.set(0, height + 0.4, 0);
      vGroup.add(beaconMesh);
    }

    return vGroup;
  }

  private buildBicycleMesh(v: SimulatedVehicle3D): THREE.Group {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(v.color) });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    // Wheels
    const wGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 16);
    wGeo.rotateY(Math.PI / 2);
    const frontW = new THREE.Mesh(wGeo, wheelMat);
    frontW.position.set(0, 0.35, 0.65);
    group.add(frontW);

    const backW = new THREE.Mesh(wGeo, wheelMat);
    backW.position.set(0, 0.35, -0.65);
    group.add(backW);

    // Frame
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), frameMat);
    frame.position.set(0, 0.6, 0);
    frame.rotateX(Math.PI / 4);
    group.add(frame);

    return group;
  }
}

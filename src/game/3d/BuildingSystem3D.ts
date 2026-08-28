import * as THREE from "three";
import { CityLocation, TimeOfDay } from "../../types";
import { World3DAdapter } from "./World3DAdapter";
import { CityMaterials3D } from "./materials/CityMaterials3D";

export class BuildingSystem3D {
  public static createDistrictBuildings(
    locations: CityLocation[],
    timeOfDay: TimeOfDay = "afternoon"
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "BuildingsGroup";

    const isNight = timeOfDay === "night";

    for (const loc of locations) {
      const bldgGroup = this.createSingleBuilding(loc, isNight);
      group.add(bldgGroup);
    }

    return group;
  }

  public static createSingleBuilding(loc: CityLocation, isNight: boolean): THREE.Group {
    const bldgGroup = new THREE.Group();
    bldgGroup.name = `Building_${loc.id}`;

    const p3D = World3DAdapter.to3D(loc.canvasX, loc.canvasY, 0);
    const category = (loc as any).templateType || loc.category || "civic";

    // Architectural Dimensions & Floor Scales
    let width = 15;
    let depth = 13;
    let height = 12;
    let stories = 3;
    let facadeColor = 0x334155;
    let roofColor = 0x1e293b;

    if (category === "hospital" || category === "medical" || category === "airport" || category === "train_station") {
      width = 18;
      depth = 15;
      height = 18;
      stories = 4;
      facadeColor = 0xe2e8f0;
      roofColor = 0x475569;
    } else if (category === "business" || category === "tech" || category === "office") {
      width = 16;
      depth = 15;
      height = 24;
      stories = 6;
      facadeColor = 0x0e7490;
      roofColor = 0x083344;
    } else if (category === "hotel" || category === "theatre" || category === "cinema") {
      width = 16;
      depth = 14;
      height = 16;
      stories = 4;
      facadeColor = 0x475569;
      roofColor = 0x1e293b;
    } else if (category === "university" || category === "library" || category === "academic") {
      width = 17;
      depth = 14;
      height = 15;
      stories = 3;
      facadeColor = 0x9a3412;
      roofColor = 0x78350f;
    } else if (category === "cafe" || category === "bakery" || category === "shop" || category === "store" || category === "bookstore") {
      width = 14;
      depth = 12;
      height = 9;
      stories = 2;
      facadeColor = 0xb45309;
      roofColor = 0x78350f;
    } else if (category === "residential" || category === "suburbs" || category === "townhouse") {
      width = 13;
      depth = 12;
      height = 9.5;
      stories = 2;
      facadeColor = 0x1e293b;
      roofColor = 0x78350f;
    } else if (category === "police") {
      width = 15;
      depth = 13;
      height = 12;
      stories = 3;
      facadeColor = 0x1e3a8a;
      roofColor = 0x0f172a;
    } else if (category === "fire_station") {
      width = 16;
      depth = 14;
      height = 12;
      stories = 2;
      facadeColor = 0xb91c1c;
      roofColor = 0x450a0a;
    } else if (category === "bank") {
      width = 16;
      depth = 14;
      height = 14;
      stories = 3;
      facadeColor = 0xf1f5f9;
      roofColor = 0x64748b;
    }

    // 1. Concrete Foundation Base
    const baseGeo = new THREE.BoxGeometry(width + 0.8, 0.4, depth + 0.8);
    const baseMesh = new THREE.Mesh(baseGeo, CityMaterials3D.curbMaterial);
    baseMesh.position.set(p3D.x, 0.2, p3D.z);
    baseMesh.receiveShadow = true;
    bldgGroup.add(baseMesh);

    // 2. Main Building Volumetric Mass
    const bodyMat = new THREE.MeshStandardMaterial({
      color: facadeColor,
      roughness: 0.7,
      metalness: 0.15,
    });
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(p3D.x, height / 2 + 0.4, p3D.z);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bldgGroup.add(bodyMesh);

    // 3. Architectural Floor Dividers / Cornices
    const floorHeight = height / stories;
    const corniceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    for (let f = 1; f < stories; f++) {
      const corniceGeo = new THREE.BoxGeometry(width + 0.3, 0.25, depth + 0.3);
      const corniceMesh = new THREE.Mesh(corniceGeo, corniceMat);
      corniceMesh.position.set(p3D.x, 0.4 + f * floorHeight, p3D.z);
      corniceMesh.castShadow = true;
      bldgGroup.add(corniceMesh);
    }

    // 4. Multi-Story Windows on Facades
    const cols = Math.floor(width / 3.2);
    const winW = 1.4;
    const winH = 1.3;

    for (let s = 0; s < stories; s++) {
      const winY = 0.4 + (s + 0.5) * floorHeight;

      for (let c = 0; c < cols; c++) {
        const winX = p3D.x - width / 2 + (c + 0.6) * (width / cols);

        // Determine Window Illumination
        const isLit = isNight && (c + s) % 2 === 0;
        const winMat = isLit
          ? CityMaterials3D.glowingWindowMaterial
          : isNight
          ? CityMaterials3D.darkWindowMaterial
          : CityMaterials3D.glassMaterial;

        // Front Windows (Facing +Z)
        const frontWin = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
        frontWin.position.set(winX, winY, p3D.z + depth / 2 + 0.02);
        bldgGroup.add(frontWin);

        // Window Frame Border
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(winW + 0.15, winH + 0.15, 0.08),
          corniceMat
        );
        frame.position.set(winX, winY, p3D.z + depth / 2 + 0.01);
        bldgGroup.add(frame);
      }
    }

    // 5. Architectural Entrance Portal & Glass Doors
    const doorW = 3.2;
    const doorH = 3.0;
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, doorH, 0.3),
      CityMaterials3D.glassMaterial
    );
    doorMesh.position.set(p3D.x, doorH / 2 + 0.4, p3D.z + depth / 2 + 0.15);
    doorMesh.castShadow = true;
    bldgGroup.add(doorMesh);

    // Entrance Portal Arch / Surround
    const archMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.8, doorH + 0.6, 0.4),
      corniceMat
    );
    archMesh.position.set(p3D.x, (doorH + 0.6) / 2 + 0.4, p3D.z + depth / 2 + 0.1);
    bldgGroup.add(archMesh);

    // 6. Rooftop Parapet, Mechanical HVAC units & Helipads
    const roofY = height + 0.4;

    // Roof Parapet Lip
    const parapetGeo = new THREE.BoxGeometry(width + 0.4, 0.6, depth + 0.4);
    const parapetMesh = new THREE.Mesh(
      parapetGeo,
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 })
    );
    parapetMesh.position.set(p3D.x, roofY + 0.3, p3D.z);
    parapetMesh.castShadow = true;
    bldgGroup.add(parapetMesh);

    if (category === "hospital" || category === "medical") {
      // Rooftop Helipad
      const heliGeo = new THREE.CylinderGeometry(4, 4, 0.2, 16);
      const heliMesh = new THREE.Mesh(
        heliGeo,
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
      );
      heliMesh.position.set(p3D.x, roofY + 0.6, p3D.z);
      heliMesh.receiveShadow = true;
      bldgGroup.add(heliMesh);
    } else if (category === "business" || category === "tech" || category === "office") {
      // HVAC Mechanical Boxes
      const hvacGeo = new THREE.BoxGeometry(3, 1.8, 2.5);
      const hvacMesh = new THREE.Mesh(
        hvacGeo,
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4 })
      );
      hvacMesh.position.set(p3D.x - 3, roofY + 1.2, p3D.z - 2);
      hvacMesh.castShadow = true;
      bldgGroup.add(hvacMesh);

      // Communications Spire
      const spireGeo = new THREE.CylinderGeometry(0.08, 0.25, 6, 8);
      const spireMesh = new THREE.Mesh(
        spireGeo,
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8 })
      );
      spireMesh.position.set(p3D.x + 3, roofY + 3.3, p3D.z + 2);
      spireMesh.castShadow = true;
      bldgGroup.add(spireMesh);
    }

    // 7. Physical 3D English Storefront Signboard
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 256;
    signCanvas.height = 64;
    const sCtx = signCanvas.getContext("2d")!;
    sCtx.fillStyle = "#0f172a";
    sCtx.fillRect(0, 0, 256, 64);
    sCtx.strokeStyle = isNight ? "#38bdf8" : "#94a3b8";
    sCtx.lineWidth = 4;
    sCtx.strokeRect(2, 2, 252, 60);
    sCtx.fillStyle = "#ffffff";
    sCtx.font = "bold 24px sans-serif";
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.fillText(loc.name.toUpperCase().slice(0, 18), 128, 32);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: isNight ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
      emissiveIntensity: isNight ? 0.6 : 0,
      roughness: 0.3,
    });

    const signW = Math.min(width - 2, 10);
    const signGeo = new THREE.BoxGeometry(signW, 1.6, 0.25);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(p3D.x, doorH + 1.6, p3D.z + depth / 2 + 0.25);
    signMesh.castShadow = true;
    bldgGroup.add(signMesh);

    return bldgGroup;
  }
}

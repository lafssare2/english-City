import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import firebaseConfig from "../../firebase-applet-config.json" with { type: "json" };

let adminApp: App | null = null;

export function getFirebaseAdmin(): App {
  if (!adminApp) {
    const apps = getApps();
    if (apps.length > 0 && apps[0]) {
      adminApp = apps[0];
    } else {
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdmin());
}

export function getAdminFirestore(): Firestore {
  const adminAppInstance = getFirebaseAdmin();
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
    return getFirestore(adminAppInstance, firebaseConfig.firestoreDatabaseId);
  }
  return getFirestore(adminAppInstance);
}


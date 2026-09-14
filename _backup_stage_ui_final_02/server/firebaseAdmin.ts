import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: App;

// We use the projectId from the config.
const projectId = "gen-lang-client-0469971247"; 
const databaseId = "ai-studio-thouesap2plogist-c94437d6-2523-497b-8c35-9a03ab85e9b5";

if (getApps().length === 0) {
  app = initializeApp({
    projectId: projectId,
    credential: applicationDefault(), // Uses GCP standard environment credentials
  });
} else {
  app = getApps()[0];
}

// In standard usage, to specify a database ID we can pass it if supported by the admin SDK, 
// or it defaults to (default).
export const adminDb = getFirestore(app, databaseId);
export const adminAuth = getAuth(app);

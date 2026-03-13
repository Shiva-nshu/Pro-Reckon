import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
let db: admin.firestore.Firestore | null = null;

export function initFirebase(): void {
  if (db) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    const resolved = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);
    const json = fs.readFileSync(resolved, 'utf8');
    const serviceAccount = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (projectId && clientEmail && privateKey) {
    const key = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: key,
      }),
    });
  } else {
    console.warn('⚠️ Firebase credentials not found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS.');
    return;
  }

  db = admin.firestore();
  console.log('✅ Connected to Firebase Firestore');
}

export function getFirestore(): admin.firestore.Firestore | null {
  return db;
}

export function isFirebaseConnected(): boolean {
  return db !== null;
}

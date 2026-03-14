/**
 * Database config: uses Firebase Firestore (initialized in server).
 */

import { initFirebase, getFirestore, isFirebaseConnected } from '../../server/config/firebase.js';

export async function connectDB(): Promise<void> {
  initFirebase();
}

export { isFirebaseConnected as isDBConnected };

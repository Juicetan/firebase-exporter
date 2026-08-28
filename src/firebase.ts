import { readFileSync } from "node:fs";
import { cert, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountKey = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export function initFirestore(keyFile: string, projectId?: string): Firestore {
  const raw = readFileSync(keyFile, "utf8");
  const credentials = JSON.parse(raw) as ServiceAccountKey;

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(`Service account file is missing client_email or private_key: ${keyFile}`);
  }

  const resolvedProjectId = projectId ?? credentials.project_id;
  if (!resolvedProjectId) {
    throw new Error("No project id: set --project or use a key file with project_id");
  }

  const app: App = initializeApp({
    credential: cert({
      projectId: resolvedProjectId,
      clientEmail: credentials.client_email,
      privateKey: credentials.private_key,
    }),
    projectId: resolvedProjectId,
  });

  return getFirestore(app);
}

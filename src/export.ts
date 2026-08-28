import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { flattenDocument, type FlatRecord } from "./flatten.js";

const PAGE_SIZE = 500;

export async function exportCollection(
  db: Firestore,
  collectionId: string,
): Promise<FlatRecord[]> {
  const records: FlatRecord[] = [];
  let lastId: string | undefined;

  for (;;) {
    let query = db
      .collection(collectionId)
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);

    if (lastId !== undefined) {
      query = query.startAfter(lastId);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      records.push(flattenDocument(doc.id, doc.data()));
    }

    lastId = snapshot.docs[snapshot.docs.length - 1]?.id;
    if (snapshot.size < PAGE_SIZE) {
      break;
    }
  }

  return records;
}

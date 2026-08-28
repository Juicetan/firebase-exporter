import {
  DocumentReference,
  GeoPoint,
  Timestamp,
} from "firebase-admin/firestore";

export type FlatRecord = Record<string, string>;

export function flattenDocument(id: string, data: Record<string, unknown>): FlatRecord {
  const record: FlatRecord = { id };
  flattenValue(data, "", record);
  return record;
}

function flattenValue(value: unknown, prefix: string, out: FlatRecord): void {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    setField(out, prefix, "");
    return;
  }

  if (value instanceof Timestamp) {
    setField(out, prefix, value.toDate().toISOString());
    return;
  }

  if (value instanceof GeoPoint) {
    setField(out, join(prefix, "latitude"), String(value.latitude));
    setField(out, join(prefix, "longitude"), String(value.longitude));
    return;
  }

  if (value instanceof DocumentReference) {
    setField(out, prefix, value.path);
    return;
  }

  if (Array.isArray(value)) {
    setField(out, prefix, JSON.stringify(value, jsonReplacer));
    return;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      setField(out, prefix, "{}");
      return;
    }
    for (const key of keys) {
      flattenValue(value[key], join(prefix, key), out);
    }
    return;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    setField(out, prefix, String(value));
    return;
  }

  setField(out, prefix, JSON.stringify(value, jsonReplacer));
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof DocumentReference) {
    return value.path;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function join(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

function setField(out: FlatRecord, key: string, value: string): void {
  if (!key) {
    return;
  }
  out[key] = value;
}

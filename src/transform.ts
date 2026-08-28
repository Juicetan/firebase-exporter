import { readFileSync } from "node:fs";
import type { FlatRecord } from "./flatten.js";

export type FieldMapping = {
  from: string;
  to: string;
};

export type Transform = {
  columns: FieldMapping[];
};

export function loadTransform(path: string): Transform {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseTransform(raw, path);
}

export function parseTransform(raw: unknown, source = "transform JSON"): Transform {
  if (!isObject(raw) || !Array.isArray(raw.columns)) {
    throw new Error(`${source} must be an object with a "columns" array`);
  }

  const columns: FieldMapping[] = [];
  const headers = new Set<string>();

  for (const [index, item] of raw.columns.entries()) {
    if (!isObject(item) || typeof item.from !== "string" || typeof item.to !== "string") {
      throw new Error(`${source} columns[${index}] must have string "from" and "to"`);
    }

    const from = item.from.trim();
    const to = item.to.trim();
    if (!from || !to) {
      throw new Error(`${source} columns[${index}] "from" and "to" must be non-empty`);
    }
    if (headers.has(to)) {
      throw new Error(`${source} has duplicate CSV header "${to}"`);
    }

    headers.add(to);
    columns.push({ from, to });
  }

  if (columns.length === 0) {
    throw new Error(`${source} columns must not be empty`);
  }

  return { columns };
}

export function applyTransform(records: FlatRecord[], transform: Transform): FlatRecord[] {
  return records.map((record) => {
    const mapped: FlatRecord = {};
    for (const { from, to } of transform.columns) {
      mapped[to] = record[from] ?? "";
    }
    return mapped;
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

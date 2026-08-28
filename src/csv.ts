import { writeFile } from "node:fs/promises";
import type { FlatRecord } from "./flatten.js";

export async function writeCsv(
  path: string,
  records: FlatRecord[],
  columns = collectColumns(records),
): Promise<void> {
  const lines = [encodeRow(columns)];

  for (const record of records) {
    lines.push(encodeRow(columns.map((column) => record[column] ?? "")));
  }

  await writeFile(path, `${lines.join("\n")}\n`, "utf8");
}

function collectColumns(records: FlatRecord[]): string[] {
  const keys = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (key !== "id") {
        keys.add(key);
      }
    }
  }
  return ["id", ...[...keys].sort()];
}

function encodeRow(values: string[]): string {
  return values.map(escapeCsvField).join(",");
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

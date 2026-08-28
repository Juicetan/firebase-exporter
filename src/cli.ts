#!/usr/bin/env node
import { Command } from "commander";
import { writeCsv } from "./csv.js";
import { exportCollection } from "./export.js";
import { initFirestore } from "./firebase.js";
import { applyTransform, loadTransform } from "./transform.js";

const program = new Command();

program
  .name("firebase-exporter")
  .description("Export a Firestore collection to CSV")
  .requiredOption("-k, --key-file <path>", "Path to service-account JSON")
  .requiredOption("-c, --collection <id>", "Top-level collection ID")
  .requiredOption("-o, --out <path>", "Output CSV path")
  .option("-p, --project <id>", "Override project id from the key file")
  .option("-t, --transform <path>", "JSON mapping of DB fields to CSV columns")
  .action(async (options: {
    keyFile: string;
    collection: string;
    out: string;
    project?: string;
    transform?: string;
  }) => {
    const db = initFirestore(options.keyFile, options.project);
    const records = await exportCollection(db, options.collection);
    const transform = options.transform ? loadTransform(options.transform) : undefined;
    const rows = transform ? applyTransform(records, transform) : records;
    const columns = transform?.columns.map((column) => column.to);
    await writeCsv(options.out, rows, columns);
    console.log(`Wrote ${rows.length} row(s) to ${options.out}`);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

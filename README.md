# firebase-exporter

Export one top-level Firestore collection as a CSV (CLI) or into a Google Sheet (Apps Script).

v1 exports **top-level documents only** (no subcollections). Nested maps become dotted columns (`address.city`). Arrays are JSON strings. Without a transform, the first column is always `id` and remaining columns are the sorted union of flattened keys.

Both tools need a Google Cloud service account JSON with Firestore/Datastore access. Keep that file out of git.

## CLI

Node.js 18+. Writes a CSV file on disk.

### Setup

```bash
npm install
npm run build
```

### Usage

```bash
npx firebase-exporter --key-file ./sa.json --collection users --out users.csv
```

During development:

```bash
npm run dev -- --key-file ./sa.json --collection users --out users.csv
```

| Flag | Required | Meaning |
|------|----------|---------|
| `--key-file` / `-k` | yes | Path to service-account JSON |
| `--collection` / `-c` | yes | Top-level collection ID |
| `--out` / `-o` | yes | Output CSV path |
| `--project` / `-p` | no | Override `project_id` from the key file |
| `--database` / `-d` | no | Firestore database ID; omit or pass `default` for `(default)` |
| `--transform` / `-t` | no | JSON that maps DB fields to CSV columns |

Pass `--transform mapping.json` to pick columns, rename headers, and set column order. `from` is a flattened document path (`id` for the document ID). Missing fields become empty cells. Only listed columns are written.

```json
{
  "columns": [
    { "from": "id", "to": "user_id" },
    { "from": "email", "to": "email" },
    { "from": "address.city", "to": "city" }
  ]
}
```

```bash
npx firebase-exporter -k ./sa.json -c users -o users.csv -t mapping.json
```

## Apps Script

Spreadsheet-bound script that syncs the same collection into a Google Sheet. Copy every file in `appscript/` into one Apps Script project (Extensions → Apps Script). The files share a global namespace:

- `Main.js` — menu + `runSync`
- `Config.js` — script properties
- `Auth.js` — service-account JWT
- `Firestore.js` — REST list + pagination
- `Flatten.js` — REST decode + flatten
- `Transform.js` — optional column mapping
- `Sheet.js` — incremental append
- `Utils.js` — shared helpers

Set these in **Project Settings → Script properties**:

| Property | Required | Meaning |
|----------|----------|---------|
| `SERVICE_ACCOUNT_JSON` | yes | Full service-account JSON |
| `FIRESTORE_COLLECTION` | yes | Top-level collection ID |
| `FIRESTORE_PROJECT` | no | Override `project_id` from the key |
| `FIRESTORE_DATABASE` | no | Database ID; omit or pass `default` for `(default)` |
| `TRANSFORM_JSON` | no | Same column mapping as the CLI `--transform` file |
| `SHEET_NAME` | no | Tab name; defaults to the first sheet |

Run `runSync()` from the editor, a time-driven trigger, or the **Firestore → Sync collection** menu (reopen the spreadsheet after adding the files so the menu appears).

Existing rows are never updated: documents whose id is already in the sheet are skipped. New flattened columns (no transform) are appended to the header. Apps Script’s ~6 minute limit applies; a timeout throws rather than writing a partial page. Re-run to append remaining ids.

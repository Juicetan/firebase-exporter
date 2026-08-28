# firebase-exporter

CLI that exports one top-level Firestore collection to a CSV file.

## Requirements

- Node.js 18+
- A Google Cloud service account JSON with Firestore access

## Setup

```bash
npm install
npm run build
```

The service account file must stay out of git. Pass it with `--key-file`.

## Usage

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
| `--transform` / `-t` | no | JSON that maps DB fields to CSV columns |

v1 exports **top-level documents only** (no subcollections). Nested maps become dotted columns (`address.city`). Arrays are JSON strings. Without `--transform`, the first column is always `id` and remaining columns are the sorted union of flattened keys.

## Field mapping

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

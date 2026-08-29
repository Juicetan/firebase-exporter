/**
 * Firestore → Google Sheet sync (firebase-exporter parity).
 *
 * Create these files in one spreadsheet-bound Apps Script project
 * (Extensions → Apps Script). All files share a global namespace.
 *
 *   Main.js        this file: menu + runSync
 *   Config.js      Script properties
 *   Auth.js        service-account JWT
 *   Firestore.js   REST list + pagination
 *   Flatten.js     REST decode + flatten
 *   Transform.js   optional column mapping
 *   Sheet.js       incremental append
 *   Utils.js       shared helpers
 *
 * Script properties (Project Settings → Script properties):
 *   SERVICE_ACCOUNT_JSON  required  full service-account JSON
 *   FIRESTORE_COLLECTION  required  top-level collection ID
 *   FIRESTORE_PROJECT     optional  override project_id from the key
 *   FIRESTORE_DATABASE    optional  database ID; defaults to (default)
 *   TRANSFORM_JSON        optional  {"columns":[{"from":"id","to":"user_id"}, ...]}
 *   SHEET_NAME            optional  tab name; defaults to the first sheet
 *
 * The service account needs Firestore/Datastore access on the project.
 * Existing rows are never updated: documents whose id is already in the
 * sheet are skipped. New flattened columns (no transform) are appended
 * to the header. Apps Script's ~6 minute limit applies; a timeout throws
 * rather than writing a partial page.
 *
 * Run runSync() from the editor, a time-driven trigger, or the
 * "Firestore" custom menu after reopening the spreadsheet.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Firestore")
    .addItem("Sync collection", "runSync")
    .addToUi();
}

function runSync() {
  var startedAt = Date.now();
  var config = loadConfig_();
  var token = getAccessToken_(config.serviceAccount);
  var records = exportCollection_(
    token,
    config.projectId,
    config.databaseId,
    config.collectionId,
    startedAt
  );

  var rows = config.transform ? applyTransform_(records, config.transform) : records;
  var result = writeNewRows_(config.sheet, rows, config.transform, config.idHeader);

  Logger.log(
    "Sync complete: fetched " +
      records.length +
      ", appended " +
      result.appended +
      ", skipped " +
      result.skipped +
      " existing."
  );
}

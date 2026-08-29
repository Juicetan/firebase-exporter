function loadConfig_() {
  var props = PropertiesService.getScriptProperties();
  var rawKey = props.getProperty("SERVICE_ACCOUNT_JSON");
  if (!rawKey) {
    throw new Error("Script property SERVICE_ACCOUNT_JSON is missing");
  }

  var serviceAccount;
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch (err) {
    throw new Error("SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("SERVICE_ACCOUNT_JSON is missing client_email or private_key");
  }

  var collectionId = trim_(props.getProperty("FIRESTORE_COLLECTION"));
  if (!collectionId) {
    throw new Error("Script property FIRESTORE_COLLECTION is missing");
  }

  var projectId = trim_(props.getProperty("FIRESTORE_PROJECT")) || serviceAccount.project_id;
  if (!projectId) {
    throw new Error("No project id: set FIRESTORE_PROJECT or include project_id in the key");
  }

  var databaseId = resolveDatabaseId_(props.getProperty("FIRESTORE_DATABASE"));

  var transform = null;
  var transformRaw = props.getProperty("TRANSFORM_JSON");
  if (transformRaw && trim_(transformRaw)) {
    transform = parseTransform_(JSON.parse(transformRaw));
  }

  var sheetName = trim_(props.getProperty("SHEET_NAME"));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
  if (!sheet) {
    throw new Error(sheetName ? 'Sheet not found: "' + sheetName + '"' : "Spreadsheet has no sheets");
  }

  return {
    serviceAccount: serviceAccount,
    projectId: projectId,
    databaseId: databaseId,
    collectionId: collectionId,
    transform: transform,
    sheet: sheet,
    idHeader: idHeader_(transform),
  };
}

function idHeader_(transform) {
  if (!transform) {
    return "id";
  }
  for (var i = 0; i < transform.columns.length; i++) {
    if (transform.columns[i].from === "id") {
      return transform.columns[i].to;
    }
  }
  return "id";
}

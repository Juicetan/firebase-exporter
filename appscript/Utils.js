function parseJsonResponse_(response, label) {
  var code = response.getResponseCode();
  var text = response.getContentText();
  var body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (err) {
      throw new Error(label + " returned non-JSON (HTTP " + code + "): " + text.slice(0, 300));
    }
  }
  if (code < 200 || code >= 300) {
    var message = (body.error && body.error.message) || text.slice(0, 300) || "HTTP " + code;
    throw new Error(label + " failed (HTTP " + code + "): " + message);
  }
  return body;
}

function trim_(value) {
  return value == null ? "" : String(value).replace(/^\s+|\s+$/g, "");
}

function resolveDatabaseId_(databaseId) {
  var trimmed = trim_(databaseId);
  if (!trimmed || trimmed === "default") {
    return "(default)";
  }
  return trimmed;
}

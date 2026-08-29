var PAGE_SIZE = 300;
var MAX_RUNTIME_MS = 5.5 * 60 * 1000;

function exportCollection_(token, projectId, databaseId, collectionId, startedAt) {
  var records = [];
  var pageToken = "";

  while (true) {
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      throw new Error(
        "Stopped before Apps Script timeout after " +
          records.length +
          " document(s). Re-run to append remaining ids."
      );
    }

    var url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/" +
      encodeURIComponent(databaseId) +
      "/documents/" +
      encodeURIComponent(collectionId) +
      "?pageSize=" +
      PAGE_SIZE +
      "&orderBy=" +
      encodeURIComponent("__name__");

    if (pageToken) {
      url += "&pageToken=" + encodeURIComponent(pageToken);
    }

    var response = UrlFetchApp.fetch(url, {
      method: "get",
      muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + token },
    });

    var body = parseJsonResponse_(response, "Firestore list");
    var documents = body.documents || [];

    for (var i = 0; i < documents.length; i++) {
      var doc = documents[i];
      var id = documentIdFromName_(doc.name);
      var data = decodeMap_(doc.fields || {});
      records.push(flattenDocument_(id, data));
    }

    pageToken = body.nextPageToken || "";
    if (!pageToken) {
      break;
    }
  }

  return records;
}

function documentIdFromName_(name) {
  if (!name) {
    return "";
  }
  var marker = "/documents/";
  var idx = name.indexOf(marker);
  var path = idx === -1 ? name : name.substring(idx + marker.length);
  var parts = path.split("/");
  return parts[parts.length - 1] || "";
}

function documentPathFromName_(name) {
  if (!name) {
    return "";
  }
  var marker = "/documents/";
  var idx = name.indexOf(marker);
  return idx === -1 ? name : name.substring(idx + marker.length);
}

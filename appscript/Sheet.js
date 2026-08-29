function collectColumns_(records) {
  var keys = {};
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    var names = Object.keys(record);
    for (var j = 0; j < names.length; j++) {
      if (names[j] !== "id") {
        keys[names[j]] = true;
      }
    }
  }
  return ["id"].concat(Object.keys(keys).sort());
}

function writeNewRows_(sheet, records, transform, idHeader) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = [];

  if (lastRow > 0 && lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
    headers = normalizeHeaders_(headers);
  }

  if (headers.length === 0) {
    headers = transform ? transform.columns.map(function (c) { return c.to; }) : collectColumns_(records);
    if (headers.length === 0) {
      return { appended: 0, skipped: 0 };
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    lastRow = 1;
  } else if (!transform) {
    headers = extendHeaders_(sheet, headers, records);
  }

  var idIndex = indexOfHeader_(headers, idHeader);
  if (idIndex === -1) {
    throw new Error(
      'Cannot find id column "' +
        idHeader +
        '" in the header row. Add it or set TRANSFORM_JSON so "id" maps to a header.'
    );
  }

  var existing = {};
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getDisplayValues();
    for (var i = 0; i < idValues.length; i++) {
      var existingId = String(idValues[i][0]);
      if (existingId) {
        existing[existingId] = true;
      }
    }
  }

  var newRows = [];
  var skipped = 0;
  for (var r = 0; r < records.length; r++) {
    var record = records[r];
    var docId = record[idHeader] != null ? String(record[idHeader]) : "";
    if (!docId) {
      skipped++;
      continue;
    }
    if (existing[docId]) {
      skipped++;
      continue;
    }
    existing[docId] = true;
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var value = record[headers[c]];
      row.push(value != null ? value : "");
    }
    newRows.push(row);
  }

  if (newRows.length > 0) {
    sheet.getRange(lastRow + 1, 1, newRows.length, headers.length).setValues(newRows);
  }

  return { appended: newRows.length, skipped: skipped };
}

function normalizeHeaders_(headers) {
  var trimmed = [];
  var end = headers.length;
  while (end > 0 && trim_(String(headers[end - 1])) === "") {
    end--;
  }
  for (var i = 0; i < end; i++) {
    trimmed.push(String(headers[i]));
  }
  return trimmed;
}

function extendHeaders_(sheet, headers, records) {
  var present = {};
  for (var i = 0; i < headers.length; i++) {
    present[headers[i]] = true;
  }

  var discovered = {};
  for (var r = 0; r < records.length; r++) {
    var keys = Object.keys(records[r]);
    for (var k = 0; k < keys.length; k++) {
      if (!present[keys[k]]) {
        discovered[keys[k]] = true;
      }
    }
  }

  var extra = Object.keys(discovered).sort();
  if (extra.length === 0) {
    return headers;
  }

  var next = headers.concat(extra);
  sheet.getRange(1, 1, 1, next.length).setValues([next]);
  return next;
}

function indexOfHeader_(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === name) {
      return i;
    }
  }
  return -1;
}

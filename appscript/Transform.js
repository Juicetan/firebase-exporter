function parseTransform_(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.columns)) {
    throw new Error('TRANSFORM_JSON must be an object with a "columns" array');
  }

  var columns = [];
  var headers = {};

  for (var i = 0; i < raw.columns.length; i++) {
    var item = raw.columns[i];
    if (!item || typeof item.from !== "string" || typeof item.to !== "string") {
      throw new Error('TRANSFORM_JSON columns[' + i + '] must have string "from" and "to"');
    }
    var from = trim_(item.from);
    var to = trim_(item.to);
    if (!from || !to) {
      throw new Error('TRANSFORM_JSON columns[' + i + '] "from" and "to" must be non-empty');
    }
    if (headers[to]) {
      throw new Error('TRANSFORM_JSON has duplicate header "' + to + '"');
    }
    headers[to] = true;
    columns.push({ from: from, to: to });
  }

  if (columns.length === 0) {
    throw new Error("TRANSFORM_JSON columns must not be empty");
  }

  return { columns: columns };
}

function applyTransform_(records, transform) {
  var mapped = [];
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    var row = {};
    for (var j = 0; j < transform.columns.length; j++) {
      var col = transform.columns[j];
      row[col.to] = record[col.from] != null ? record[col.from] : "";
    }
    mapped.push(row);
  }
  return mapped;
}

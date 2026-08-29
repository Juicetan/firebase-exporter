function decodeMap_(fields) {
  var obj = {};
  var keys = Object.keys(fields);
  for (var i = 0; i < keys.length; i++) {
    obj[keys[i]] = decodeValue_(fields[keys[i]]);
  }
  return obj;
}

function decodeValue_(typed) {
  if (typed == null || typeof typed !== "object") {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "nullValue")) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "booleanValue")) {
    return typed.booleanValue;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "integerValue")) {
    var asNumber = Number(typed.integerValue);
    return isFinite(asNumber) && String(asNumber) === String(typed.integerValue) ? asNumber : typed.integerValue;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "doubleValue")) {
    return typed.doubleValue;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "stringValue")) {
    return typed.stringValue;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "timestampValue")) {
    return new Date(typed.timestampValue);
  }
  if (Object.prototype.hasOwnProperty.call(typed, "bytesValue")) {
    return typed.bytesValue;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "geoPointValue")) {
    var geo = typed.geoPointValue || {};
    return { __geo: true, latitude: geo.latitude, longitude: geo.longitude };
  }
  if (Object.prototype.hasOwnProperty.call(typed, "referenceValue")) {
    return { __ref: true, path: documentPathFromName_(typed.referenceValue) };
  }
  if (Object.prototype.hasOwnProperty.call(typed, "arrayValue")) {
    var values = (typed.arrayValue && typed.arrayValue.values) || [];
    var arr = [];
    for (var i = 0; i < values.length; i++) {
      arr.push(decodeValue_(values[i]));
    }
    return arr;
  }
  if (Object.prototype.hasOwnProperty.call(typed, "mapValue")) {
    return decodeMap_((typed.mapValue && typed.mapValue.fields) || {});
  }
  return undefined;
}

function flattenDocument_(id, data) {
  var record = { id: id };
  flattenValue_(data, "", record);
  return record;
}

function flattenValue_(value, prefix, out) {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    setField_(out, prefix, "");
    return;
  }

  if (value instanceof Date) {
    setField_(out, prefix, value.toISOString());
    return;
  }

  if (isGeo_(value)) {
    setField_(out, join_(prefix, "latitude"), String(value.latitude));
    setField_(out, join_(prefix, "longitude"), String(value.longitude));
    return;
  }

  if (isRef_(value)) {
    setField_(out, prefix, value.path);
    return;
  }

  if (Array.isArray(value)) {
    setField_(out, prefix, JSON.stringify(value, jsonReplacer_));
    return;
  }

  if (isPlainObject_(value)) {
    var keys = Object.keys(value);
    if (keys.length === 0) {
      setField_(out, prefix, "{}");
      return;
    }
    for (var i = 0; i < keys.length; i++) {
      flattenValue_(value[keys[i]], join_(prefix, keys[i]), out);
    }
    return;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    setField_(out, prefix, String(value));
    return;
  }

  setField_(out, prefix, JSON.stringify(value, jsonReplacer_));
}

function jsonReplacer_(_key, value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (isGeo_(value)) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (isRef_(value)) {
    return value.path;
  }
  return value;
}

function isGeo_(value) {
  return value && typeof value === "object" && value.__geo === true;
}

function isRef_(value) {
  return value && typeof value === "object" && value.__ref === true;
}

function isPlainObject_(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isGeo_(value) &&
    !isRef_(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function join_(prefix, key) {
  return prefix ? prefix + "." + key : key;
}

function setField_(out, key, value) {
  if (!key) {
    return;
  }
  out[key] = value;
}

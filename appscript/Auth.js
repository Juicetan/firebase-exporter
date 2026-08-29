var OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
var FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

function getAccessToken_(serviceAccount) {
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: "RS256", typ: "JWT" };
  var claim = {
    iss: serviceAccount.client_email,
    scope: FIRESTORE_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  var toSign = base64UrlEncode_(JSON.stringify(header)) + "." + base64UrlEncode_(JSON.stringify(claim));
  var privateKey = String(serviceAccount.private_key).replace(/\\n/g, "\n");
  var signature = Utilities.computeRsaSha256Signature(toSign, privateKey);
  var jwt = toSign + "." + base64UrlEncodeBytes_(signature);

  var response = UrlFetchApp.fetch(OAUTH_TOKEN_URL, {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    },
  });

  var body = parseJsonResponse_(response, "OAuth token");
  if (!body.access_token) {
    throw new Error("OAuth token response missing access_token");
  }
  return body.access_token;
}

function base64UrlEncode_(text) {
  return base64UrlEncodeBytes_(Utilities.newBlob(text).getBytes());
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
}

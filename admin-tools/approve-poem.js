// admin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// load your service account JSON (downloaded from Firebase console → Project settings → Service accounts)
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

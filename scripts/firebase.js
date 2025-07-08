// scripts/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0qWjJ8kt5jo1rOwNAd21RZ9QeK6pE7yU",
  authDomain: "lsif-cedb1.firebaseapp.com",
  databaseURL: "https://lsif-cedb1-default-rtdb.firebaseio.com",
  projectId: "lsif-cedb1",
  storageBucket: "lsif-cedb1.appspot.com",
  messagingSenderId: "761903090404",
  appId: "1:761903090404:web:0b7c914fa2c3599faebaf1",
  measurementId: "G-GGNJJSP3DJ"
};

const app      = initializeApp(firebaseConfig);
export const storage = getStorage(app);

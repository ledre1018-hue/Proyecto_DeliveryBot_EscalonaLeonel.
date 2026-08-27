import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyAbU83U4nu25IbMq3JTap0yEVCCny8PkRg",
  authDomain: "tallerrefactori-ia.firebaseapp.com",
  databaseURL: "https://tallerrefactori-ia-default-rtdb.firebaseio.com",
  projectId: "tallerrefactori-ia",
  storageBucket: "tallerrefactori-ia.firebasestorage.app",
  messagingSenderId: "720594609698",
  appId: "1:720594609698:web:b719cc8fef976cee728c7b",
  measurementId: "G-GCWWPJ4HZ6",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
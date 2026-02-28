import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAVnHFtkNRyDSlzZi7VO3NUYLdQL_YDr1M",
  authDomain: "class-8-project-c494d.firebaseapp.com",
  databaseURL: "https://class-8-project-c494d-default-rtdb.firebaseio.com",
  projectId: "class-8-project-c494d",
  storageBucket: "class-8-project-c494d.firebasestorage.app",
  messagingSenderId: "552503917607",
  appId: "1:552503917607:web:969183cae81728577ca202",
  measurementId: "G-VWND377T64"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

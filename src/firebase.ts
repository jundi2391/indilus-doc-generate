import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0141599465",
  appId: "1:366562856721:web:8fa70fd899d91728bec6b0",
  apiKey: "AIzaSyCyOnx1G82z3yMb548gQlH2NjREE7edXcA",
  authDomain: "gen-lang-client-0141599465.firebaseapp.com",
  storageBucket: "gen-lang-client-0141599465.firebasestorage.app",
  messagingSenderId: "366562856721",
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-60f423d2-4c6a-4379-a26a-9a4f8f0a8b7f");
export const auth = getAuth(app);

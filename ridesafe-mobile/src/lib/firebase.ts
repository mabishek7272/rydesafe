import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoF6570b3bYvc0qW5u2uc1KSn6xlvLJRo",
  authDomain: "ridesafe-6706f.firebaseapp.com",
  projectId: "ridesafe-6706f",
  storageBucket: "ridesafe-6706f.firebasestorage.app",
  messagingSenderId: "469599681351",
  appId: "1:469599681351:web:eb5560c67443bb1345aa62",
  measurementId: "G-HLJLQP5MJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// We optionally export analytics if we need it later, catching browser-only constraints for getAnalytics in React Native
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics fails in React Native if not implemented via native module
}

export { app, analytics };

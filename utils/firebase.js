const firebaseConfig = {
  apiKey: "AIzaSyBDWWNQ3og4UXp8NvbY-1QJsT8Q2QH27H8",
  authDomain: "storywave-c6fbe.firebaseapp.com",
  projectId: "storywave-c6fbe",
  storageBucket: "storywave-c6fbe.appspot.com",
  messagingSenderId: "623345857055",
  appId: "1:623345857055:web:e0275651c0433b700d1b2a",
  measurementId: "G-R1C7MR9K4P"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.firebaseAuth = auth;
window.firebaseDb = db;
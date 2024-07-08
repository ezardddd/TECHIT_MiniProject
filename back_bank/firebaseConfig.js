const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAa74_GtHv2ZsZ4AEO5UKaBg93jNAw8LAo",
  authDomain: "techit-miniproject.firebaseapp.com",
  projectId: "techit-miniproject",
  storageBucket: "techit-miniproject.appspot.com",
  messagingSenderId: "360114002245",
  appId: "1:360114002245:web:e5c611763203081f08862c",
  measurementId: "G-6NHS0YQ162"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

module.exports = { storage };
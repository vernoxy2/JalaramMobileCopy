// firebase.js
import { initializeApp } from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCcGW8SAt05QEJPFqfll5aBAh_yaJ7tE5o",
  authDomain: "jalaram-33f56.firebaseapp.com",
  projectId: "jalaram-33f56",
  storageBucket: "jalaram-33f56.appspot.com", // corrected URL
  messagingSenderId: "308176661731",
  appId: "1:308176661731:web:09ea16b99a5764c707a9d6",
  measurementId: "G-HRPDKGM176" // okay to keep but not used in React Native
};

// Initialize Firebase

export { auth };

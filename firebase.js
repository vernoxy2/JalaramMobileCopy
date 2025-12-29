// firebase.js
import { initializeApp } from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
// const firebaseConfig = {
//   apiKey: "AIzaSyCcGW8SAt05QEJPFqfll5aBAh_yaJ7tE5o",
//   authDomain: "jalaram-33f56.firebaseapp.com",
//   projectId: "jalaram-33f56",
//   storageBucket: "jalaram-33f56.appspot.com", // corrected URL
//   messagingSenderId: "308176661731",
//   appId: "1:308176661731:web:09ea16b99a5764c707a9d6",
//   measurementId: "G-HRPDKGM176" // okay to keep but not used in React Native
// };

const firebaseConfig = {
  apiKey: "AIzaSyARTpH_U_KLr4Np7I316VmSDjx8HuTUsLY",
  authDomain: "jalaramnewcopy.firebaseapp.com",
  projectId: "jalaramnewcopy",
  storageBucket: "jalaramnewcopy.firebasestorage.app",
  messagingSenderId: "428903801642",
  appId: "1:428903801642:web:4b8b10820ae4c0a374f453",
  measurementId: "G-31WEDL9L2Z"
};

// Initialize Firebase

export { auth };

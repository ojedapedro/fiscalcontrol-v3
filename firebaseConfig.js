// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
  apiKey: "AIzaSyBDlyulomv_7lSYvH2Nmp70_tDGToKswhY",
  authDomain: "fiscalcontrolv3.firebaseapp.com",
  DatabaseURL: "https://fiscalcontrolv3-default-rtdb.firebaseio.com/",
  projectId: "fiscalcontrolv3",
  storageBucket: "fiscalcontrolv3.firebasestorage.app",
  messagingSenderId: "25215105165",
  appId: "1:25215105165:web:3a2afff7a20ae6ae428ac4",
  measurementId: "G-2ZYSC1GPF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
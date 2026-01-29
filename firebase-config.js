// Firebase configuration module
// To set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Enable Firestore Database with security rules:
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /monopoly-state/{document=**} {
//          allow read, write: if true;
//        }
//      }
//    }
// 4. Get your config from Project Settings > General > Your apps > Web app
// 5. Replace the config below with your own

export const firebaseConfig = {

  apiKey: "AIzaSyDy7US8po1z7-8Z6ilx8NajANftfB-flaI",

  authDomain: "website-a4dc5.firebaseapp.com",

  projectId: "website-a4dc5",

  storageBucket: "website-a4dc5.firebasestorage.app",

  messagingSenderId: "90006442817",

  appId: "1:90006442817:web:03a2f5dc14315eeb7687c0",

  measurementId: "G-G14QL145CS"

};


export const FIRESTORE_DOC = 'global-state';
export const STORAGE_KEY = 'mssw-state-v1';
export default firebaseConfig;

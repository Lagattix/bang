// Firebase Configuration
// IMPORTANTE: Sostituisci questi valori con la tua configurazione Firebase

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Inizializza servizi
const auth = firebase.auth();
const db = firebase.firestore();

// Export per uso nell'app
window.firebaseAuth = auth;
window.firebaseDB = db;

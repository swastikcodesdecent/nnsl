/**
 * Netaji Nagar Super League - Firebase Configuration
 * 
 * Replace the placeholder values below with your actual Firebase project settings
 * obtained from the Firebase Console (Project Settings > General > Your apps > Web app).
 * 
 * Documentation: See README.md for step-by-step instructions.
 */

export const firebaseConfig = {
    apiKey: "AIzaSyBEt0cfhXScfwk8VukYUh5dBdj-XodDXWo",
    authDomain: "nnsl-6557d.firebaseapp.com",
    projectId: "nnsl-6557d",
    storageBucket: "nnsl-6557d.firebasestorage.app",
    messagingSenderId: "340949229001",
    appId: "1:340949229001:web:287d064c31de578a4f5c18"
};

/**
 * Checks whether Firebase credentials have been configured by the organizer.
 * @returns {boolean} True if placeholder values have been replaced with valid project values.
 */
export function isFirebaseConfigured() {
    return Boolean(
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== "YOUR_API_KEY" &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== "YOUR_PROJECT_ID"
    );
}

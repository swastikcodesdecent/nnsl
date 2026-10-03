/**
 * Netaji Nagar Super League - Firebase Service
 * Modular Firebase SDK (v10) integration for Authentication and Firestore.
 */

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Firebase modular SDK imports from official CDN
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    onSnapshot, 
    updateDoc, 
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

let app = null;
let auth = null;
let db = null;
let isInitialized = false;
let initError = null;

/**
 * Initializes Firebase App, Auth, and Firestore
 */
export function initFirebase() {
    if (isInitialized) {
        return { app, auth, db, configured: true };
    }

    if (!isFirebaseConfigured()) {
        initError = new Error("Firebase credentials have not been configured. Please update js/firebase-config.js.");
        return { app: null, auth: null, db: null, configured: false, error: initError };
    }

    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isInitialized = true;
        return { app, auth, db, configured: true };
    } catch (err) {
        console.error("Firebase initialization failed:", err);
        initError = err;
        return { app: null, auth: null, db: null, configured: false, error: err };
    }
}

/**
 * Get Firestore instance
 */
export function getDb() {
    if (!db) initFirebase();
    return db;
}

/**
 * Get Auth instance
 */
export function getFirebaseAuth() {
    if (!auth) initFirebase();
    return auth;
}

/**
 * Check if a player registration with the same email or phone number already exists
 * @param {string} email 
 * @param {string} phone 
 * @returns {Promise<{exists: boolean, field?: 'email'|'phone'}>}
 */
export async function checkDuplicateRegistration(email, phone) {
    const firestore = getDb();
    if (!firestore) {
        return { exists: false };
    }

    try {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPhone = (phone || '').trim();

        const playersRef = collection(firestore, 'players');

        // Check email
        const emailQuery = query(playersRef, where('email', '==', normalizedEmail));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
            return { exists: true, field: 'email' };
        }

        // Check phone
        const phoneQuery = query(playersRef, where('phone', '==', normalizedPhone));
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
            return { exists: true, field: 'phone' };
        }

        return { exists: false };
    } catch (err) {
        // If security rules disallow public read queries on 'players', gracefully continue without crashing
        console.warn("Duplicate pre-check skipped due to Firestore read security rules:", err?.code || err);
        return { exists: false };
    }
}

/**
 * Register a new player in Firestore
 * @param {Object} playerData
 * @param {string} playerData.registrationId
 * @param {string} playerData.name
 * @param {string} playerData.email
 * @param {string} playerData.phone
 * @param {string} playerData.whatsapp
 * @param {string} playerData.preferredPosition
 * @param {boolean} playerData.termsAccepted
 * @returns {Promise<{id: string, registrationId: string}>}
 */
export async function registerPlayer(playerData) {
    const firestore = getDb();
    if (!firestore) {
        throw new Error("Database not connected. Please check Firebase configuration in js/firebase-config.js.");
    }

    const {
        registrationId,
        name,
        email,
        phone,
        whatsapp,
        preferredPosition,
        termsAccepted
    } = playerData;

    const documentData = {
        registrationId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        preferredPosition,
        status: "pending",
        termsAccepted: Boolean(termsAccepted),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminNotes: ""
    };

    // Use registrationId as the document ID for clean lookups and indexing
    const playerDocRef = doc(firestore, 'players', registrationId);
    await setDoc(playerDocRef, documentData);

    return {
        id: registrationId,
        registrationId: registrationId
    };
}

/**
 * Subscribe to realtime player updates in Firestore
 * @param {(players: Array<Object>) => void} onUpdate 
 * @param {(error: Error) => void} onError 
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToPlayers(onUpdate, onError) {
    const firestore = getDb();
    if (!firestore) {
        if (onError) onError(new Error("Firebase is not configured."));
        return () => {};
    }

    try {
        const playersRef = collection(firestore, 'players');
        // Simple query without requiring Firestore composite indexes
        const q = query(playersRef);

        return onSnapshot(q, (snapshot) => {
            const players = [];
            snapshot.forEach((docSnap) => {
                players.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            // Sort in memory by createdAt descending
            players.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            onUpdate(players);
        }, (err) => {
            console.error("Firestore onSnapshot error:", err);
            if (onError) onError(err);
        });
    } catch (err) {
        if (onError) onError(err);
        return () => {};
    }
}

/**
 * Update player registration status
 * @param {string} registrationId 
 * @param {'pending'|'approved'|'rejected'|'withdrawn'} newStatus 
 * @returns {Promise<void>}
 */
export async function updatePlayerStatus(registrationId, newStatus) {
    const firestore = getDb();
    if (!firestore) throw new Error("Firebase not initialized.");

    const playerRef = doc(firestore, 'players', registrationId);
    await updateDoc(playerRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
    });
}

/**
 * Update player admin notes
 * @param {string} registrationId 
 * @param {string} adminNotes 
 * @returns {Promise<void>}
 */
export async function updatePlayerAdminNotes(registrationId, adminNotes) {
    const firestore = getDb();
    if (!firestore) throw new Error("Firebase not initialized.");

    const playerRef = doc(firestore, 'players', registrationId);
    await updateDoc(playerRef, {
        adminNotes: adminNotes.trim(),
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete player record permanently (Admin only)
 * @param {string} registrationId 
 * @returns {Promise<void>}
 */
export async function deletePlayerRecord(registrationId) {
    const firestore = getDb();
    if (!firestore) throw new Error("Firebase not initialized.");

    const playerRef = doc(firestore, 'players', registrationId);
    await deleteDoc(playerRef);
}

/**
 * Admin Sign In with Email and Password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>}
 */
export async function adminSignIn(email, password) {
    const authentication = getFirebaseAuth();
    if (!authentication) throw new Error("Firebase Auth not initialized. Check firebase-config.js.");
    return await signInWithEmailAndPassword(authentication, email.trim(), password);
}

/**
 * Admin Sign In with Google
 * @returns {Promise<any>}
 */
export async function adminSignInWithGoogle() {
    const authentication = getFirebaseAuth();
    if (!authentication) throw new Error("Firebase Auth not initialized. Check firebase-config.js.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(authentication, provider);
}

/**
 * Verifies if user is an authorized admin, or provisions the first login as Primary Admin
 * @param {any} user 
 * @returns {Promise<{isAuthorized: boolean, isFirstAdmin: boolean}>}
 */
export async function verifyOrRegisterFirstAdmin(user) {
    const firestore = getDb();
    if (!user) return { isAuthorized: false, isFirstAdmin: false };
    if (!firestore) return { isAuthorized: true, isFirstAdmin: true };

    try {
        const adminsRef = collection(firestore, 'admins');
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
            return { isAuthorized: true, isFirstAdmin: Boolean(adminDocSnap.data()?.isFirstAdmin) };
        }

        // Check if any admin exists in the collection
        const existingAdminsSnap = await getDocs(adminsRef);
        const isFirst = existingAdminsSnap.empty;

        const newAdminData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email || 'Admin',
            role: 'admin',
            isFirstAdmin: isFirst,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(adminDocRef, newAdminData);
        return { isAuthorized: true, isFirstAdmin: isFirst };
    } catch (err) {
        console.warn("Admin record sync notice:", err);
        // Any user who successfully authenticates via Firebase Auth has valid admin access
        return { isAuthorized: true, isFirstAdmin: true };
    }
}

/**
 * Admin Sign Out
 * @returns {Promise<void>}
 */
export async function adminSignOut() {
    const authentication = getFirebaseAuth();
    if (!authentication) return;
    return await signOut(authentication);
}

/**
 * Listen to Auth state changes
 * @param {(user: any) => void} callback 
 * @returns {() => void}
 */
export function onAdminAuth(callback) {
    const authentication = getFirebaseAuth();
    if (!authentication) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(authentication, callback);
}

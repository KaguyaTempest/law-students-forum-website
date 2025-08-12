// scripts/auth-service.js - SECURE + VALIDATED VERSION

import { auth, db, functions } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    httpsCallable
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// Cloud Function for hashing sensitive IDs
const hashSensitiveIdCallable = httpsCallable(functions, 'hashSensitiveId');

/**
 * Normalize email: lowercase + trim spaces
 */
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

/**
 * Validate password strength
 * Requirements:
 * - Min 8 chars
 * - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
        password.length >= minLength &&
        hasUpper &&
        hasLower &&
        hasNumber &&
        hasSpecial
    );
}

/**
 * Registers a new user with Firebase Auth and stores profile data securely.
 */
export async function registerUser(email, password, userData) {
    try {
        // Normalize & validate input
        const normalizedEmail = normalizeEmail(email);

        if (!validatePassword(password)) {
            throw new Error(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
            );
        }

        const { username, role, idType, plainTextSensitiveId, profileData } = userData;

        // Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const user = cred.user;
        console.log("Firebase Auth user created:", user.uid);

        // Prepare safe user profile object (NO sensitive IDs here)
        const userProfileData = {
            username,
            email: normalizedEmail,
            role,
            status:
                role === 'student'
                    ? 'law_student'
                    : role === 'lawyer'
                        ? 'lawyer'
                        : 'observer',
            createdAt: serverTimestamp(),
            ...profileData
        };

        // Store profile in Firestore
        await setDoc(doc(db, 'users', user.uid), userProfileData);

        // Hash sensitive ID (if provided) via Cloud Function
        if (idType && plainTextSensitiveId) {
            try {
                const result = await hashSensitiveIdCallable({
                    userId: user.uid,
                    idType,
                    plainTextId: plainTextSensitiveId
                });
                console.log("Sensitive ID processed:", result.data.message);
            } catch (hashError) {
                console.warn("ID hashing failed (non-critical):", hashError);
            }
        }

        return user;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
}

/**
 * Logs a user in with Firebase Auth.
 */
export async function loginUser(email, password) {
    try {
        const normalizedEmail = normalizeEmail(email);
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

/**
 * Logs the current user out.
 */
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}

/**
 * Listen for auth state changes.
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile data from Firestore.
 */
export async function getUserProfile(uid) {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

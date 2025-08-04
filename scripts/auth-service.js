// scripts/auth-service.js
// This file is a pure service module that handles Firebase Authentication and Firestore logic.
// It is imported by auth-modal.js.

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


const hashSensitiveIdCallable = httpsCallable(functions, 'hashSensitiveId');

/**
 * Registers a new user with Firebase Auth and stores profile data in Firestore.
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @param {string} role
 * @param {string} idType - 'studentId' or 'lawyerNumber'
 * @param {string} plainTextSensitiveId
 * @param {object} profileData - Non-sensitive data like university, yearOfStudy, etc.
 */
export async function registerUser(email, password, username, role, idType, plainTextSensitiveId, profileData) {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Firebase Auth user created:", cred.user.uid);

        const userProfileData = {
            username,
            email,
            role,
            status: role === 'student' ? 'law_student' : role === 'lawyer' ? 'lawyer' : 'spectator',
            createdAt: serverTimestamp(),
            ...profileData
        };

        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(userDocRef, userProfileData, { merge: true });

        if (idType && plainTextSensitiveId) {
            const hashResult = await hashSensitiveIdCallable({ idType, plainTextId: plainTextSensitiveId });
            console.log("Sensitive ID hashing result:", hashResult.data.message);
        }
        return cred.user;

    } catch (err) {
        console.error("Error during registration:", err);
        throw err;
    }
}

/**
 * Logs a user in with Firebase Auth.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (err) {
        console.error("Error during login:", err);
        throw err;
    }
}

/**
 * Logs the current user out.
 */
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (err) {
        console.error("Error during logout:", err);
        throw err;
    }
}

/**
 * A reusable listener for Firebase Auth state changes.
 * @param {Function} callback - A function to be called with the user object or null.
 */
export function onAuthChange(callback) {
    onAuthStateChanged(auth, callback);
}

// NOTE: We have not included the `verifySensitiveIdCallable` here, as it's an advanced
// feature that you would typically call from an admin-only script.

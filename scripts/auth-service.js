// scripts/auth-service.js
// Secure Firebase Auth & Firestore helper module
// Handles user registration, login, logout, profile retrieval, and sensitive ID hashing.

import { auth, db, functions } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// Cloud Function callable (must be deployed)
const hashSensitiveIdCallable = httpsCallable(functions, 'hashSensitiveId');

/* -------------------------
   Helpers
   ------------------------- */

/**
 * Normalize email by trimming spaces and converting to lowercase
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  return email.trim().toLowerCase();
}

/**
 * Validate password strength
 * FIX: Reduced strictness to improve sign-up rates.
 * - Minimum 6 characters (Firebase minimum)
 * - Requires a mix of at least 2 character types (e.g., lowercase + number)
 * @param {string} password
 * @returns {boolean}
 */
function validatePasswordStrength(password) {
  const minLength = 6; // Reduced from 8 to 6 (Firebase minimum)
  
  if (!password || password.length < minLength) {
      return false;
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Check for at least 2 different character types for moderate strength
  const characterTypesCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  return characterTypesCount >= 2;
}

/**
 * Whitelist allowed profile keys to avoid accidental or malicious fields
 * @param {object} profileData
 * @returns {object} sanitized profile data
 */
function sanitizeProfileData(profileData = {}) {
  const allowed = ['university', 'yearOfStudy', 'yearsExperience', 'bio', 'displayName'];
  return Object.fromEntries(
    Object.entries(profileData || {}).filter(([k]) => allowed.includes(k))
  );
}

/* -------------------------
   Main exported functions
   ------------------------- */

/**
 * Registers a new user (secure).
 * - Normalizes email
 * - Validates password strength (now less strict)
 * - Creates Firebase Auth user
 * - Stores safe profile fields in Firestore
 * - Calls cloud function to hash sensitive ID if provided
 * @param {string} email
 * @param {string} password
 * @param {object} userData - {username, role, idType, plainTextSensitiveId, profileData}
 * @returns {Promise<User>} Firebase user object
 */
export async function registerUser(email, password, userData = {}) {
  try {
    const normalizedEmail = normalizeEmail(email);

    // Password strength check (uses the less strict validation)
    if (!validatePasswordStrength(password)) {
      // The error message remains descriptive and now aligns with the new minimum of 6 characters
      const err = new Error('Password must be at least 6 characters long and include a mix of at least two character types (e.g., letters and numbers).');
      err.code = 'auth/weak-password-client';
      throw err;
    }

    const { username, role, idType, plainTextSensitiveId, profileData } = userData;

    // Create user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = cred.user;
    console.log('Firebase Auth user created:', user.uid);

    // Prepare safe profile (no plaintext sensitive IDs)
    const safeProfile = sanitizeProfileData(profileData);
    const userProfileData = {
      username,
      email: normalizedEmail,
      role,
      status: role === 'student' ? 'law_student' : role === 'lawyer' ? 'lawyer' : 'observer',
      createdAt: serverTimestamp(),
      ...safeProfile
    };

    // Write profile to Firestore under users/{uid}
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userProfileData, { merge: true });

    // If ID provided, hash it via Cloud Function (non-fatal)
    if (idType && plainTextSensitiveId) {
      try {
        const hashResult = await hashSensitiveIdCallable({
          userId: user.uid,
          idType,
          plainTextId: plainTextSensitiveId
        });
        console.log('Sensitive ID hashing requested:', hashResult.data?.message || 'No message returned');
      } catch (hashErr) {
        console.warn('ID hashing failed (non-fatal):', hashErr);
      }
    }

    return user;

  } catch (err) {
    console.error('registerUser error:', err);
    throw err;
  }
}

/**
 * Logs a user in with Firebase Auth.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function loginUser(email, password) {
  try {
    const normalizedEmail = normalizeEmail(email);
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    return userCredential.user;
  } catch (err) {
    console.error('loginUser error:', err);
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
    console.error('logoutUser error:', err);
    throw err;
  }
}

/**
 * Listen for auth state changes.
 * @param {Function} callback - receives user object or null
 * @returns {Function} unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Retrieves a user's profile data from Firestore.
 * @param {string} uid - Firebase UID
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('getUserProfile error:', err);
    return null;
  }
}

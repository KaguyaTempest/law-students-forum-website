// functions/index.js

// Import necessary Firebase SDKs for Cloud Functions (using v1 syntax)
const functions = require('firebase-functions');
const admin = require('firebase-admin'); // For interacting with Firestore
const bcrypt = require('bcryptjs'); // For hashing sensitive IDs

// Initialize the Firebase Admin SDK.
admin.initializeApp();

// Get a reference to the Firestore database
const db = admin.firestore();

// --- Configuration for Hashing ---
const SALT_ROUNDS = 10;

// =========================================================================
// 1. HTTPS Callable Function: HASH and STORE Sensitive IDs (v1 syntax)
// =========================================================================
exports.hashSensitiveId = functions.https.onCall(async (data, context) => {
    // SECURITY CHECK: Ensure the function is called by an authenticated user.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const uid = context.auth.uid;
    const { idType, plainTextId } = data;

    // INPUT VALIDATION: Basic checks for the received data
    if (!idType || !['studentId', 'lawyerNumber'].includes(idType)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The "idType" field must be either "studentId" or "lawyerNumber".'
        );
    }
    if (!plainTextId || typeof plainTextId !== 'string' || plainTextId.trim() === '') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The "plainTextId" field is required and must be a non-empty string.'
        );
    }

    try {
        // HASHING: Perform the one-way hashing of the sensitive ID
        const hashedId = await bcrypt.hash(plainTextId, SALT_ROUNDS);
        console.log(`User ${uid} submitted ${idType}. Hashed result (first 10 chars): ${hashedId.substring(0, 10)}...`);

        // FIRESTORE STORAGE: Get a reference to the user's document in the 'users' collection
        const userRef = db.collection('users').doc(uid);

        const updateData = {};
        updateData[`sensitiveIds.${idType}`] = hashedId; // { sensitiveIds: { studentId: "hashed_value" } }

        await userRef.set(updateData, { merge: true });

        // Return a success response to the client
        return { success: true, message: `${idType} hashed and stored successfully.` };

    } catch (error) {
        // Error handling: Log the error and return an HttpsError to the client
        console.error("Error hashing or storing sensitive ID:", error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to process sensitive ID.',
            error.message
        );
    }
});

// =========================================================================
// 2. HTTPS Callable Function: VERIFY Sensitive IDs (Optional, v1 syntax)
// =========================================================================
exports.verifySensitiveId = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const uid = context.auth.uid;
    const { idType, plainTextIdToVerify } = data;

    // INPUT VALIDATION
    if (!idType || !['studentId', 'lawyerNumber'].includes(idType)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The "idType" field must be either "studentId" or "lawyerNumber".'
        );
    }
    if (!plainTextIdToVerify || typeof plainTextIdToVerify !== 'string' || plainTextIdToVerify.trim() === '') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The "plainTextIdToVerify" field is required and must be a non-empty string.'
        );
    }

    try {
        // Retrieve the user's profile from Firestore to get the stored hash
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found.'
            );
        }

        const userData = userDoc.data();
        const storedHashedId = userData?.sensitiveIds?.[idType];

        if (!storedHashedId) {
            return { verified: false, message: `No ${idType} found for this user.` };
        }

        // VERIFICATION: Compare the provided plain-text ID with the stored hash
        const isMatch = await bcrypt.compare(plainTextIdToVerify, storedHashedId);

        // Return the verification result
        return { verified: isMatch, message: isMatch ? `${idType} matched.` : `${idType} mismatch.` };

    } catch (error) {
        console.error("Error verifying sensitive ID:", error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to verify sensitive ID.',
            error.message
        );
    }
});
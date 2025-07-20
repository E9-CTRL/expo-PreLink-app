require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const vision = require('@google-cloud/vision');
const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');

const serviceAccount = require('./vision-service-account.json');

// ✅ 🔽 NEW UTILS
const { runOcrCheck } = require('./utils/vision');
const { downloadImageAsBase64 } = require('./utils/imageUtils');

console.log('🚀 Initializing Firebase Admin...');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
});

const db = admin.firestore();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('✅ Firestore, Storage, and SendGrid Ready.');

const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 🔐 SEND OTP
exports.sendNTUVerificationCode = functions
    .region('europe-west2')
    .https.onCall(async (data, context) => {
        const { email } = data;
        console.log('📥 [sendNTUVerificationCode] Requested for:', email);

        if (!email || !email.endsWith('@my.ntu.ac.uk')) {
            console.warn('❌ Invalid NTU email:', email);
            throw new functions.https.HttpsError('invalid-argument', 'Only NTU emails are allowed.');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

        await db.collection('emailVerifications').doc(email).set({ code, expiresAt });

        const msg = {
            to: email,
            from: 'noreply@prelinkverify.co',
            replyTO: 'support@prelinkverify.co',
            subject: 'Your Prelink Verification Code',
            text: `Your verification code is: ${code}`,
            html: `<strong>Your verification code is: ${code}</strong>`,
        };

        try {
            await sgMail.send(msg);
            return { success: true };
        } catch (error) {
            console.error('❌ SendGrid error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to send verification email.');
        }
    });

// 🔑 VERIFY OTP
exports.verifyNTUCode = functions
    .region('europe-west2')
    .https.onCall(async (data, context) => {
        const { email, code } = data;

        if (!email || !code) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing email or code.');
        }

        const doc = await db.collection('emailVerifications').doc(email).get();

        if (!doc.exists) {
            throw new functions.https.HttpsError('not-found', 'No code found.');
        }

        const { code: savedCode, expiresAt } = doc.data();

        if (Date.now() > expiresAt.toMillis()) {
            throw new functions.https.HttpsError('deadline-exceeded', 'Verification code expired.');
        }

        if (savedCode !== code) {
            throw new functions.https.HttpsError('permission-denied', 'Invalid OTP.');
        }

        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch {
            userRecord = await admin.auth().createUser({ email });
        }

        const token = await admin.auth().createCustomToken(userRecord.uid);
        return { token };
    });

// ✅ FULL VERIFICATION: FACE + OCR
exports.verifyIdentity = functions
    .runWith({ memory: '512MB', timeoutSeconds: 60 })
    .region('europe-west2')
    .https.onCall(async (data, context) => {
        const { selfieUrl, idCardUrl, userId, enteredName, enteredDOB } = data;

        if (!selfieUrl || !idCardUrl || !userId || !enteredName || !enteredDOB) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        try {
            const selfieBase64 = await downloadImageAsBase64(selfieUrl);
            const idCardBase64 = await downloadImageAsBase64(idCardUrl);

            const compareParams = {
                SourceImage: { Bytes: Buffer.from(selfieBase64, 'base64') },
                TargetImage: { Bytes: Buffer.from(idCardBase64, 'base64') },
                SimilarityThreshold: 93
            };

            const rekogResult = await rekognition.send(new CompareFacesCommand(compareParams));
            const faceMatch = rekogResult.FaceMatches && rekogResult.FaceMatches[0];

            if (!faceMatch || faceMatch.Similarity < 93) {
                throw new functions.https.HttpsError('unauthenticated', 'Face match failed');
            }

            const ocrPassed = await runOcrCheck(idCardBase64, enteredName, enteredDOB);
            if (!ocrPassed) {
                throw new functions.https.HttpsError('unauthenticated', 'OCR match failed');
            }

            await db.collection('verifications').doc(userId).set({
                verified: true,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
                reverificationRequired: false
            });

            return { success: true };
        } catch (err) {
            console.error('🔥 Full verification failed:', err.message);
            throw new functions.https.HttpsError('internal', 'Verification error', err.message);
        }
    });

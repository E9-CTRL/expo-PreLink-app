require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const vision = require('@google-cloud/vision');
const serviceAccount = require('./vision-service-account.json');
const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');

dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
});

const db = admin.firestore();

// ✅ Google Vision
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

// ✅ AWS Rekognition
const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// ✅ OCR Helper
async function runOcrCheck(base64Image, enteredName, enteredDOB) {
    try {
        const [result] = await visionClient.textDetection({
            image: { content: Buffer.from(base64Image, 'base64') }
        });

        const text = result?.fullTextAnnotation?.text || '';
        const normalizedText = text.toLowerCase();

        // Normalize DOB to match different formats (dd/mm/yyyy or yyyy-mm-dd)
        const dobRegex = new RegExp(enteredDOB.replace(/\//g, '[-/]'), 'i');
        const nameMatch = normalizedText.includes(enteredName.toLowerCase());
        const dobMatch = dobRegex.test(normalizedText);

        console.log('🔍 OCR extracted text:', text);
        console.log('🔎 Looking for name:', enteredName);
        console.log('🔎 Looking for DOB:', enteredDOB);
        console.log('✅ Name match:', nameMatch);
        console.log('✅ DOB match:', dobMatch);

        return nameMatch && dobMatch;
    } catch (err) {
        console.error('🔴 OCR error:', err.message, err.stack);
        return false;
    }
}

// ✅ Main Function
exports.verifyIdentity = functions
    .runWith({ memory: '512MB', timeoutSeconds: 60 })
    .region('europe-west2')
    .https.onCall(async (data, context) => {
        const { selfieBase64, idCardBase64, userId, enteredName, enteredDOB } = data;

        console.log('📥 Incoming verifyIdentity call:', {
            userId,
            enteredName,
            enteredDOB,
            selfiePresent: !!selfieBase64,
            idCardPresent: !!idCardBase64
        });

        if (!selfieBase64 || !idCardBase64 || !userId || !enteredName || !enteredDOB) {
            console.warn('⚠️ Missing field:', { selfieBase64, idCardBase64, userId, enteredName, enteredDOB });
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        try {
            // ✅ Step 1: Face Match
            const compareParams = {
                SourceImage: { Bytes: Buffer.from(selfieBase64, 'base64') },
                TargetImage: { Bytes: Buffer.from(idCardBase64, 'base64') },
                SimilarityThreshold: 93
            };

            const rekogResult = await rekognition.send(new CompareFacesCommand(compareParams));
            const faceMatch = rekogResult.FaceMatches && rekogResult.FaceMatches[0];
            console.log('📷 Face match similarity:', faceMatch?.Similarity);

            if (!faceMatch || faceMatch.Similarity < 93) {
                console.warn('❌ Face match failed or below threshold');
                throw new functions.https.HttpsError('unauthenticated', 'Face match failed or confidence too low');
            }

            // ✅ Step 2: OCR Name + DOB check
            const ocrPassed = await runOcrCheck(idCardBase64, enteredName, enteredDOB);
            if (!ocrPassed) {
                console.warn('❌ OCR check failed: Name or DOB mismatch');
                throw new functions.https.HttpsError('unauthenticated', 'OCR check failed: Name or DOB mismatch');
            }

            // ✅ Step 3: Firestore write
            console.log('📚 Writing verification status to Firestore for:', userId);
            await db.collection('verifications').doc(userId).set({
                verified: true,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Verification completed successfully for:', userId);
            return { success: true };
        } catch (err) {
            console.error('🔥 Full function failure:', err.message, err.stack);
            throw new functions.https.HttpsError('internal', 'Verification error', err.message);
        }
    });

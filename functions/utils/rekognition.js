// functions/utils/rekognition.js

require('dotenv').config(); // ✅ load env variables

const AWS = require('aws-sdk');

// ✅ Correct region for London (UK) setup
const rekognition = new AWS.Rekognition({
    region: process.env.AWS_REGION, // now uses env file: eu-west-2
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Compare face in selfie with face on ID (e.g., NTU ID or Passport)
 * @param {Buffer} sourceImageBuffer - Buffer of selfie image
 * @param {Buffer} targetImageBuffer - Buffer of document image
 * @returns {Promise<number>} - Confidence score (0-100)
 */
async function compareFaces(sourceImageBuffer, targetImageBuffer) {
    const params = {
        SourceImage: { Bytes: sourceImageBuffer },
        TargetImage: { Bytes: targetImageBuffer },
        SimilarityThreshold: 80,
    };

    try {
        const response = await rekognition.compareFaces(params).promise();
        if (response.FaceMatches.length > 0) {
            return response.FaceMatches[0].Similarity;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('🔴 Error in compareFaces:', error);
        return 0;
    }
}

module.exports = {
    compareFaces,
};

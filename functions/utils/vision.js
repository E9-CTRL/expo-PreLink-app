// functions/utils/vision.js
require('dotenv').config();
const vision = require('@google-cloud/vision');
const path = require('path');

const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

/**
 * Runs OCR on a base64 image and checks for matching name and DOB.
 * @param {string} base64Image
 * @param {string} enteredName
 * @param {string} enteredDOB
 * @returns {Promise<boolean>}
 */
async function runOcrCheck(base64Image, enteredName, enteredDOB) {
    try {
        const [result] = await visionClient.textDetection({
            image: { content: Buffer.from(base64Image, 'base64') },
        });

        const text = result?.fullTextAnnotation?.text || '';
        const normalizedText = text.toLowerCase();

        const dobRegex = new RegExp(enteredDOB.replace(/\//g, '[-/]'), 'i');
        const nameMatch = normalizedText.includes(enteredName.toLowerCase());
        const dobMatch = dobRegex.test(normalizedText);

        console.log('🔎 OCR Text:', normalizedText);
        console.log('✅ Name Match:', nameMatch, '| DOB Match:', dobMatch);

        return nameMatch && dobMatch;
    } catch (error) {
        console.error('❌ Error in OCR:', error.message);
        return false;
    }
}

module.exports = { runOcrCheck };

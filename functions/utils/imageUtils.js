// functions/utils/imageUtils.js
const axios = require('axios');

/**
 * Downloads image from a public Firebase URL and returns it as base64.
 * @param {string} url - Public Firebase image URL
 * @returns {Promise<string>} base64-encoded image
 */
async function downloadImageAsBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return base64;
    } catch (error) {
        console.error('❌ Failed to download/convert image:', error.message);
        throw new Error('Could not convert image to base64.');
    }
}

module.exports = {
    downloadImageAsBase64,
};

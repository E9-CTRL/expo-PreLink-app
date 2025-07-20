const { createClient } = require('@supabase/supabase-js');
const AWS = require('aws-sdk');
const vision = require('@google-cloud/vision');
const axios = require('axios');
require('dotenv').config();

// 🔐 Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 🔐 AWS Rekognition (London region)
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const rekognition = new AWS.Rekognition();

// 🔐 Google Vision setup
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// 📥 Utility: Fetch image and convert to Buffer
async function fetchImageBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

// 🚀 Main function
module.exports = async function verifyIdentity(req, res) {
  try {
    const {
      userId,
      selfieUrl,
      idCardUrl,
      ntuFrontUrl,
      ntuBackUrl,
      enteredName,
      enteredDOB,
      email
    } = req.body;

    if (!userId || !selfieUrl || !idCardUrl || !enteredName || !enteredDOB) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // 📥 Download image data
    const [selfieBuffer, idCardBuffer] = await Promise.all([
      fetchImageBuffer(selfieUrl),
      fetchImageBuffer(idCardUrl),
    ]);

    // ✅ 1. Face match (AWS Rekognition - 93% threshold)
    const faceResult = await rekognition.compareFaces({
      SourceImage: { Bytes: selfieBuffer },
      TargetImage: { Bytes: idCardBuffer },
      SimilarityThreshold: 93,
    }).promise();

    const faceMatch = faceResult.FaceMatches.length > 0;
    const confidence = faceResult.FaceMatches[0]?.Similarity || 0;

    if (!faceMatch) {
      return res.status(200).json({
        success: false,
        message: 'Face match failed (below 93% threshold)',
        confidence,
      });
    }

    // ✅ 2. OCR match (Google Vision)
    const [ocrResult] = await visionClient.textDetection(idCardUrl);
    const ocrText = ocrResult.fullTextAnnotation?.text || '';

    const nameMatch = ocrText.toLowerCase().includes(enteredName.toLowerCase().replace(/\s+/g, ''));
    const dobDigits = enteredDOB.replace(/[^0-9]/g, '');
    const dobMatch = ocrText.replace(/[^0-9]/g, '').includes(dobDigits);

    if (!nameMatch || !dobMatch) {
      return res.status(200).json({
        success: false,
        message: 'OCR failed: name or DOB not found in ID card',
      });
    }

    // 🕒 Timestamps
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(now.getFullYear() + 1);

    // 📤 Insert or update in Supabase
    const { error } = await supabase.from('verifications').upsert({
      user_id: userId,
      name: enteredName,
      dob: enteredDOB,
      selfie_url: selfieUrl,
      id_card_url: idCardUrl,
      ntu_card_front_url: ntuFrontUrl,
      ntu_card_back_url: ntuBackUrl,
      is_verified: true,
      verified_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    });

    if (error) throw error;

    // 📧 Optional: Send email confirmation (if key exists)
    if (process.env.SENDGRID_API_KEY && email) {
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email }] }],
          from: { email: 'no-reply@prelink.app', name: 'PreLink Identity' },
          subject: '✅ Your Identity is Verified',
          content: [
            {
              type: 'text/plain',
              value: `Hi ${enteredName}, your PreLink identity has been successfully verified.`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // ✅ All good
    return res.status(200).json({
      success: true,
      confidence,
      message: 'Verification successful',
    });

  } catch (err) {
    console.error('❌ Verification error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Unknown server error',
    });
  }
};

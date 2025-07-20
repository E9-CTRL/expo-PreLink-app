// /src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

import validatePassport from './utils/validatePassport';
import validateNTUCard from './utils/validateNTUCard';
import compareNames from './utils/matchNames';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// === AWS Rekognition Config ===
AWS.config.update({
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const rekognition = new AWS.Rekognition();

// === Supabase Init ===
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// === Google Vision API Endpoint
const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;

// === Health Check
app.get('/', (req, res) => {
  res.send('✅ PreLink Verification Server is alive');
});

// === Main Verification Route
app.post(
  '/compare-faces',
  upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'ntuCardFront', maxCount: 1 },
  ]),
  async (req, res) => {
    let extractedName = null;
    let extractedDOB = null;
    let ntuExtractedName = null;

    try {
      const { selfie, idCard, ntuCardFront } = req.files;
      const uid = req.body.uid || 'unknown-user';

      if (!selfie || !idCard || !ntuCardFront) {
        return res.status(400).json({
          success: false,
          error: 'All three files are required: selfie, idCard, ntuCardFront',
        });
      }

      const selfieBuffer = fs.readFileSync(path.resolve(selfie[0].path));
      const idCardBuffer = fs.readFileSync(path.resolve(idCard[0].path));
      const ntuCardBuffer = fs.readFileSync(path.resolve(ntuCardFront[0].path));

      const compareFaces = async (source, target) => {
        const result = await rekognition
          .compareFaces({
            SourceImage: { Bytes: source },
            TargetImage: { Bytes: target },
            SimilarityThreshold: 95,
          })
          .promise();
        return result.FaceMatches?.[0]?.Similarity || 0;
      };

      const simSelfieID = await compareFaces(selfieBuffer, idCardBuffer);
      const simSelfieNTU = await compareFaces(selfieBuffer, ntuCardBuffer);
      const simIDNTU = await compareFaces(idCardBuffer, ntuCardBuffer);

      const matchSelfieID = simSelfieID >= 95;
      const matchSelfieNTU = simSelfieNTU >= 95;
      const matchIDNTU = simIDNTU >= 95;
      const overallVerified = matchSelfieID && matchSelfieNTU && matchIDNTU;

      // === OCR ID CARD (Passport)
      const idOcr = await axios.post(
        GOOGLE_VISION_ENDPOINT,
        {
          requests: [
            {
              image: { content: idCardBuffer.toString('base64') },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
      );

      const idFullText = idOcr.data.responses?.[0]?.textAnnotations?.[0]?.description || '';
      const idResult = validatePassport(idFullText);
      extractedName = idResult?.name || null;
      extractedDOB = idResult?.dob || null;

      // === OCR NTU CARD
      const ntuOcr = await axios.post(
        GOOGLE_VISION_ENDPOINT,
        {
          requests: [
            {
              image: { content: ntuCardBuffer.toString('base64') },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
      );

      const ntuFullText = ntuOcr.data.responses?.[0]?.textAnnotations?.[0]?.description || '';
      const ntuResult = validateNTUCard(ntuFullText);
      ntuExtractedName = ntuResult?.name || null;

      const ntuCardToPassportNameMatch =
        extractedName && ntuExtractedName
          ? compareNames(extractedName, ntuExtractedName)
          : false;

      // === Log in Supabase
      await supabase.from('verifications').insert([
        {
          uid,
          status: overallVerified && ntuCardToPassportNameMatch ? 'success' : 'no_match',
          similarity: Math.min(simSelfieID, simSelfieNTU, simIDNTU),
          name: extractedName,
          dob: extractedDOB,
          ntuName: ntuExtractedName,
          ntuMatch: ntuCardToPassportNameMatch,
          method: 'aws_rekognition + google_ocr',
          timestamp: new Date().toISOString(),
        },
      ]);

      return res.json({
        success: overallVerified && ntuCardToPassportNameMatch,
        matches: {
          selfieToID: matchSelfieID,
          selfieToNTU: matchSelfieNTU,
          idToNTU: matchIDNTU,
          ntuToPassport: ntuCardToPassportNameMatch,
        },
        similarities: {
          selfieToID: simSelfieID,
          selfieToNTU: simSelfieNTU,
          idToNTU: simIDNTU,
        },
        name: extractedName,
        dob: extractedDOB,
        ntuName: ntuExtractedName,
      });
    } catch (err) {
      console.error('❌ Error:', err.message);
      await supabase.from('verifications').insert([
        {
          uid: req.body.uid || 'unknown-user',
          status: 'failed',
          similarity: null,
          name: null,
          dob: null,
          error: err.message,
          method: 'aws_rekognition + google_ocr',
          timestamp: new Date().toISOString(),
        },
      ]);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// @ts-nocheck

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { encode as base64encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { sha256 } from "https://deno.land/x/sha256@v1.0.0/mod.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

// 🔐 Reusable hash helper
const hashHex = (input: string) =>
    new Sha256().update(new TextEncoder().encode(input)).toString();

serve(async (req) => {
    try {
        const { selfieUrl, idCardUrl } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL"),
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        );

        const fetchImageBuffer = async (url) => {
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        };

        const selfieImage = await fetchImageBuffer(selfieUrl);
        const idCardImage = await fetchImageBuffer(idCardUrl);

        // AWS Rekognition credentials
        const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
        const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
        const region = "eu-west-2";
        const service = "rekognition";
        const host = `rekognition.${region}.amazonaws.com`;

        // 🧠 Rekognition payload
        const payload = JSON.stringify({
            SourceImage: { Bytes: Array.from(selfieImage) },
            TargetImage: { Bytes: Array.from(idCardImage) },
            SimilarityThreshold: 90,
        });

        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = amzDate.slice(0, 8);

        const canonicalRequest = [
            "POST",
            "/",
            "",
            `content-type:application/x-amz-json-1.1`,
            `host:${host}`,
            `x-amz-date:${amzDate}`,
            `x-amz-target:RekognitionService.CompareFaces`,
            "",
            "content-type;host;x-amz-date;x-amz-target",
            hashHex(payload),
        ].join("\n");

        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const stringToSign = [
            "AWS4-HMAC-SHA256",
            amzDate,
            credentialScope,
            hashHex(canonicalRequest),
        ].join("\n");

        const getSignatureKey = (key, dateStamp, regionName, serviceName) => {
            const kDate = hmac("sha256", "AWS4" + key, dateStamp);
            const kRegion = hmac("sha256", kDate, regionName);
            const kService = hmac("sha256", kRegion, serviceName);
            return hmac("sha256", kService, "aws4_request");
        };

        const signatureKey = getSignatureKey(
            secretAccessKey,
            dateStamp,
            region,
            service
        );
        const signature = hmac("sha256", signatureKey, stringToSign, "hex");

        const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${signature}`;

        // ✅ Rekognition request
        const rekRes = await fetch(`https://${host}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Date": amzDate,
                "X-Amz-Target": "RekognitionService.CompareFaces",
                Authorization: authHeader,
            },
            body: payload,
        });

        const rekData = await rekRes.json();

        if (!rekData.FaceMatches || rekData.FaceMatches.length === 0) {
            return new Response(
                JSON.stringify({ success: false, reason: "Face mismatch" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const confidence = rekData.FaceMatches[0].Similarity;
        console.log("✅ Face match confidence:", confidence);

        // 🧠 OCR via Google Vision
        const VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");

        const visionRes = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requests: [
                        {
                            image: { source: { imageUri: idCardUrl } },
                            features: [{ type: "TEXT_DETECTION" }],
                        },
                    ],
                }),
            }
        );

        const visionJson = await visionRes.json();
        const textAnnotations = visionJson.responses?.[0]?.textAnnotations || [];
        const fullText =
            textAnnotations.length > 0 ? textAnnotations[0].description : null;

        if (!fullText) {
            return new Response(
                JSON.stringify({ success: false, reason: "No text detected in ID card" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("📝 Extracted text:", fullText);

        return new Response(
            JSON.stringify({
                success: true,
                confidence,
                extractedText: fullText,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error("❌ Verification error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});

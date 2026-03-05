import dotenv from "dotenv";
dotenv.config();
import express from "express";
import uploadFileToS3 from "./services/s3Upload.js";
import multer from "multer";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./config/s3Client.js";

const app = express();
const upload = multer();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY);

app.post("/upload-profile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const fileUrl = await uploadFileToS3(req.file);

    res.status(200).json({
      message: "File uploaded successfully",
      fileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// Pre-Signed URL

// Step 1
// React → request upload URL

// Step 2
// Node → generate signed URL

// Step 3
// React → upload file directly to S3

// Step 4
// S3 stores file

app.get("/generate-upload-url", async (req, res) => {
  try {
    const fileName = req.query.fileName;
    const fileType = req.query.fileType;

    const key = `employees/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    res.json({
      uploadUrl: signedUrl,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Download URL API
app.get("/generate-download-url", async (req, res) => {
  try {
    const fileName = req.query.fileName;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `employees/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    res.json({
      downloadUrl: signedUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

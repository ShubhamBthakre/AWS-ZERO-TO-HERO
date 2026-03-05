import dotenv from "dotenv";
dotenv.config();
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3Client.js";

const uploadFileToS3 = async (file) => {
  const extension = file.originalname.split(".").pop();
  const key = `employees/${Date.now()}.${extension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);

  await s3Client.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export default uploadFileToS3;

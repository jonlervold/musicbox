import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET;

const getItem = async (body) => {
  const key = body.key; // e.g. "demo.1-album.title.1/manifest.json"

  if (!key) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing key" }),
    };
  }

  try {
    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 }); // 1 hour

    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error generating presigned URL" }),
    };
  }
};

export default getItem;

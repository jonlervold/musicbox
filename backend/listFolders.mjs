import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET;

const listFolders = async (_body) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Delimiter: "/",
  });

  const data = await s3.send(command);

  const folders = (data.CommonPrefixes || []).map((p) => {
    const prefix = p.Prefix || "";

    return prefix.slice(0, -1);
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ folders }),
  };
};

export default listFolders;

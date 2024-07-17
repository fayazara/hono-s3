import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (s3Client) return s3Client;
  const s3Endpoint = process.env.S3_ENDPOINT as string;
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
  if (!s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error(
      "Missing S3 configuration. Please check your environment variables."
    );
  }

  s3Client = new S3Client({
    region: "auto",
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  });

  return s3Client;
};

export class FileStorage {
  private s3Client: S3Client;
  private bucket: string;
  private s3PublicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME ?? "";
    this.s3PublicUrl = process.env.S3_PUBLIC_ACCESS_URL ?? "";
    if (!this.bucket) {
      throw new Error(
        "Missing S3_BUCKET_NAME. Please check your environment variables."
      );
    }

    this.s3Client = getS3Client();
  }

  async upload(key: string, data: Buffer | Blob | string): Promise<void> {
    let body: Buffer | string;
    if (data instanceof Blob) {
      body = Buffer.from(await data.arrayBuffer());
    } else {
      body = data;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Failed to upload file to ${this.bucket}/${key}`);
    }
  }

  getObjectUrl(key: string): string {
    return `${this.s3PublicUrl}/${this.bucket}/${key}`;
  }

  async getClientUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await getS3SignedUrl(
        this.s3Client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn }
      );
    } catch (error) {
      console.error("Error generating client upload URL:", error);
      throw new Error(
        `Failed to generate client upload URL for ${this.bucket}/${key}`
      );
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error(`Failed to delete file from ${this.bucket}/${key}`);
    }
  }

  async getSignedUrlForRead(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await getS3SignedUrl(
        this.s3Client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn }
      );
    } catch (error) {
      console.error("Error generating signed URL for read:", error);
      throw new Error(
        `Failed to generate signed URL for reading ${this.bucket}/${key}`
      );
    }
  }
}

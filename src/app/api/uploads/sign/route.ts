// src/app/api/upload/sign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { key, contentType } = await req.json();
    if (!key || !contentType) {
      return NextResponse.json({ error: "Missing key or contentType" }, { status: 400 });
    }

    const Bucket = process.env.AWS_S3_BUCKET!;
    const Command = new PutObjectCommand({
      Bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, Command, { expiresIn: 60 }); // 60s
    // public URL you can store (adjust if you use CloudFront/private reads)
    const publicUrl = `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ url, publicUrl, key });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "sign failed" }, { status: 500 });
  }
}
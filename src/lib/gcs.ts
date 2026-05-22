import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID?.trim(),
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL?.trim(),
    private_key: process.env.GCS_PRIVATE_KEY?.trim().replace(/\\n/g, "\n"),
  },
});

// Trim pour éviter les espaces accidentels dans la variable d'environnement
export const bucket = storage.bucket((process.env.GCS_BUCKET_NAME ?? "").trim());

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const file = bucket.file(`photos/${filename}`);
  await file.save(buffer, { contentType: mimetype, public: true });
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/photos/${filename}`;
}

export async function deleteFile(filename: string): Promise<void> {
  await bucket.file(`photos/${filename}`).delete({ ignoreNotFound: true });
}

import { fileTypeFromBuffer } from "file-type";

export async function renderBase64File(buffer, mimeType = null) {
  if (!buffer || !Buffer.isBuffer(buffer)) return null;

  if (!mimeType) {
    const detected = await fileTypeFromBuffer(buffer);
    mimeType = detected?.mime || "application/octet-stream"; // fallback
  }

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

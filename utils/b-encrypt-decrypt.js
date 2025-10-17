import crypto from "crypto";
import { getKeysWithUserId } from "../config/b-database.js";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.secret_key;

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

// Helper to convert base64 <-> Buffer
function b642buf(b64) {
  return Buffer.from(b64, "base64");
}
function buf2b64(buf) {
  return Buffer.isBuffer(buf)
    ? buf.toString("base64")
    : Buffer.from(buf).toString("base64");
}

// Encrypt with AES-GCM (Node.js)
export async function encryptData(data, userId, role) {
  const { pubKeyWebCrypto } = await getKeysWithUserId(userId, role);
  // 1. Generate AES key
  const aesKey = crypto.randomBytes(32); // 256-bit key

  // 2. Encrypt data
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const encryptedWithTag = Buffer.concat([encrypted, tag]);

  // 3. Encrypt AES key with client's RSA public key (PEM)
  const encAesKey = crypto.publicEncrypt(
    {
      key: pubKeyWebCrypto, // PEM string
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );

  // 4. Send to browser (all base64)
  return {
    encryptedData: buf2b64(encryptedWithTag),
    iv: buf2b64(iv),
    encAesKey: buf2b64(encAesKey),
  };
}

// Decrypt with AES-GCM (Node.js)
export async function decryptData(payload, userId, role) {
  const encKeys = await getKeysWithUserId(userId, role);
  const encKey = {
    encrypted: encKeys.encrypted,
    iv: encKeys.iv,
  };
  const privateKey = handlePrivateKey("decrypt", secretKey, null, encKey);
  const { encryptedData, iv, encAesKey } = payload;

  // 1. Decrypt AES key using your private RSA key
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey, // PEM or key object
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    b642buf(encAesKey)
  );

  const encryptedWithTag = b642buf(encryptedData);
  const ivBuf = b642buf(iv);

  const ciphertext = Uint8Array.prototype.slice.call(encryptedWithTag, 0, -16);
  const tag = Uint8Array.prototype.slice.call(encryptedWithTag, -16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, ivBuf);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

export function handlePrivateKey(
  action,
  secretKey,
  privateKey = null,
  encryptedData = null
) {
  const key = crypto.createHash("sha256").update(secretKey).digest(); // Derive key
  const iv = crypto.randomBytes(16); // Generate IV (Needed for AES-CBC)

  if (action === "encrypt") {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    return { encrypted, iv: iv.toString("hex") };
  } else if (action === "decrypt") {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(encryptedData.iv, "hex")
    );
    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  throw new Error("Invalid action. Use 'encrypt' or 'decrypt'.");
}

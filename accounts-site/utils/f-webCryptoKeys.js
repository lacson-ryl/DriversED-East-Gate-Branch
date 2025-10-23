import { KeyManager } from "./f-keyManager.js";

export async function generateRawAESKey() {
  // Generate AES-GCM key in browser
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Export key as raw bytes (ArrayBuffer)
  const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
  return { aesKey, rawKey };
}

// Helper to convert ArrayBuffer <-> base64
function ab2b64(buf) {
  if (!(buf instanceof ArrayBuffer || ArrayBuffer.isView(buf))) {
    console.error("ab2b64 received non-buffer:", buf);
    throw new TypeError("ab2b64 expects an ArrayBuffer or TypedArray");
  }

  const uint8 = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunks

  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function b642ab(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function decryptData(payload) {
  if (!payload) {
    console.log("No data inside");
    return;
  }

  const { encryptedData, iv, encAesKey } = payload;
  const privKey = await KeyManager.getPrivateKey();

  // Step 1: Decrypt AES key with RSA private key
  const rawAESKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP", hash: "SHA-256" },
    privKey,
    b642ab(encAesKey)
  );

  // Step 2: Import AES key for use
  const aesCryptoKey = await window.crypto.subtle.importKey(
    "raw",
    rawAESKey,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  // Step 3: Decrypt actual payload
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: b642ab(iv),
      tagLength: 128,
    },
    aesCryptoKey,
    b642ab(encryptedData)
  );

  // Step 4: Convert ArrayBuffer to string and parse JSON
  const plaintext = new TextDecoder().decode(decrypted);
  return JSON.parse(plaintext);
}

// Encrypt with AES-GCM (Web Crypto)
export async function encryptData(data) {
  // 🔄 Normalize FormData to plain object
  if (data instanceof FormData) {
    const normalized = {};
    for (const [key, value] of data.entries()) {
      if (value instanceof File || value instanceof Blob) {
        if (value == null || value.size === 0) {
          normalized[key] = null;
        } else {
          const buffer = await value.arrayBuffer();
          normalized[key] = {
            name: value.name,
            type: value.type,
            size: value.size,
            file: Array.from(new Uint8Array(buffer)),
          };
        }
      } else {
        normalized[key] = value;
      }
    }
    data = normalized;
  }
  const serverPubKey = await KeyManager.getServerPublicKey();
  const { aesKey, rawKey } = await generateRawAESKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  // Encrypt AES key using RSA-OAEP
  const encAESKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP", hash: "SHA-256" },
    serverPubKey,
    rawKey
  );

  // In Web Crypto, tag is appended to ciphertext (last 16 bytes)
  return {
    encryptedData: ab2b64(encrypted),
    iv: ab2b64(iv),
    encAesKey: ab2b64(encAESKey),
  };
}

// Helper to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----.*-----/g, "").replace(/\s/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

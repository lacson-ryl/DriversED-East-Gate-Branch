const db = new window.Dexie("UserEncryptionKeys");

db.version(1).stores({
  rsaKeys: "id, privateKey, serverPublicKey, createdAt",
});

const TTL_MINUTES = 3 * 60;

export const KeyManager = {
  async init() {
    if (!window.crypto) {
      throw new Error(
        "window.crypto",
        "Web Crypto API is not supported in this browser. Please use a modern browser over HTTPS."
      );
    }

    if (!window.crypto.subtle) {
      throw new Error(
        "window.crypto.subtle",
        "Web Crypto API is not supported in this browser. Please use a modern browser over HTTPS."
      );
    }
    const record = await db.rsaKeys.get("client");
    const now = Date.now();

    if (!record || this._isExpired(record.createdAt, now)) {
      if (record)
        console.log("[KeyManager] ⏰ Key expired. Generating new pair...");

      const { publicKey, privateKey } = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedPriv = await crypto.subtle.exportKey("pkcs8", privateKey);
      const privB64 = btoa(
        String.fromCharCode(...new Uint8Array(exportedPriv))
      );
      // Extract and send public key to server
      const exportedPub = await crypto.subtle.exportKey("spki", publicKey);
      const pemPub = arrayBufferToPemPublicKey(exportedPub);

      const response = await fetch("/account/api/public-key/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientPublicKey: pemPub }),
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse JSON from /account/api/public-key/share", e);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data.Error || "Failed to send public key!");
      }
      if (!data.serverPublicKey) {
        throw new Error("No serverPublicKey in response!");
      }

      // expected response is : data.serverPublicKey
      const serverPubB64 = pemToArrayBuffer(data.serverPublicKey);

      await db.rsaKeys.put({
        id: "client",
        privateKey: privB64,
        serverPublicKey: serverPubB64,
        createdAt: now,
      });

      console.log(
        "[KeyManager] 🔑 New key pair generated and public key registered."
      );
    } else {
      console.log("[KeyManager] ✅ Reusing current key from Dexie.");
    }
  },

  async importKeys() {
    const record = await db.rsaKeys.get("client");
    if (!record) throw new Error("Private key not initialized");

    const privBuf = Uint8Array.from(atob(record.privateKey), (c) =>
      c.charCodeAt(0)
    ).buffer;

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privBuf,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );

    return { privateKey };
  },

  async getPrivateKey() {
    const record = await db.rsaKeys.get("client");
    if (!record) throw new Error("Private key not found in Dexie.");
    const privBuf = Uint8Array.from(atob(record.privateKey), (c) =>
      c.charCodeAt(0)
    ).buffer;
    return await crypto.subtle.importKey(
      "pkcs8",
      privBuf,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  },

  async getServerPublicKey() {
    const record = await db.rsaKeys.get("client");
    if (!record) throw new Error("Server public key not found in Dexie.");
    return await crypto.subtle.importKey(
      "spki",
      record.serverPublicKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
  },

  _isExpired(createdAt, now) {
    const diff = now - createdAt;
    return diff > TTL_MINUTES * 60 * 1000;
  },

  async reset() {
    await db.rsaKeys.clear();
    console.log("[KeyManager] 🔄 Key cleared from Dexie.");
  },
};

// Helper to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----.*-----/g, "").replace(/\s/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

// Convert ArrayBuffer (SPKI) to PEM public key string
export function arrayBufferToPemPublicKey(buffer) {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

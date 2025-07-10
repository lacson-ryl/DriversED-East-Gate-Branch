import { encryptData, decryptData } from "../f-webCryptoKeys.js";

import { KeyManager } from "../f-keyManager.js";

document
  .getElementById("encrypting")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const msgBox = document.getElementById("enc-msg-box");

    const encMsg = document.getElementById("encrypt-msg").value;

    const pubKey = await KeyManager.getServerPublicKey();
    const encMessage = await encryptData(encMsg, pubKey);
    console.log("encMessage", encMessage);

    const response = await fetch("/sample/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedData: encMessage.encryptedData,
        iv: encMessage.iv,
        encAesKey: encMessage.encAesKey,
      }),
    });

    if (!response.ok) {
      msgBox.innerText = "Failed to connect to the server";
    }
    const data = await response.json();
    console.log("data", data);
    msgBox.innerText = data.message;
  });

document
  .getElementById("check-keys-dexie")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    const serverPubKey = await KeyManager.getServerPublicKey();
    console.log("serverPubKey", serverPubKey);
    const clientPrivKey = await KeyManager.getPrivateKey();
    console.log("clientPrivKey", clientPrivKey);

    const pubMsg = document.getElementById("public-key-msg");
    const privMsg = document.getElementById("private-key-msg");

    pubMsg.innerText = `Pub key: ${serverPubKey || "Not Found"}`;
    privMsg.innerText = `Priv key: ${clientPrivKey || "Not Found"}`;
  });

document
  .getElementById("decrypting")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const msgBox = document.getElementById("decrypt-msg-box");

    const encMsg = document.getElementById("decrypt-msg").value;

    const clientPrivKey = await KeyManager.getPrivateKey();
    if (!clientPrivKey) {
      msgBox.innerText =
        "Private key not found! Please re-login to generate new keys.";
      return;
    }

    const response = await fetch("/sample/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encMsg }),
    });

    const data = await response.json();
    console.log("data", data);
    if (!response.ok) {
      msgBox.innerText = "Failed to connect to the server";
      throw new Error(data.error);
    }

    const decryptedData = await decryptData(data.encrypted, clientPrivKey);
    console.log("decryptedData", decryptedData);
    msgBox.innerHTML = `
      <div>
        <p>${decryptedData.user_id}</p>
        <p>${decryptedData.user_name}</p>
        <p>${decryptedData.user_password}</p>
        <p>${decryptedData.user_role}</p>
        <p>${decryptedData.isVerify}</p>
        <p>${decryptedData.dat_created}</p>
    </div>
      `;
    return;
  });

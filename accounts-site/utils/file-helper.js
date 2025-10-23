export function openFileViewer({ fileData, fileType, title = "File Viewer" }) {
  const isImage = fileType.startsWith("image/");
  const isPDF = fileType === "application/pdf";

  const blob = base64ToBlob(fileData, fileType);
  const blobUrl = URL.createObjectURL(blob);

  // Choose window size based on file type
  const windowFeatures = isImage
    ? "width=800,height=600,left=100,top=100"
    : `width=${window.screen.width},height=${window.screen.height},left=0,top=0`;

  const newWindow = window.open("", "_blank", windowFeatures);
  if (!newWindow) {
    alert("Popup blocked. Please allow popups for this site.");
    return;
  }

  const content = isImage
    ? `<img src="${blobUrl}" alt="file-preview" />`
    : isPDF
    ? `<embed src="${blobUrl}" type="${fileType}" width="100%" height="100%" />`
    : `<p style="color:white;">Unsupported file type: ${fileType}</p>`;

  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          img, embed {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
      <button id="downloadBtn" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 16px;
        background-color: #00bcd4;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        z-index: 9999;
      ">Download</button>

      ${content}
      
      </body>
    </html>
  `);
  newWindow.document.close();
  newWindow.onload = () => {
    const downloadBtn = newWindow.document.getElementById("downloadBtn");
    applyDownloadBtn(downloadBtn, blobUrl, fileType, title);
  };
}

function base64ToBlob(base64, mimeType) {
  const parts = base64.split(",");
  if (parts.length !== 2 || !parts[1]) {
    throw new Error("Invalid base64 format");
  }

  const cleanBase64 = parts[1].replace(/[^A-Za-z0-9+/=]/g, ""); // ✅ strip invalid chars
  const byteChars = atob(cleanBase64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}

export function applyDownloadBtn(element, file, type, name) {
  element.style.display = "flex";
  // Remove previous click listeners to avoid stacking
  const cloned = element.cloneNode(true);
  element.replaceWith(cloned);
  cloned.addEventListener("click", function () {
    const link = document.createElement("a");
    link.href = file;
    link.download = `${name}.${type.split("/")[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

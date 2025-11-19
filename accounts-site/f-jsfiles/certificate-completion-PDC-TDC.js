import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

console.log("js script");
// Create a Promise that will resolve when all asynchronous tasks are done.
(async () => {
  if (window.fetchedData && Object.keys(window.fetchedData).length !== 0) {
    await populateCertificate(window.fetchedData);
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const courseId = urlParams.get("courseId");
    const instructorId = urlParams.get("instructorId");
    await renderProfileInputs(userId, courseId, instructorId);
  }

  // ✅ Set the flag directly
  window.scriptLoaded = true;
})();

let course;
async function renderProfileInputs(userId, idCourse, idInstructor) {
  try {
    const response = await fetch(
      "/account/api/certificates-completion-pdc-tdc",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: userId,
          courseId: idCourse,
          instructorId: idInstructor,
        }),
      }
    );
    const encrypted = await response.json();
    if (!response.ok) {
      alert("No profile data detected, please fill the form.");
      return;
    }

    const data = await decryptData(encrypted);
    console.log("data", data);
    await populateCertificate(data);
  } catch (error) {
    console.error("Error rendering profile inputs:", error);
    alert("Failed to load profile data.");
  }
}

async function populateCertificate(data) {
  const { certificateInputs, userCourse, userId, courseId, instructorId } =
    data;
  const flatData = {
    ...certificateInputs[0],
    ...userCourse[0],
  };

  course = userCourse[0].courseName;

  Object.entries(flatData).forEach(([key, value]) => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = value ?? "";
  });

  document.getElementById("driversEdLogo").src =
    certificateInputs[0].driversEdLogo;

  const today = new Date();
  const formattedDay = getDayWithSuffix(today); // e.g., "4th"
  const formattedMonthYear = today.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  document.getElementById("day").value = formattedDay;
  document.getElementById("monthYear").value = formattedMonthYear;

  function autoResizeInput(input) {
    input.style.width = input.value.length + 3 + "ch";
  }
  document.querySelectorAll("input[data-autoresize]").forEach(autoResizeInput);

  const buttons = {
    savePdf: "save-to-pdf",
    saveDatabase: "save-to-database",
  };

  Object.values(buttons).forEach((buttonId) => {
    const btn = document.getElementById(buttonId);
    if (btn) {
      btn.setAttribute("data-user-id", userId);
      btn.setAttribute("data-course-id", courseId);
      btn.setAttribute("data-instructor-id", instructorId);
    }
  });
}

function getDayWithSuffix(date = new Date()) {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  return `${day}${suffix}`;
}

const pdfBtn = document.getElementById("save-to-pdf");
pdfBtn.addEventListener("click", handleCertificatePDF);
const dbBtn = document.getElementById("save-to-database");
dbBtn.addEventListener("click", handleCertificatePDF);

async function handleCertificatePDF(event) {
  const button = event.currentTarget;
  const userId = button.getAttribute("data-user-id");
  const instructorId = button.getAttribute("data-instructor-id");
  const courseId = button.getAttribute("data-course-id");
  const type = button.id === "save-to-database" ? "database" : "pdf";

  let btnText;
  if (type == "pdf") {
    btnText = pdfBtn;
  } else {
    btnText = dbBtn;
  }

  button.innerText = "Processing...";
  button.disabled = true;

  // Collect certificate input values
  const fieldNames = [
    "certNumber",
    "name",
    "totalHours",
    "drivingType",
    "dateStarted",
    "dateEnded",
    "courseType",
    "day",
    "monthYear",
    "instructor",
    "proprietor",
    "proprietorCode",
  ];

  const certInputs = {};
  fieldNames.forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    certInputs[name] = input?.value || "";
  });

  const payload = {
    userId,
    instructorId,
    courseId,
    certInputs,
  };

  const encrypted = await encryptData(payload);

  try {
    const response = await fetch(
      `/api/certificates-completion-pdc-tdc/${type}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
      }
    );

    if (!response.ok) {
      btnText.innerText = "Failed";
      alert("Failed to generate PDF.");
    } else {
      btnText.innerText = "Success";
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificate-completion.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    setTimeout(() => {
      if (type == "pdf") {
        btnText.innerText = "Save to PDF";
      } else {
        btnText.innerText = "Save to Database";
      }
      button.disabled = false;
    }, 3000);
  } catch (error) {
    console.error(error);
    alert("An error occurred while generating the PDF.");
    button.innerText = "Error";
  }
}

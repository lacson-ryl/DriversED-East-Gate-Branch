import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

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
async function renderProfileInputs(clientId, idCourse, idInstructor) {
  console.log("Fetch req");
  try {
    const response = await fetch("/account/api/certificates-completion-tdc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        courseId: idCourse,
        instructorId: idInstructor,
      }),
    });
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
  const {
    certificateInputs,
    userProfile,
    userCourse,
    instructorProfile,
    userId,
    courseId,
    instructorId,
  } = data;

  const flatData = {
    ...certificateInputs[0],
    ...userProfile[0],
    ...userCourse[0],
  };

  course = userCourse[0].courseName;

  // Populate text/date/number inputs
  Object.entries(flatData).forEach(([key, value]) => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = value ?? "";
  });

  // Populate image
  if (userProfile[0].profilePicture) {
    const img = document.getElementById("profilePicture");
    if (img) img.src = userProfile[0].profilePicture;
  }

  // Populate modality checkboxes
  if (userCourse[0].modality === "onsite") {
    document.getElementById("modalityOnsite").checked = true;
  } else if (userCourse[0].modality === "online") {
    document.getElementById("modalityOnline").checked = true;
  }

  // Populate footer fields
  document.getElementById("driversEdLogo").src =
    certificateInputs[0].driversEdLogo;

  document.getElementById("controlNumber").value =
    certificateInputs[0].controlNumber?.toUpperCase() ?? "123456789";

  document.getElementById("accredNumOfBranch").value =
    certificateInputs[0].accredNumOfBranch?.toUpperCase() ?? "123456789";

  document.getElementById("instructorName").value =
    instructorProfile[0].instructorName?.toUpperCase() ?? "Juan Dela Cruz";

  document.getElementById("accredNumOfInstructor").value =
    instructorProfile[0].accredNumOfInstructor?.toUpperCase() ?? "123456789";

  function autoResizeInput(input) {
    input.style.width = input.value.length + 5 + "ch";
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

const pdfBtn = document.getElementById("save-to-pdf");
pdfBtn.addEventListener("click", handleSave);
const dbBtn = document.getElementById("save-to-database");
dbBtn.addEventListener("click", handleSave);

async function handleSave(event) {
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

  const onsite =
    document.querySelector('input[value="onsite"]')?.checked || false;
  const online =
    document.querySelector('input[value="online"]')?.checked || false;
  const modality = onsite ? "onsite" : online ? "online" : "";

  // Collect all input values
  const inputFields = [
    "certificateNumber",
    "ltoClientId",
    "firstName",
    "middleName",
    "lastName",
    "address",
    "birthday",
    "nationality",
    "age",
    "gender",
    "civilStatus",
    "dateStarted",
    "dateFinished",
    "totalHours",
    "profilePicture",
    "accredNumOfInstructor",
    "instructorName",
    "controlNumber",
    "accredNumOfBranch",
  ];

  const profileInputs = {};
  inputFields.forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    profileInputs[name] = input?.value || "";
  });

  profileInputs.courseName = course;
  profileInputs.modality = modality;

  const payload = {
    userId,
    instructorId,
    courseId,
    profileInputs,
  };

  const encrypted = await encryptData(payload);
  btnText.innerText = "Processing...";
  button.disabled = true;

  try {
    const response = await fetch(`/certificates-completion-tdc/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
    });

    if (!response.ok) {
      btnText.innerText = "Failed";
      alert("Failed to generate PDF.");
    } else {
      btnText.innerText = "Success";
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificate-tdc.pdf";
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
    alert("An error occurred while generating the PDF.");
    console.error(error);
  }
}

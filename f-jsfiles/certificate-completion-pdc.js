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
async function renderProfileInputs(userId, idCourse, idInstructor) {
  try {
    const response = await fetch("/account/api/certificates-completion-pdc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: userId,
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
    await populateCertificate(data);
  } catch (error) {
    console.error("Error rendering profile inputs:", error);
    alert("Failed to load profile data.");
  }
}

  async function populateCertificate(data) {
    const {
      dlCodesLeft,
      dlCodesRight,
      certificateInputs,
      userProfile,
      userCourse,
      instructorProfile,
      clientId,
      courseId,
      instructorId,
    } = data;
    const flatData = {
      ...certificateInputs[0],
      ...userProfile[0],
      ...userCourse[0],
    };

    course = userCourse[0].courseName;

    Object.entries(flatData).forEach(([key, value]) => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) input.value = value ?? "";
    });

    // Populate image
    if (userProfile[0].profilePicture) {
      const img = document.getElementById("profilePicture");
      if (img) img.src = userProfile[0].profilePicture;
    }

    // Populate DL Codes (left and right)
    function renderDLTable(codes, tableBodyId, offset = 0) {
      const tbody = document.getElementById(tableBodyId);
      if (!tbody) return;

      tbody.innerHTML = ""; // Clear existing rows

      codes.forEach((dlCode, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="border border-black px-2 py-1 text-center">
              <input type="checkbox" name="dlCodeSelected" value="${
                dlCode.code
              }" ${dlCode.mt || dlCode.at ? "checked" : ""}>
            </td>
            <td class="border border-black px-2 py-1">${dlCode.code}</td>
            <td class="border border-black px-2 py-1 text-center">
              <input type="checkbox" name="mt_${index + offset}" ${
          dlCode.mt ? "checked" : ""
        }>
            </td>
            <td class="border border-black px-2 py-1 text-center">
              <input type="checkbox" name="at_${index + offset}" ${
          dlCode.at ? "checked" : ""
        }>
            </td>
          `;

        tbody.appendChild(row);
      });
    }

    renderDLTable(dlCodesLeft, "dlCodesLeftBody", 0);
    renderDLTable(dlCodesRight, "dlCodesRightBody", dlCodesLeft.length);

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
        btn.setAttribute("data-user-id", clientId);
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
  const btnType = button.getAttribute("btn-type");
  let btnText;
  if (btnType == "pdf") {
    btnText = pdfBtn;
  } else {
    btnText = dbBtn;
  }

  const dlCodesLeft = [];
  document
    .querySelectorAll('table[data-dl="left"] tbody tr')
    .forEach((row, idx) => {
      const code = row.querySelector("td:nth-child(2)").innerText.trim();
      const mtBox = row.querySelector(`input[name="mt_${idx}"]`);
      const atBox = row.querySelector(`input[name="at_${idx}"]`);
      dlCodesLeft.push({
        code,
        mt: mtBox?.checked || false,
        at: atBox?.checked || false,
      });
    });

  const dlCodesRight = [];
  const leftLength = dlCodesLeft.length;
  document
    .querySelectorAll('table[data-dl="right"] tbody tr')
    .forEach((row, idx) => {
      const code = row.querySelector("td:nth-child(2)").innerText.trim();
      const mtBox = row.querySelector(`input[name="mt_${idx + leftLength}"]`);
      const atBox = row.querySelector(`input[name="at_${idx + leftLength}"]`);
      dlCodesRight.push({
        code,
        mt: mtBox?.checked || false,
        at: atBox?.checked || false,
      });
    });

  // Collect all input values
  const inputFields = [
    "certificateNumber",
    "ltoClientId",
    "spNumber",
    "fullName",
    "address",
    "birthday",
    "nationality",
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

  const payload = {
    userId,
    instructorId,
    courseId,
    dlCodesLeft,
    dlCodesRight,
    profileInputs,
  };

  console.log("payload", payload);
  const encrypted = await encryptData(payload);
  btnText.innerText = "Processing...";
  button.disabled = true;

  try {
    const response = await fetch(
      `/account/api/certificates-completion-pdc/${btnType}`,
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
      const data = await response.json();
      console.error("data", data);
      alert("Failed to generate PDF.");
    } else {
      btnText.innerText = "Success";
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificate-pdc.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    setTimeout(() => {
      if (btnType == "pdf") {
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

import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";
import { openFileViewer } from "../utils/file-helper.js";

async function renderCertificateList() {
  const response = await fetch("/account/api/certificates");
  if (!response.ok) {
    console.error("Failed to fetch data from the server");
    return;
  }

  const result = await response.json();
  const certificateTable = document.getElementById("certificate-table");

  const data = result.certList;
  certificateTable.innerHTML = `
      <table id="certificate-table"
          class=" w-full text-left justify-items-start table-fixed border-collapse border-2 border-gray-300">
          <thead class="">
              <tr>
                  <th class="border border-gray-300 px-4 py-2 w-36">Certificate ID</th>
                  <th class="border border-gray-300 px-4 py-2">Certificate Name</th>
                  <th class="border border-gray-300 px-4 py-2 w-24">Template</th>
                  <th class="border border-gray-300 px-4 py-2">Action</th>
              </tr>
          </thead>
          <tbody class="">
              ${data
                .map(
                  (arr) =>
                    `
                  <tr class="text-left hover:outline outline-1 outline-black">
                      <td class="border border-gray-300 px-4 py-2">
                           ${arr.certificate_id} 
                      </td>
                      <td class="border border-gray-300 px-4 py-2">
                           ${arr.certificate_name} 
                      </td>
                      <td class="border border-gray-300 px-4 py-2">
                        <div class="flex flex-row items-center justify-center">
                            ${
                              arr.certificate_template
                                ? `
                                <button class="text-blue-700 rounded-md p-px hover:underline view-btn" 
                                data-id="${arr.certificate_id}"
                                data-file-type="${arr.template_file_type}">
                                  <img src="/f-css/solid/icons_for_buttons/document.svg" class="w-6 h-6 reverse-color" />
                                  </button>

                                <button data-id="${arr.certificate_id}" class="template-upload-btn text-yellow-600 rounded-md p-px hover:underline">
                                  <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                </button>
                                `
                                : `
                                <button data-id="${arr.certificate_id}" class="template-upload-btn text-yellow-600 rounded-md p-px hover:underline">
                                  <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                </button>
                                `
                            }
                        </div>
                      </td>
                      <td class="border border-gray-300 px-4 py-2 space-x-2">
                          <button data-id=" ${arr.certificate_id}  "
                              class="certificate-edit-btn bg-blue-500 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md p-px">
                                  <img src="/f-css/solid/icons_for_buttons/pencil.svg" class="w-6 h-6 reverse-color" />
                              </button>
                          <button data-id=" ${arr.certificate_id}  "
                              class="certificate-delete-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                                  <img src="/f-css/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-color" />
                              </button>
                      </td>

                  </tr>
                  `
                )
                .join("")}
          </tbody>
      </table>

      <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
          <div class="relative bg-white rounded-lg shadow-lg min-w-screen-md max-w-screen-md p-6">
              <span
                  class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
              <h2 class="text-xl font-semibold">Certificate Details</h2>
              <p id="modal-details" class="mt-4">the details</p>
          </div>
      </div>
  `;
  //call the button functions.
  allButtons(data);
}

renderCertificateList();

function filterCertificateList(data, id) {
  return data.filter((item) => item.certificate_id == id);
}

function allButtons(data) {
  // Initialize modal and its components
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  const modalform = `

    <form id="add-certificate-form" class="w-96">
    <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Certificate Id</h3>
        <input type="text" id="certificate-id" name="certificate-id" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate ID" />
    </div>
    <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Certificate Name</h3>
        <input type="text" id="certificate-name" name="certificate-name" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate Name" />
    </div>
    <button id="certificate-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
    </form>
    `;

  // Add Certufucate
  document
    .getElementById("add-certificate-button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      modalDetails.innerHTML = modalform;
      modal.style.display = "flex";

      const certSubmitBtn = document.getElementById(
        "certificate-submit-button"
      );

      document.getElementById("add-certificate-form").addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();
          const certificateID = document.getElementById("certificate-id").value;
          const certificateName =
            document.getElementById("certificate-name").value;

          showBtnLoading(certSubmitBtn);

          try {
            const response = await fetch("/account/api/certificate/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ certificateID, certificateName }),
            });
            if (response.ok) {
              showBtnResult(certSubmitBtn, true);
              alert("Certificate Added Successful!");
              renderCertificateList();
            } else {
              showBtnResult(certSubmitBtn, false);
              alert("Cant add Certificate right now!");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Internal Server error", error);
            alert("Internal Server error");
          }
        },
        { once: true }
      );
    });

  // Edit Certificate
  document.querySelectorAll(".certificate-edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const originalId = this.getAttribute("data-id");

      if (!originalId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      const filteredList = filterCertificateList(data, originalId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
            <form id="edit-certificate-form" class="w-96">
            <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">ID</h3>
                <input type="text" id="certificate-id" name="certificate-id" value="${result.certificate_id}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate ID" />
            </div>
            <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Name</h3>
                <input type="text" id="certificate-name" name="certificate-name" value="${result.certificate_name}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate Name" />
            </div>
            <button id="certificate-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Save</button>
            </form>
            `;

      modal.style.display = "flex";
      const certSubmitBtn = document.getElementById(
        "certificate-submit-button"
      );

      // Attach event listener for form submission
      document.getElementById("edit-certificate-form").addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();
          const certificateID = document.getElementById("certificate-id").value;
          const certificateName =
            document.getElementById("certificate-name").value;

          showBtnLoading(certSubmitBtn);

          try {
            const updateResponse = await fetch(
              `/account/api/certificates/${originalId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: certificateID,
                  name: certificateName,
                }),
              }
            );
            if (updateResponse.ok) {
              showBtnResult(certSubmitBtn, true);
              alert("Certificate updated successfully!");
              renderCertificateList();
            } else {
              showBtnResult(certSubmitBtn, false);
              alert("Failed to update certificate. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error updating certificate data", error);
            alert("An error occurred while updating the certificate.");
          }
        },
        { once: true }
      );
    });
  });

  //Certificate upload
  document.querySelectorAll(".template-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterCertificateList(data, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <form id="certificate-template-upload-form" class="min-w-96">
          <div class="mb-4">
              <h3 class="text-lg font-semibold mb-4">Upload Template for certificate: <hr class="border-white"> ${result.certificate_name}</h3>
              <input type="file" id="template-file" name="template-file" class="w-full rounded-md text-lg px-1" accept=".pdf"/>
          </div>
          <button id="template-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;
      modal.style.display = "flex";
      const templateSubmitBtn = document.getElementById(
        "template-submit-button"
      );
      document
        .getElementById("certificate-template-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("template-file").files[0];
          const formData = new FormData();
          formData.append("template-file", file);

          showBtnLoading(templateSubmitBtn);

          try {
            const response = await fetch(
              `/account/api/certificates/template/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              showBtnResult(templateSubmitBtn, true);
              alert("Template uploaded successfully!");
              renderCertificateList();
            } else {
              showBtnResult(templateSubmitBtn, false);
              alert("Failed to upload Template. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading Template", error);
            alert("An error occurred while uploading Template.");
          }
        });
    });
  });

  //View for cwertificate template pdf
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const templateId = this.getAttribute("data-id");
      const fileType = this.getAttribute("data-file-type");
      const cert = filterCertificateList(data, templateId);

      if (fileType === "application/pdf") {
        openFileViewer({
          fileData: cert[0].certificate_template,
          fileType: fileType,
          title: `Method Id: #${templateId}`,
        });
      } else {
        alert(`Unsupported file type: ${fileType}`);
      }
    });
  });

  // Delete Certificate
  document.querySelectorAll(".certificate-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const rowId = this.getAttribute("data-id");

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="font-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Certificate ID #${rowId}?</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2" disabled>Yes</button>
        <button id="delete-no" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">No</button>
      </div>
    `;
      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");
      const response = await fetch("/account/api/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rowId,
          path: `/account/api/certificates/${rowId}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        tokenIndicator.innerText =
          data.error || "Failed to fetch delete token.";
        tokenIndicator.classList.add("text-red-600");
      } else {
        tokenIndicator.innerText = "token available";
        tokenIndicator.classList.add("text-green-600");

        const deleteYes = document.getElementById("delete-yes");
        deleteYes.disabled = false;
        deleteYes.addEventListener(
          "click",
          async () => {
            try {
              const deleteResponse = await fetch(`/account/api/certificates/${rowId}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "x-delete-token": data.deleteToken,
                },
              });
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Certificate ID #${rowId}`;
                renderCertificateList();
              } else {
                tokenIndicator.innerText = `Can't Delete Certificate ID #${rowId}`;
              }
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting certificate data", error);
              tokenIndicator.innerText = "An error occurred while deleting.";
              tokenIndicator.classList.add("text-red-600");
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            }
          },
          { once: true }
        );
      }

      tokenIndicator.classList.remove("animate-pulse");
      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

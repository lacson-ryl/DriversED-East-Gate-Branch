import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";
import { openFileViewer, applyDownloadBtn } from "../utils/file-helper.js";
import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

async function renderVehicleList() {
  const response = await fetch("/account/api/vehicles");
  const result = await response.json();
  const vehicleTable = document.getElementById("vehicle-table");

  if (!response.ok) {
    alert("Failed to fetch vehicles data");
    return;
  }

  const data = result.vehicleList;
  console.log(data);
  vehicleTable.innerHTML = `
        <table id="applicants-table"
            class=" w-full text-center justify-items-center table-fixed border-collapse border-2 border-gray-300">
            <thead class="text-sm">
                <tr>
                    <th class="border border-gray-300 px-3 py-2 w-10">ID</th>
                    <th class="border border-gray-300 px-4 py-2">Plate Number</th>
                    <th class="border border-gray-300 px-4 py-2">Model</th>
                    <th class="border border-gray-300 px-4 py-2 w-16">Year</th>
                    <th class="border border-gray-300 px-4 py-2 w-28">Type</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Registered</th>
                    <th class="border border-gray-300 px-4 py-2 w-36">LTO Doc</th>
                    <th class="border border-gray-300 px-4 py-2 w-36">Car Image</th>
                    <th class="border border-gray-300 px-4 py-2 w-36">Status</th>
                    <th class="border border-gray-300 px-4 py-2 w-36">Actions</th>
                </tr>
            </thead>
            <tbody class="">
                ${data
                  .map(
                    (arr) =>
                      `
                    <tr class="text-center hover:outline outline-1 outline-black">
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.vehicle_id} 
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.plate_number} 
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.vehicle_model} 
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.year} 
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.vehicle_type} 
                        </td>
                        <td class=" border border-gray-300 px-4 py-2">
                            <button class="lto-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                              arr.vehicle_id
                            }">
                                ${
                                  arr.isRegistered == "YES"
                                    ? `<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>` // add later ${arr.vehicle_date}
                                    : arr.isRegistered == "NO"
                                    ? '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                                    : `<div class="text-yellow-700 hover:font-semibold rounded-md">Pending</div>`
                                }</button></td>
                        <td class=" border border-gray-300 px-4 py-2">
                          <div class="flex flex-row items-center justify-center gap-1">
                            ${
                              arr.lto_document
                                ? `
                                  <a href="javascript:void(0);" class="bg-blue-600 rounded-md px-2 view-btn" 
                                  data-id="${arr.vehicle_id}" 
                                  data-lto='${arr.lto_document.data}' 
                                  data-file-type="${arr.lto_document_type}">
                                    <img src="/account/f-assets/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-color" />
                                  </a>
                                    
                                <button data-id="${arr.vehicle_id}" class="lto-upload-btn  bg-red-600 rounded-md px-2">
                                  <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                </button>
                                `
                                : `<button data-id=" ${arr.vehicle_id}  "
                                class="lto-upload-btn  bg-red-600 rounded-md px-2 ">
                                  <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                </button>`
                            }
                          </div>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <div>${
                              arr.car_picture
                                ? `
                                  <button class="rounded-md hover:underline bg-blue-700 px-2 view-car-btn" 
                                  data-id="${arr.vehicle_id}" data-file-type="image/jpeg">
                                    <img src="/account/f-assets/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  <button data-id="${arr.vehicle_id}" class="vehicle-upload-btn bg-red-700 rounded-md px-2 hover:underline">
                                    <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                `
                                : `<button data-id="${arr.vehicle_id}" class="vehicle-upload-btn bg-red-600 rounded-md px-2 hover:underline">
                                    <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                   </button> `
                            }
                            </div>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <p data-id="${arr.vehicle_id}"
                                class="vehicle-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">
                                ${
                                  arr.status == "Ready for Use"
                                    ? `<div class="text-green-700 hover:font-semibold rounded-md">${arr.status}</div>`
                                    : arr.status == "Partially Repaired"
                                    ? `<div class="text-yellow-700 hover:font-semibold rounded-md">${arr.status}</div>`
                                    : `<div class="text-red-700 hover:font-semibold rounded-md">${arr.status}</div>`
                                }  
                              </p>
                            <button data-id="${arr.vehicle_id}"
                                class="vehicle-repair-view-btn bg-blue-700 hover:bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-md px-2">
                                <img src="/account/f-assets/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-color" />  
                              </button>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <button data-id="${arr.vehicle_id}"
                                class="vehicle-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md p-1">
                                <img src="/account/f-assets/solid/icons_for_buttons/pencil.svg" class="w-6 h-6 reverse-color" />  
                              </button>
                            <button data-id="${arr.vehicle_id}"
                                class="vehicle-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-1">
                                <img src="/account/f-assets/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-color" />  
                              </button>
                        </td>
  
                    </tr>
                    `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
  //call the button functions.
  allButtons(data);
}

renderVehicleList();

function filterVehicleList(data, id) {
  return data.filter((item) => item.vehicle_id == id);
}

function allButtons(data) {
  // Initialize modal and its components

  const modalform = `
  
      <form id="add-vehicle-form" class="w-96">
      <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Plate Number</h3>
          <input type="text" id="plate-number" name="plate-number" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Plate Number" />
      </div>
      <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Vehicle Model</h3>
          <input type="text" id="vehicle-model" name="vehicle-model" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Vehicle Model" />
      </div>
      <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Year</h3>
          <input type="text" id="year" name="year" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
      </div>
      <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Vehicle Type</h3>
          <select id="vehicle-type" name="vehicle-type" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Vehicle Type" />
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>
      <button id="vehicle-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
      </form>
      `;

  // Add Vehicle
  document
    .getElementById("add-vehicle-button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      modalDetails.innerHTML = modalform;
      modal.style.display = "flex";
      const vehicleSubmitBtn = document.getElementById("vehicle-submit-button");

      document
        .getElementById("add-vehicle-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const plateNumber = document.getElementById("plate-number").value;
          const vehicleModel = document.getElementById("vehicle-model").value;
          const year = document.getElementById("year").value;
          const vehicleType = document.getElementById("vehicle-type").value;

          showBtnLoading(vehicleSubmitBtn);

          try {
            const response = await fetch("/account/api/vehicle/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plateNumber,
                vehicleModel,
                year,
                vehicleType,
              }),
            });
            if (response.ok) {
              showBtnResult(vehicleSubmitBtn, true);
              alert("Vehicle Added Successful!");
              renderVehicleList();
            } else {
              showBtnResult(vehicleSubmitBtn, false);
              alert("Cant add Vehicle right now!");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Internal Server error", error);
            alert("Internal Server error");
          }
        });
    });

  // Edit Vehicle
  document.querySelectorAll(".vehicle-edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const originalId = this.getAttribute("data-id");

      if (!originalId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      const filteredList = filterVehicleList(data, originalId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
            <form id="edit-vehicle-form" class="w-96">
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Plate Number</h3>
                  <input type="text" id="plate-number" name="plate-number" value="${
                    result.plate_number
                  }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Plate Number" />
              </div>
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Vehicle Model</h3>
                  <input type="text" id="vehicle-model" name="vehicle-model" value="${
                    result.vehicle_model
                  }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Vehicle Model" />
              </div>
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Year</h3>
                  <input type="text" id="year" name="year" value="${
                    result.year
                  }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
              </div>
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Vehicle Type</h3>
                    <select id="vehicle-type" name="vehicle-type" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1">
                      <option value="Manual" ${
                        result.vehicle_type === "Manual" ? "selected" : ""
                      }>Manual</option>
                      <option value="Automatic" ${
                        result.vehicle_type === "Automatic" ? "selected" : ""
                      }>Automatic</option>
                    </select>
                </div>
              <button id="vehicle-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
            </form>
              `;

      modal.style.display = "flex";
      const vehicleSubmitBtn = document.getElementById("vehicle-submit-button");

      // Attach event listener for form submission
      document
        .getElementById("edit-vehicle-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const plateNumber = document.getElementById("plate-number").value;
          const vehicleModel = document.getElementById("vehicle-model").value;
          const year = document.getElementById("year").value;
          const vehicleType = document.getElementById("vehicle-type").value;
          showBtnLoading(vehicleSubmitBtn);
          try {
            const updateResponse = await fetch(
              `/account/api/vehicles/${originalId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plateNumber,
                  vehicleModel,
                  year,
                  vehicleType,
                }),
              }
            );
            if (updateResponse.ok) {
              showBtnResult(vehicleSubmitBtn, true);
              alert("Vehicle updated successfully!");
              renderVehicleList();
            } else {
              showBtnResult(vehicleSubmitBtn, false);
              alert("Failed to update vehicle. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error updating vehicle data", error);
            alert("An error occurred while updating the vehicle.");
          }
        });
    });
  });

  //LTO upload
  document.querySelectorAll(".lto-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterVehicleList(data, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <form id="lto-upload-form" class="w-96">
          <div class="mb-4">
              <h3 class="text-lg font-semibold mb-3">Upload LTO for plate number: ${result.plate_number}</h3>
              <input type="file" id="lto-file" name="lto-file" class="w-full rounded-md text-lg px-1" accept=".pdf, .doc, .docx, image/*"/>
          </div>
          <button id="lto-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;
      modal.style.display = "flex";
      const ltoSubmitBtn = document.getElementById("lto-submit-button");

      document
        .getElementById("lto-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("lto-file").files[0];
          const formData = new FormData();
          formData.append("lto-file", file);

          showBtnLoading(ltoSubmitBtn);

          try {
            const response = await fetch(`/account/api/vehicles/lto/${rowId}`, {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              showBtnResult(ltoSubmitBtn, true);
              alert("LTO uploaded successfully!");
              renderVehicleList();
            } else {
              showBtnResult(ltoSubmitBtn, false);
              alert("Failed to upload LTO. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading LTO", error);
            alert("An error occurred while uploading LTO.");
          }
        });
    });
  });

  //View for Lto doc or image
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const ltoData = this.getAttribute("data-lto");
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(ltoData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open();
      if (fileType.startsWith("image/")) {
        newWindow.document.write(
          `<img src="${url}" alt="LTO Document" style="width: 100%; height: auto;" />`
        );
      } else if (fileType === "application/pdf") {
        newWindow.document.write(
          `<embed src="${url}" width="100%" height="100%" type="${fileType}" />`
        );
      } else if (
        fileType === "application/msword" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        newWindow.document.write(
          `<iframe src="${url}" width="100%" height="100%" style="border:none;"></iframe>`
        );
      } else {
        newWindow.document.write(`<p>Unsupported file type: ${fileType}</p>`);
      }
    });
  });

  //Vehicle Photo upload
  document.querySelectorAll(".vehicle-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterVehicleList(data, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <form id="vehicle-upload-form" class="min-w-96">
          <div class="mb-4">
              <h3 class="text-lg font-semibold mb-3">Upload Vehicle Photo for plate number: ${result.plate_number}</h3>
              <input type="file" id="vehicle-file" name="vehicle-file" accept="image/*" class="w-full rounded-md text-lg px-1" />
          </div>
          <button id="vehicle-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;
      modal.style.display = "flex";
      const vehicleSubmitBtn = document.getElementById("vehicle-submit-button");

      document
        .getElementById("vehicle-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("vehicle-file").files[0];
          const formData = new FormData();
          formData.append("vehicle-file", file);

          showBtnLoading(vehicleSubmitBtn);

          try {
            const response = await fetch(
              `/account/api/vehicles/vehicle-photo/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              showBtnResult(vehicleSubmitBtn, true);
              alert("Vehicle photo uploaded successfully!");
              renderVehicleList();
            } else {
              showBtnResult(vehicleSubmitBtn, false);
              alert("Failed to upload vehicle photo. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading vehicle photo", error);
            alert("An error occurred while uploading vehicle photo.");
          }
        });
    });
  });

  // View Car photo Upload
  document.querySelectorAll(".view-car-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const carId = this.getAttribute("data-id");
      const fileType = this.getAttribute("data-file-type");

      const vehicle = filterVehicleList(data, carId);

      openFileViewer({
        fileData: vehicle[0].car_picture,
        fileType,
        title: `Car ID #${carId}`,
      });
    });
  });

  // LTO Status
  document.querySelectorAll(".lto-status-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <p>Are you sure you want to change the LTO status of ID #${rowId}?</p>
        <div class="justify-self-end space-x-4 mt-5">
          <button id="lto-yes" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2">Registered</button>
          <button id="lto-no" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">Not Registed</button>
        </div>
      `;
      modal.style.display = "flex";

      const ltoYes = document.getElementById("lto-yes");
      ltoYes.addEventListener(
        "click",
        async () => {
          showBtnLoading(ltoYes);
          try {
            const response = await fetch(`/account/api/vehicles/${rowId}/YES`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              showBtnResult(ltoYes, true);
              alert(`Successfully Changed LTO Status of ID no. ${rowId}`);
              renderVehicleList();
            } else {
              showBtnResult(ltoYes, false);
              alert(`Can't Change LTO Status of ID no. ${rowId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error changing LTO status", error);
            alert("An error occurred while changing the LTO status.");
            modal.style.display = "none";
          }
        },
        { once: true }
      );

      const ltoNo = document.getElementById("lto-no");
      ltoNo.addEventListener(
        "click",
        async () => {
          showBtnLoading(ltoNo);
          try {
            const response = await fetch(`/account/api/vehicles/${rowId}/NO`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              showBtnResult(ltoNo, true);
              alert(`Successfully Changed LTO Status of ID no. ${rowId}`);
              renderVehicleList();
            } else {
              showBtnResult(ltoNo, false);
              alert(`Can't Change LTO Status of ID no. ${rowId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error changing LTO status", error);
            alert("An error occurred while changing the LTO status.");
            modal.style.display = "none";
          }
        },
        { once: true }
      );
    });
  });

  document.querySelectorAll(".vehicle-repair-view-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const rowId = button.getAttribute("data-id");
      renderViewRepairTable(rowId);
    });
  });

  // Delete Vehicle
  document.querySelectorAll(".vehicle-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const rowId = this.getAttribute("data-id");
      if (!rowId) {
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="text-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Vehicle ID #${rowId}?</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-blue-700 text-white rounded-md px-2" disabled>Yes</button>
        <button id="delete-no" class="bg-rose-700 text-white rounded-md px-2">No</button>
      </div>
    `;
      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");
      const response = await fetch("/account/api/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rowId,
          path: `/account/api/vehicles/${rowId}`,
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
              const deleteResponse = await fetch(
                `/account/api/vehicles/${rowId}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "x-delete-token": data.deleteToken,
                  },
                }
              );
              const reply = await deleteResponse.json();
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Vehicle ID #${rowId}`;
                renderVehicleList();
              } else {
                console.error(reply.err);
                tokenIndicator.innerText = `Can't Delete Vehicle ID #${rowId}`;
              }
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting vehicle data", error);
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
}

function filterData(data, filterBy, value) {
  return data.filter((item) => item[filterBy] == value);
}

async function renderViewRepairTable(vehicleId) {
  const response = await fetch(
    `/account/api/vehicles/repair-list/${vehicleId}`
  );
  const data = await response.json();
  if (!response.ok) {
    viewRepairTable.innerHTML = `<p class="text-red-600">Failed to fetch repair records.</p>`;
    viewRepairTable.style.display = "block";
    setTimeout(() => {
      viewRepairTable.style.display = "none";
    }, 5000);
    return;
  }
  const repairList = data;
  console.log("repairList", repairList);
  const viewRepairTable = document.getElementById("vehicle-repair-table");
  if (!repairList || repairList.length === 0) {
    viewRepairTable.innerHTML = "";
    viewRepairTable.innerHTML = `
    <button data-id="${vehicleId}" id="add-repair-record-btn" class="bg-green-600 hover:bg-green-800 text-white rounded-md px-3 py-1 mb-4">
    Add Repair
		</button>
    <p class="text-gray-600 text-center py-4">No repair records found for this vehicle.</p>`;
    viewRepairTable.style.display = "flex";
  } else {
    viewRepairTable.innerHTML = "";
    const table = `
  ${repairList
    .map(
      (repair) => `
        <tr class="hover:outline outline-1 outline-black">
          <td class="border border-gray-300 px-4 py-2">${repair.repair_id}</td>
          <td class="border border-gray-300 px-4 py-2">
            ${new Date(repair.repair_date).toLocaleString()}
          </td>
          <td class="border border-gray-300 px-4 py-2">${repair.status}</td>
          <td class="border border-gray-300 px-4 py-2">${
            repair.mechanic_name ?? "—"
          }</td>
          <td class="border border-gray-300 px-4 py-2">₱${
            repair.cost ? Number(repair.cost).toFixed(2) : "0.00"
          }</td>
          <td class="border border-gray-300 px-4 py-2">${
            repair.updates ?? "—"
          }</td>
          <td class="border border-gray-300 px-4 py-2 space-x-2">
            <button data-id="${
              repair.repair_id
            }" class="repair-update-btn bg-blue-500 hover:bg-blue-700 text-white rounded-md p-1">
              <img src="/account/f-assets/solid/icons_for_buttons/pencil.svg" class="w-5 h-5 reverse-color" />
            </button>
            <button data-id="${
              repair.repair_id
            }" class="repair-delete-btn bg-rose-500 hover:bg-rose-700 text-white rounded-md p-1">
              <img src="/account/f-assets/solid/icons_for_buttons/trash.svg" class="w-5 h-5 reverse-color" />
            </button>
          </td>
        </tr>
      `
    )
    .join("")}
`;
    viewRepairTable.innerHTML = `
    <button data-id="${vehicleId}" id="add-repair-record-btn" class="bg-green-600 hover:bg-green-800 text-white rounded-md px-3 py-1 mb-4">
      Add Repair
		</button>
    <table class="w-full text-left table-fixed border-collapse border-2 border-gray-300">
      <thead>
        <tr>
          <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
          <th class="border border-gray-300 px-4 py-2">Date</th>
          <th class="border border-gray-300 px-4 py-2">Status</th>
          <th class="border border-gray-300 px-4 py-2">Mechanic</th>
          <th class="border border-gray-300 px-4 py-2">Cost</th>
          <th class="border border-gray-300 px-4 py-2">Updates</th>
          <th class="border border-gray-300 px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
          ${table}
      </tbody>
    </table>
      `;
    viewRepairTable.style.display = "flex";

    document.querySelectorAll(".repair-update-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const repairId = this.getAttribute("data-id");
        const selected = repairList.find((r) => r.repair_id == repairId);
        console.log("selected", selected);
        if (!selected) return;

        modalDetails.innerHTML = `
      <form id="update-repair-form" class="w-96 space-y-4">
        <h3 class="text-xl font-semibold mb-3">Update Repair Record</h3>

        <div class="mb-4">
          <h3 class="text-lg font-base mb-2">Description Before Repair</h3>
          <textarea name="descriptionBeforeRepair" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" required>${
            selected.description_before_repair
          }</textarea>
        </div>

        <div class="mb-4">
          <h3 class="text-lg font-base mb-2">Repair Updates</h3>
          <textarea name="updates" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1">${
            selected.updates ?? ""
          }</textarea>
        </div>

        <div class="mb-4">
          <h3 class="text-lg font-medium mb-2">Last Updated</h3>
          <p class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1 bg-gray-100">
          ${selected.updated_at || ""}
          </p>
        </div>

        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 w-full">Save Changes</button>
      </form>
      
      `;
        modal.style.display = "flex";

        document
          .getElementById("update-repair-form")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            formData.append("repairId", repairId);

            try {
              const encryptedPayload = await encryptData(formData);
              const response = await fetch(
                "/account/api/vehicles-repair/update",
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    encryptedWithEncAesKey: encryptedPayload,
                  }),
                }
              );

              const result = await response.json();
              if (!response.ok)
                throw new Error(result.error || "Update failed");

              modalDetails.innerHTML = `<p class="text-green-600 font-semibold">✅ ${result.message}</p>`;
              renderViewRepairTable(vehicleId);
            } catch (err) {
              modalDetails.innerHTML = `<p class="text-red-600 font-semibold">❌ ${err.message}</p>`;
            }
          });
      });

      //delete btn
      document.querySelectorAll(".repair-delete-btn").forEach((button) => {
        button.addEventListener("click", async function () {
          const rowId = this.getAttribute("data-id");
          if (!rowId) {
            modalDetails.innerHTML = "<p>ID not found.</p>";
            modal.style.display = "flex";
            return;
          }

          modalDetails.innerHTML = `
            <p id="delete-token-indicator" class="text-sm animate-pulse text-gray-500">fetching delete token...</p>
            <p>Are you sure you want to delete Repair ID #${rowId}?</p>
            <div class="justify-self-end space-x-4 mt-5">
              <button id="delete-yes" class="bg-blue-700 text-white rounded-md px-2" disabled>Yes</button>
              <button id="delete-no" class="bg-rose-700 text-white rounded-md px-2">No</button>
            </div>
          `;
          modal.style.display = "flex";

          const tokenIndicator = document.getElementById(
            "delete-token-indicator"
          );
          const response = await fetch("/account/api/delete-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: rowId,
              path: `/account/api/vehicles/repair-delete/${rowId}`,
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
                  const deleteResponse = await fetch(
                    `/account/api/vehicles/repair-delete/${rowId}`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        "x-delete-token": data.deleteToken,
                      },
                    }
                  );
                  const reply = await deleteResponse.json();
                  if (deleteResponse.ok) {
                    tokenIndicator.innerText = `Successfully Deleted Repair ID #${rowId}`;
                    renderViewRepairTable(rowId);
                  } else {
                    console.error(reply.err);
                    tokenIndicator.innerText = `Can't Delete Repair ID #${rowId}`;
                  }
                  setTimeout(() => {
                    modal.style.display = "none";
                  }, 3000);
                } catch (error) {
                  console.error("Error deleting vehicle repair data", error);
                  tokenIndicator.innerText =
                    "An error occurred while deleting.";
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
    });
  }

  document
    .getElementById("add-repair-record-btn")
    .addEventListener("click", async function () {
      const vehicleId = this.getAttribute("data-id");
      modalDetails.innerHTML = `
			<form id="add-repair-form" class="w-96 space-y-4">
				<h3 class="text-xl font-semibold mb-3">Add Repair Record</h3>

				<div class="flex flex-row gap-4 mb-4">
					<div class="w-1/3">
					<h3 class="text-lg font-medium mb-2">VehicleId</h3>
					<input type="text" name="vehicleId" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" placeholder="Vehicle ID" required 
					value="${vehicleId}"/>
					</div>

					<div class="w-2/3">
						<h3 class="text-lg font-medium mb-2">Repair Date</h3>
						<input type="datetime-local" name="repairDate" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" required />
					</div>
				</div>

				<div class="mb-4">
					<h3 class="text-lg font-medium mb-2">Repair Status</h3>
					<select name="status" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1">
						<option value="Maintenance">Maintenance</option>
						<option value="Partially Repaired">Partially Repaired</option>
						<option value="Ready for Use">Ready for Use</option>
					</select>
				</div>

				<div class="flex flex-row gap-4 mb-4">
					<div class="w-1/2">
						<h3 class="text-lg font-medium mb-2">Mechanic Name</h3>
						<input type="text" name="mechanicName" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" placeholder="Mechanic Name" />
					</div>

					<div class="w-1/2">
						<h3 class="text-lg font-medium mb-2">Repair Cost (₱)</h3>
						<input type="number" step="0.01" name="cost" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" placeholder="Cost (₱)" />
					</div>
				</div>

				<div class="mb-4">
					<h3 class="text-lg font-medium mb-2">Description Before Repair</h3>
					<textarea name="descriptionBeforeRepair" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-2 py-1" placeholder="Description before repair" required></textarea>
				</div>

				<button id="submit-repair-btn" type="submit" class="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 w-full">Submit</button>
			</form>
  `;
      const submitBtn = document.getElementById("submit-repair-btn");
      modal.style.display = "flex";

      const form = document.getElementById("add-repair-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        showBtnLoading(submitBtn);

        try {
          const encryptedPayload = await encryptData(formData);
          const response = await fetch("/account/api/vehicles/repair-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encryptedPayload }),
          });

          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Failed to add repair");

          modalDetails.innerHTML = `<p class="text-green-600 font-semibold">✅ ${result.message}</p>`;
          renderViewRepairTable(vehicleId);
        } catch (err) {
          modalDetails.innerHTML = `<p class="text-red-600 font-semibold">❌ ${err.message}</p>`;
        }
        setTimeout(() => {
          modalDetails.innerHTML = "";
          modal.style.display = "none";
        }, 4000);
      });
    });
  return;
}

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

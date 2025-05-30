async function renderVehicleList() {
  const response = await fetch("/api/vehicles");
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
            class=" w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead class="text-sm">
                <tr>
                    <th class="border border-gray-300 px-3 py-2 w-10">ID</th>
                    <th class="border border-gray-300 px-4 py-2">Plate Number</th>
                    <th class="border border-gray-300 px-4 py-2">Model</th>
                    <th class="border border-gray-300 px-4 py-2 w-16">Year</th>
                    <th class="border border-gray-300 px-4 py-2 w-28">Type</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Registered</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">LTO Doc</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Car Image</th>
                    <th class="border border-gray-300 px-4 py-2">Actions</th>
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
                        <td class="border border-gray-300 px-4 py-2">
                            <div>${
                              arr.lto_document
                                ? `
                                  <a href="javascript:void(0);" class="text-blue-700 hover:underline view-btn" data-id="${
                                    arr.vehicle_id
                                  }" data-lto='${JSON.stringify(
                                    arr.lto_document.data
                                  )}' data-file-type="${
                                    arr.lto_document_type
                                  }">View</a>
                                    
                                <button data-id="${
                                  arr.vehicle_id
                                }" class="lto-upload-btn  text-red-700 rounded-md px-2 hover:underline">Re-upload</button>
                                `
                                : `<button data-id=" ${arr.vehicle_id}  "
                                class="lto-upload-btn  text-red-700 rounded-md px-2 hover:underline">Upload</button>`
                            }
                            </div>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <div>${
                              arr.car_picture
                                ? `
                                  <a href="javascript:void(0);" class="text-blue-700 hover:underline view-car-btn" data-id="${
                                    arr.vehicle_id
                                  }" data-car='${JSON.stringify(
                                    arr.car_picture.data
                                  )}' data-file-type="image/jpeg">View</a>
                                  <button data-id="${
                                    arr.vehicle_id
                                  }" class="vehicle-upload-btn text-red-700 rounded-md px-2 hover:underline">Re-upload</button>
                                `
                                : `<button data-id="${arr.vehicle_id}" class="vehicle-upload-btn text-red-700 rounded-md px-2 hover:underline">Upload</button> `
                            }
                            </div>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <button data-id=" ${arr.vehicle_id}  "
                                class="vehicle-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
                            <button data-id=" ${arr.vehicle_id}  "
                                class="vehicle-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Delete</button>
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
                <h2 class="text-xl font-semibold">Vehicle Details</h2>
                <p id="modal-details" class="mt-4">the details</p>
            </div>
        </div>
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
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

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

      document
        .getElementById("add-vehicle-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const plateNumber = document.getElementById("plate-number").value;
          const vehicleModel = document.getElementById("vehicle-model").value;
          const year = document.getElementById("year").value;
          const vehicleType = document.getElementById("vehicle-type").value;

          try {
            const response = await fetch("/api/vehicle/add", {
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
              alert("Vehicle Added Successful!");
              renderVehicleList();
            } else {
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

      // Attach event listener for form submission
      document
        .getElementById("edit-vehicle-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const plateNumber = document.getElementById("plate-number").value;
          const vehicleModel = document.getElementById("vehicle-model").value;
          const year = document.getElementById("year").value;
          const vehicleType = document.getElementById("vehicle-type").value;

          try {
            const updateResponse = await fetch(`/api/vehicles/${originalId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plateNumber,
                vehicleModel,
                year,
                vehicleType,
              }),
            });
            if (updateResponse.ok) {
              alert("Vehicle updated successfully!");
              renderVehicleList();
            } else {
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

      document
        .getElementById("lto-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("lto-file").files[0];
          const formData = new FormData();
          formData.append("lto-file", file);

          try {
            const response = await fetch(`/api/vehicles/lto/${rowId}`, {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              alert("LTO uploaded successfully!");
              renderVehicleList();
            } else {
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
      const ltoData = JSON.parse(this.getAttribute("data-lto"));
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

      document
        .getElementById("vehicle-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("vehicle-file").files[0];
          const formData = new FormData();
          formData.append("vehicle-file", file);

          try {
            const response = await fetch(
              `/api/vehicles/vehicle-photo/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              alert("Vehicle photo uploaded successfully!");
              renderVehicleList();
            } else {
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
      const carData = JSON.parse(this.getAttribute("data-car"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(carData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open();
      newWindow.document.write(
        `<img src="${url}" alt="Car Picture" style="width: 100%; height: auto;" />`
      );
    });
  });

  // LTO Status
  document.querySelectorAll(".lto-status-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      console.log(rowId);

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

      document.getElementById("lto-yes").addEventListener("click", async () => {
        try {
          const response = await fetch(`/api/vehicles/${rowId}/YES`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            alert(`Successfully Changed LTO Status of ID no. ${rowId}`);
            renderVehicleList();
          } else {
            alert(`Can't Change LTO Status of ID no. ${rowId}`);
          }
          modal.style.display = "none";
        } catch (error) {
          console.error("Error changing LTO status", error);
          alert("An error occurred while changing the LTO status.");
          modal.style.display = "none";
        }
      });

      document.getElementById("lto-no").addEventListener("click", async () => {
        try {
          const response = await fetch(`/api/vehicles/${rowId}/NO`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            alert(`Successfully Changed LTO Status of ID no. ${rowId}`);
            renderVehicleList();
          } else {
            alert(`Can't Change LTO Status of ID no. ${rowId}`);
          }
          modal.style.display = "none";
        } catch (error) {
          console.error("Error changing LTO status", error);
          alert("An error occurred while changing the LTO status.");
          modal.style.display = "none";
        }
      });
    });
  });

  // Delete Vehicle
  document.querySelectorAll(".vehicle-delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      console.log(rowId);

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <p>Are you sure you want to delete ID #${rowId}?</p>
        <div class="justify-self-end space-x-4 mt-5">
          <button id="delete-yes" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2">Yes</button>
          <button id="delete-no" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">No</button>
        </div>
      `;
      modal.style.display = "flex";

      document
        .getElementById("delete-yes")
        .addEventListener("click", async () => {
          try {
            const response = await fetch(`/api/vehicles/${rowId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              alert(`Successfully Deleted ID no. ${rowId}`);
              renderVehicleList();
            } else {
              alert(`Can't Delete ID no. ${rowId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error deleting vehicle data", error);
            alert("An error occurred while deleting the vehicle.");
            modal.style.display = "none";
          }
        });

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

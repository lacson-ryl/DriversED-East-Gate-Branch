import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

//start clock of admin dashboard
function updateClock() {
  const clockElement = document.getElementById("clock");
  const dateElement = document.getElementById("date");
  const now = new Date();

  // Format time
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  clockElement.innerText = `${hours}:${minutes}:${seconds}`;

  // Format date
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = now.toLocaleDateString(undefined, options);
  dateElement.innerText = formattedDate;
}

// Update clock every second
setInterval(updateClock, 1000);

// Initial call to display time immediately
updateClock();
//end clock of admin dashboard

//start chart for admin dashboard
const ctx = document.getElementById("applicantsChart").getContext("2d");

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();
let chart;

const fetchMonthYear = async (monthName, currYear) => {
  try {
    const response = await fetch(
      `/api/admin-dashboard-time/${monthName}/${currYear}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const updateChart = async (monthIndex) => {
  const monthName = monthNames[monthIndex];
  const data = await fetchMonthYear(monthName, currentYear); // Pass currentYear here
  const labels = data.map((d) => d.currDay);
  const applicantsData = data.map((d) => d.totalApplicants);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = applicantsData;
    chart.data.datasets[0].label = `New Applicants for ${monthName} ${currentYear}`;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `New Applicants for ${monthName} ${currentYear}`,
            data: applicantsData,
            borderColor: "rgba(29, 78, 216, 1)",
            backgroundColor: "rgba(29, 78, 216, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              font: {
                weight: "bold",
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                weight: "bold",
                size: 12,
              },
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 14,
                weight: "bold",
              },
            },
          },
        },
      },
    });
  }
};

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
  if (currentMonthIndex === 11) currentYear--; // Adjust year if moving to December of the previous year
  updateChart(currentMonthIndex);
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonthIndex = (currentMonthIndex + 1) % 12;
  if (currentMonthIndex === 0) currentYear++; // Adjust year if moving to January of the next year
  updateChart(currentMonthIndex);
});

// Initialize chart with the current month
updateChart(currentMonthIndex);

function showNotification(message, type) {
  const notification = document.getElementById("notification");
  const colorText = type === "success" ? "text-green-700" : "text-red-700";
  notification.innerHTML = `
    <p class="${colorText}">${message}</p>
  `;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

const dashboardDetails = [];

async function fetchDashboardDetails() {
  try {
    const response = await fetch("/api/admin-dashboard/dashboard-details");
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching dashboard details:", errorData);
      showNotification("Error fetching dashboard details", "error");
      return;
    }
    const data = await response.json();
    dashboardDetails.push(data);
  } catch (error) {
    console.error("Error fetching dashboard details:", error);
    showNotification("Error fetching dashboard details", "error");
  }
}

fetchDashboardDetails();

function filterMethodList(methodList, methodId) {
  return methodList.filter((arr) => arr.method_id == methodId);
}

async function renderPaymentMethodsList() {
  const methodsTable = document.getElementById("payment-method-table");
  try {
    if (dashboardDetails.length === 0) {
      await fetchDashboardDetails();
    }
    const data = dashboardDetails[0];
    const methodList = data.methodList;
    methodsTable.innerHTML = `
      <table id="payment-methods-table" class="w-full border-collapse">
      <thead class="">
        <tr class="text-center">
          <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
          <th class="border border-gray-300 px-4 py-2">Name</th>
          <th class="border border-gray-300 px-4 py-2">Availability</th>
          <th class="border border-gray-300 px-4 py-2 w-24">File</th>
          <th class="border border-gray-300 px-4 py-2 w-28">Actions</th>
        </tr>
      </thead>
      <tbody class="">
        ${methodList
          .map(
            (method) => `
              <tr class="text-center group hover:outline outline-1 outline-black">
                <td class="border border-gray-300 px-4 py-2">${
                  method.method_id
                }</td>
                <td class="border border-gray-300 px-4 py-2">${
                  method.method_name
                }</td>
                <td class="border border-gray-300 px-4 py-2">${
                  method.availablity
                }</td>
                <td class="border border-gray-300 px-4 py-2">
                  <div class="flex flex-row items-center justify-center">
                    ${
                      method.method_file
                        ? `<a href="javascript:void(0);" class="text-blue-700 hover:underline view-file-btn" data-id="${
                            method.method_id
                          }" data-file='${JSON.stringify(
                            method.method_file
                          )}' data-file-type="${method.method_file_type}">
                            View
                          </a>
                          <button data-id="${
                            method.method_id
                          }" class="upload-file-btn text-yellow-600 rounded-md px-2 hover:underline">
                            Upload
                          </button`
                        : `<button data-id="${method.method_id}" class="upload-file-btn text-yellow-600 rounded-md px-2 hover:underline">
                            Upload
                          </button>`
                    }
                  </div>
                </td>
                <td class="text-center border border-gray-300 px-4 py-2">
                  <button class="edit-btn text-blue-600 hover:underline" data-id="${
                    method.method_id
                  }">Edit</button>
                  <button class="delete-btn text-red-600 hover:underline" data-id="${
                    method.method_id
                  }">Delete</button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
    `;
    paymentButtons(methodList);
  } catch (error) {
    showNotification(error, "error");
    console.error;
  }
}

renderPaymentMethodsList();

function errorBox(message) {
  return `<div
    class="min-w-40 min-h-20 bg-white place-self-center text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
    ${message}
  </div>`;
}

async function renderInstructorsSchedule() {
  if (dashboardDetails.length === 0) {
    await fetchDashboardDetails();
  }
  const data = dashboardDetails[0];
  const scheduleList = data.scheduleList;
  const instructorsSchedules = document.getElementById("instructor-schedules");

  // Check if all instructors have null in their date
  const allDatesNull = scheduleList.every((arr) => arr.date === null);

  if (allDatesNull) {
    instructorsSchedules.innerHTML = errorBox(
      "No schedule for instructors today"
    );
    return;
  }

  const scheduleBoard = scheduleList
    .map((arr) =>
      !arr.date
        ? ""
        : `
    <div class="min-h-80 min-w-72 text-center space-y-2">
        <img src="/f-css/solid/black/user-group.svg" class="m-auto py-5 w-28 h-28 border-2 border-black rounded-full" />
        <h1 class="text-xl font-semibold">${arr.instructor_name}</h1>
        <ul>
          ${
            arr.am_available === 1
              ? `
            <h3 class="text-left pl-5 font-semibold">Morning:</h3>
            <li class="inline">${arr.am_applicant_name}</li><br>
            `
              : ""
          }
          ${
            arr.pm_available === 1
              ? `
            <h3 class="text-left pl-5 font-semibold">Afternoon:</h3>
            <li class="inline">${arr.pm_applicant_name}</li><br>
            `
              : ""
          }
        </ul>
    </div>
  `
    )
    .join("");
  instructorsSchedules.innerHTML = scheduleBoard;
}

renderInstructorsSchedule();

function paymentButtons(methodList) {
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  document
    .getElementById("add-payment-method-button")
    .addEventListener("click", (event) => {
      event.preventDefault();

      const modalform = `
        <form id="add-payment-method-form" class="w-96">
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Method Name</h3>
            <input type="text" id="method-name" name="methodName" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Method Name" />
          </div>
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Availability</h3>
            <select id="availability" name="availability" class="w-full outline outline-1 outline-gray-300 border hover:border-blue-500 focus:border-yellow-500 rounded-md text-lg px-1">
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Method File</h3>
            <input type="file" id="method-file" name="methodFile" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" accept="image/*" />
          </div>
          <button id="payment-method-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;

      modalDetails.innerHTML = modalform;
      modal.style.display = "flex";

      // Event listener for the form submission
      document
        .getElementById("add-payment-method-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(event.target);
          const encrypting = await encryptData(formData);

          try {
            const response = await fetch("/api/payment-methods/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
            });
            if (response.ok) {
              showNotification("Payment Method Added Successfully!", "success");
              renderPaymentMethodsList(); // Refresh the payment methods list
            } else {
              showNotification("Can't add Payment Method right now!", "error");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Internal Server error", error);
            showNotification("Internal Server error", "error");
          }
        });
    });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const methodId = this.getAttribute("data-id");

      const filteredMethod = filterMethodList(methodList, methodId);
      const modalForm = filteredMethod.map(
        (arr) => `
        <form id="edit-payment-method-form" class="w-96">
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Method Name</h3>
            <input type="text" id="method-name" name="method-name" value="${
              arr.method_name
            }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Method Name" />
          </div>
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Availability</h3>
            <select id="availability" name="availability" class="w-full outline outline-1 outline-gray-300 border hover:border-blue-500 focus:border-yellow-500 rounded-md text-lg px-1">
              <option value="Available" ${
                arr.availability === "Available" ? "selected" : ""
              }>Available</option>
              <option value="Unavailable" ${
                arr.availability === "Available" ? "selected" : ""
              }>Unavailable</option>
            </select>
          </div>
          <button id="edit-payment-method-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `
      );

      modalDetails.innerHTML = modalForm;
      modal.style.display = "flex";

      document
        .getElementById("edit-payment-method-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const methodName = document.getElementById("method-name").value;
          const availability = document.getElementById("availability").value;

          try {
            const response = await fetch("/api/payment-method/edit", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: { methodName, availability },
            });

            if (response.ok) {
              showNotification(
                "Payment Method changed successfully!",
                "success"
              );
              renderPaymentMethodsList();
            } else {
              showNotification(
                "Can't change Payment Method right now!",
                "error"
              );
            }
          } catch (error) {}
        });
    });
  });

  document.querySelectorAll(".upload-file-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const methodId = this.getAttribute("data-id");

      if (!methodId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <form id="upload-file-form" class="min-w-96">
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-3">Upload File for Method ID: ${methodId}</h3>
            <input type="file" id="method-file" name="method-file" accept="image/*" class="w-full rounded-md text-lg px-1" />
          </div>
          <button id="file-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;
      modal.style.display = "flex";

      document
        .getElementById("upload-file-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const methodFile = document.getElementById("method-file").files[0];
          const formData = new FormData();
          formData.append("methodId", methodId)
          formData.append("methodFile", methodFile);

          const encrypting = await encryptData(formData);

          try {
            const response = await fetch(
              `/api/payment-methods/upload`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
              }
            );
            if (response.ok) {
              alert("File uploaded successfully!");
              renderPaymentMethodsList();
            } else {
              alert("Failed to upload file. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading file", error);
            alert("An error occurred while uploading the file.");
          }
        });
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const methodId = this.getAttribute("data-id");

      if (!methodId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <p>Are you sure you want to delete Method ID #${methodId}?</p>
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
            const response = await fetch(`/api/payment-methods/${methodId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              alert(`Successfully Deleted Method ID no. ${methodId}`);
              renderPaymentMethodsList();
            } else {
              alert(`Can't Delete Method ID no. ${methodId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error deleting method", error);
            alert("An error occurred while deleting the method.");
            modal.style.display = "none";
          }
        });

      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });

  document.querySelectorAll(".view-file-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const methodId = this.getAttribute("data-id");
      const fileData = JSON.parse(this.getAttribute("data-file"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(fileData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank", "width=800,height=600");
      newWindow.document.write(`
        <html>
          <head>
            <title>Payment Method File</title>
            <style>
              body {
                background-color: black;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              img, iframe {
                max-width: 100%;
                max-height: 100%;
              }
            </style>
          </head>
          <body>
            ${
              fileType.startsWith("image/")
                ? `<img src="${url}" alt="payment-method-file" />`
                : `<iframe src="${url}" frameborder="0"></iframe>`
            }
          </body>
        </html>
      `);
      newWindow.document.close();

      // Revoke the object URL after the new window has loaded the content
      newWindow.onload = function () {
        URL.revokeObjectURL(url);
      };
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

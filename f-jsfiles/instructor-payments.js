// Initialize modal and its components
const modal = document.getElementById("myModal");
const spanX = document.getElementsByClassName("close")[0];
const titleDetails = document.getElementById("title-details");
const modalDetails = document.getElementById("modal-details");

async function renderInstructorProfile() {
  const response = await fetch("/account/api/instructor-profile");
  const data = await response.json();
  const instructorTable = document.getElementById(
    "instructors-current-payroll-table"
  );

  const details = data.instructor;

  instructorTable.innerHTML = "";
  if (!details) {
    instructorTable.innerHTML = `
        <table id="instructors-table" class="mt-3 mb-5 mx-3 text-left justify-items-start table-fixed border-collapse border-2 border-gray-300">
          <thead>
            <tr>
              <th class="border border-gray-300 px-4 py-2 w-36">Failed to render Instructor Table</th>
            </tr>
          </thead>
        </table>
      `;
  } else {
    const desktopRow = `
        <tr class="text-center hover:outline outline-1 outline-black">
          <td class="border border-gray-300 px-4 py-2 text-xs font-semibold">${
            details.instructor_id
          }</td>
          <td class="border border-gray-300 px-4 py-2">${
            details.instructor_name
          } - ${details.rate_per_hour}</td>
          <td class="border border-gray-300 px-4 py-2">${
            details.instructor_type
          }</td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              details.isTdcOnsite === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              details.isManual === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              details.isAutomatic === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">${
            details.date_started
          }</td>
          <td class="border border-gray-300 px-4 py-2 text-sm font-medium">
            <span class="text-blue-500">${details.SSS || 0}</span> | 
            <span class="text-red-500">${details.Pag_ibig || 0}</span> | 
            <span class="text-yellow-500">${details.Philhealth || 0}</span>
          </td>
          <td class="border border-gray-300 px-4 py-2">${
            details.account_id
              ? `<div class="text-green-600 font-semibold rounded-md px-2">YES</div>`
              : `<button data-id="${details.instructor_id}"
              class="instructor-assign-account-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2"
              >Assign</button>`
          }
          </td>
          <td class="border border-gray-300 px-4 py-2">
            <button data-id="${details.instructor_id}"
              class="instructor-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
          </td>
        </tr>
      `;

    const mobileCard = `
        <div class="bg-white rounded-lg shadow-md mb-4 p-4 border border-gray-200">
          <div class="flex justify-between items-center mb-2">
            <div>
              <span class="font-bold text-blue-800">#${
                details.instructor_id
              }</span>
              <span class="ml-2 text-gray-700">${details.instructor_name}</span>
            </div>
            <span class="text-xs text-gray-500">${details.date_started}</span>
          </div>
          <div class="mb-2">
            <span class="block text-sm text-gray-600">Rate/Hour: <span class="font-semibold">${
              details.rate_per_hour
            }</span></span>
            <span class="block text-sm text-gray-600">Type: <span class="font-semibold">${
              details.instructor_type
            }</span></span>
          </div>
          <div class="flex flex-wrap gap-2 mb-2">
            <span class="px-2 py-1 rounded text-xs 
            ${
              details.isTdcOnsite === 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }">TDC Onsite: ${details.isTdcOnsite === 1 ? "YES" : "NO"}</span>
            <span class="px-2 py-1 rounded text-xs ${
              details.isManual === 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }">Manual: ${details.isManual === 1 ? "YES" : "NO"}</span>
            <span class="px-2 py-1 rounded text-xs ${
              details.isAutomatic === 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }">Automatic: ${details.isAutomatic === 1 ? "YES" : "NO"}</span>
          </div>
          <div class="mb-2 text-xs text-gray-600">
            Benefits: SSS ${details.SSS || 0} | Pag-ibig 
            ${details.Pag_ibig || 0} | Philhealth ${details.Philhealth || 0}
          </div>
          <div class="flex justify-between items-center mt-2">
            <div>
              ${
                details.account_id
                  ? `<span class="text-green-600 font-semibold">Account: YES</span>`
                  : `<button data-id="${details.instructor_id}" class="instructor-assign-account-btn bg-blue-700 text-white rounded px-2 py-1 text-xs">Assign</button>`
              }
            </div>
            <button data-id="${
              details.instructor_id
            }" class="instructor-edit-btn bg-blue-700 text-white rounded px-2 py-1 text-xs">Edit</button>
          </div>
        </div>
      `;
    if (window.innerWidth >= 768) {
      instructorTable.innerHTML = `
      <table id="manage-people-table" class="w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
        <thead>
          <tr class="text-sm text-center">
            <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
            <th class="border border-gray-300 px-4 py-2">Name & Hourly Pay</th>
            <th class="border border-gray-300 px-4 py-2 w-16">Type</th>
            <th class="border border-gray-300 px-4 py-2 w-20 text-sm">TDC <hr class="border-0"> Onsite</th>
            <th class="border border-gray-300 px-4 py-2 w-20">Manual</th>
            <th class="border border-gray-300 px-4 py-2 w-24">Automatic</th>
            <th class="border border-gray-300 px-4 py-2 w-32">Date Started</th>
            <th class="border border-gray-300 px-4 py-2 text-sm">Benefits <hr class="border border-black"> 
              <span class="text-blue-500">SSS<span> | 
              <span class="text-red-500">Pagibig<span> | 
              <span class="text-yellow-500">PhilHealth<span> 
            </th>
            <th class="border border-gray-300 px-4 py-2 w-24">Account</th>
            <th class="border border-gray-300 px-4 py-2 w-20">Actions</th>
          </tr>
        </thead>
        <tbody>${desktopRow}</tbody>
      </table>
    `;
    } else {
      instructorTable.innerHTML = mobileCard;
    }

    // Event listeners for edit buttons
    document.querySelectorAll(".instructor-edit-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const originalId = this.getAttribute("data-id");

        if (!originalId) {
          console.error("ID not found");
          titleDetails.innerText = "Error";
          modalDetails.innerHTML = "<p>ID not found.</p>";
          modal.style.display = "flex";
          return;
        }

        try {
          const data = details;

          if (response.ok) {
            titleDetails.innerText = "Edit";
            modalDetails.innerHTML = `
            <form id="edit-instructor-form" enctype="multipart/form-data" class="w-96">
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Instructor Name</h3>
                <input type="text" id="instructor-name" name="instructor-name" value="${
                  data.instructor_name
                }" required class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Instructor Name" />
              </div>
              <div class="flex flex-row gap-4 mb-4">
                <div class="w-1/2">
                  <h3 class="text-xl font-semibold mb-3">Rate per Hour</h3>
                  <input type="number" id="rate-per-hour" name="rate-per-hour" value="${
                    data.rate_per_hour
                  }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Rate per Hour" />
                </div>
                <div class="w-1/2">
                  <h3 class="text-xl font-semibold mb-3">Instructor Type</h3>
                  <select id="instructor-type" name="instructor-type" class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                    <option value="PDC" ${
                      data.instructor_type === "PDC" ? "selected" : ""
                    }>PDC</option>
                    <option value="TDC" ${
                      data.instructor_type === "TDC" ? "selected" : ""
                    }>TDC</option>
                    <option value="(P|T)DC" ${
                      data.instructor_type === "(P|T)DC" ? "selected" : ""
                    }>(P|T)DC</option>
                  </select>
                </div>
              </div>
              <div class="flex flex-row mb-4 gap-4">
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">TDC Onsite</h3>
                  <select id="tdc-onsite" name="tdc-onsite" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                    <option value="0" ${
                      data.isTdcOnsite === 0 ? "selected" : ""
                    }>False</option>
                    <option value="1" ${
                      data.isTdcOnsite === 1 ? "selected" : ""
                    }>True</option>
                  </select>
                </div>
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">Manual</h3>
                  <select id="is-manual" name="is-manual" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                    <option value="0" ${
                      data.isManual === 0 ? "selected" : ""
                    }>False</option>
                    <option value="1" ${
                      data.isManual === 1 ? "selected" : ""
                    }>True</option>
                  </select>
                </div>
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">Automatic</h3>
                  <select id="is-automatic" name="is-automatic" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                    <option value="0" ${
                      data.isAutomatic === 0 ? "selected" : ""
                    }>False</option>
                    <option value="1" ${
                      data.isAutomatic === 1 ? "selected" : ""
                    }>True</option>
                  </select>
                </div>
              </div>
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Accreditation Number</h3>
                <input type="text" id="accreditation-number" name="accreditation-number" value="${
                  data.accreditaion_number ? data.accreditaion_number : ""
                }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
              </div>
              <div class="flex flex-row mb-4 gap-3">
                <h3 class="text-xl font-semibold mb-3">Date Started</h3>
                <input type="date" id="date-started" name="date-started" value="${
                  data.date_started
                }" class=" items-center outline outline-1 outline-gray-300 rounded-md text-lg px-1" 
                placeholder="Enter Program Name" />
              </div>
              <button id="instructor-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
            </form>
          `;
            modal.style.display = "flex";

            // Attach event listener for form submission
            document.getElementById("edit-instructor-form").addEventListener(
              "submit",
              async (event) => {
                event.preventDefault();
                const formData = new FormData(event.target);

                try {
                  const updateResponse = await fetch(
                    `/account/api/manage-people/${originalId}`,
                    {
                      method: "PUT",
                      body: formData,
                    }
                  );
                  if (updateResponse.ok) {
                    alert("Instructor updated successfully!");
                    renderInstructorsList();
                  } else {
                    alert("Failed to update instructor. Please try again.");
                  }
                  modal.style.display = "none";
                } catch (error) {
                  console.error("Error updating instructor data", error);
                  alert("An error occurred while updating the instructor.");
                  modal.style.display = "none";
                }
              },
              { once: true }
            );
          } else {
            console.error("Failed to fetch instructor data");
            titleDetails.innerText = "Error";
            modalDetails.innerHTML = "<p>Failed to fetch instructor data.</p>";
            modal.style.display = "flex";
          }
        } catch (error) {
          console.error("Error fetching instructor data", error);
          titleDetails.innerText = "Error";
          modalDetails.innerHTML = "<p>Error fetching instructor data.</p>";
          modal.style.display = "flex";
        }
      });
    });
  }
  instructorTable.style.display = "flex";
}

renderInstructorProfile();

const weeklyTable = document.getElementById("weekly-table");
const monthlyTable = document.getElementById("monthly-table");
const weeklyBtn = document.getElementById("weekly-btn");
const monthlyBtn = document.getElementById("monthly-btn");
const backBtn = document.getElementById("back-btn");
const filterContainer = document.getElementById("filter-container");

weeklyBtn.addEventListener("click", (event) => {
  event.preventDefault();
  monthlyTable.innerHTML = "";
  weeklyTable.innerHTML = "";
  fetchWeeklyPayments();
});

async function fetchWeeklyPayments() {
  try {
    const response = await fetch("/account/api/instructor-payments/weekly");
    if (!response.ok) throw new Error("Network response was not ok");

    const weeklyData = await response.json();
    filterContainer.style.display = "flex";
    weeklyTable.innerHTML = renderWeeklyPayments(weeklyData);
    weeklyTable.style.display = "flex";
  } catch (error) {
    console.error("Error fetching weekly payments:", error);
  }
}

function renderWeeklyPayments(data) {
  const details = data;

  const weeklyHistoryData = details.weeklyHistoryData;
  const currentWeekPayrollData = details.currentWeekPayrollData;

  let desktopRows = "";
  desktopRows = weeklyHistoryData
    .map(
      (arr) => `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${arr.payroll_id}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.instructor_name
            } - ${arr.rate_per_hour}
            </td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.date_start
            } <hr class="border border-black"> ${arr.date_end}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.attended_hours
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.rate_per_hour * arr.attended_hours
            }</td>
            <td class="border border-gray-300 px-4 py-2">${arr.benefits}</td>
             <td class=" border border-gray-300 px-4 py-2">
              <button class="paid-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                arr.payroll_id
              }">
                ${
                  arr.isPaid == "TRUE"
                    ? '<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>'
                    : '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                }</button></td>
            <td class="border border-gray-300 px-4 py-2">
              <button data-id="${arr.instructor_id}"
                class="weekly-payroll-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
            </td>
          </tr>
        `
    )
    .join("");

  let mobileRows = "";
  mobileRows = weeklyHistoryData
    .map((arr) => {
      return `
        <!-- Mobile Row -->
        <tr class="border-b">
          <td colspan="5" class="px-2 py-2">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between">
                <div>
                  <span>ID:</span>
                  <span class="font-semibold">${arr.payroll_id}</span>
                </div>
                <div>Date Started: <br><strong>${arr.date_start}</strong> </div>
                <div>Date Ended: <br><strong>${arr.date_end}</strong></div>
              </div>
              <div class="flex justify-between">
                <div>Rate per Hour: ${arr.rate_per_hour}</div>
                <div>Attended Hours: ${arr.attended_hours}</div>
                <div>Income: ${arr.attended_hours * arr.rate_per_hour}</div>
              </div>
              <div class="flex justify-between">
                <button data-id="${arr.instructor_id}"
                  class="weekly-payroll-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit
                </button>
                <div>
                  <span>Paid:</span>
                  <button class="paid-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                    arr.payroll_id
                  }">
                    ${
                      arr.isPaid == "TRUE"
                        ? '<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>'
                        : '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                    }
                  </button>
                </div>
                
                <div>Benefits: ${arr.benefits}</div>

              </div>
            </div>
          </td>
        </tr>
        `;
    })
    .join("");

  const tableRows = window.innerWidth > 768 ? desktopRows : mobileRows;
  return `
          <p>Current Week </p>
          ${renderCurrentWeekPayTable(currentWeekPayrollData)}
          
          <p class="mt-5">Weekly History</p>
          <table id="weekly-payroll-table" class="w-full mt-7 text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr class="hidden md:table-row ">
                <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
                <th class="border border-gray-300 px-4 py-2">Instructor Name - Rate / Hour</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Date</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Attended Hours</th>
                <th class="border border-gray-300 px-4 py-2 w-24">Gross Income</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Benefits</th>
                <th class="border border-gray-300 px-4 py-2 w-24">Paid</th>
                <th class="border border-gray-300 px-4 py-2 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        `;
}

function renderCurrentWeekPayTable(data) {
  const details = data;
  const currentDate = new Date().toLocaleDateString();
  const desktopRow = details.map(
    (arr) => `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${
              arr.instructor_name
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.rate_per_hour
            }</td>
            <td class="border border-gray-300 px-4 py-2">${currentDate}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.attended_hours
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.rate_per_hour * arr.attended_hours
            }</td>
          </tr>
        `
  );

  const mobileRow = details.map(
    (arr) => `
<tr class="border-b">
  <td colspan="5" class="px-2 py-2">
    <div class="flex flex-col gap-3">
      <div class="flex justify-between">
        <div>
          <span class="font-semibold">${arr.instructor_name}</span>
        </div>
        <div>Rate/hour: <br><strong>${arr.rate_per_hour}</strong> </div>
        <div>Hour Attended: ${arr.attended_hours}</div>
      </div>
      <div class="flex justify-between">
        <div>Date: <br><strong>${currentDate}</strong></div>
        <div>Income: ${arr.attended_hours * arr.rate_per_hour}</div>
      </div>
      </div>
    </div>
  </td>
</tr>
  `
  );
  const tableRows = window.innerWidth > 768 ? desktopRow : mobileRow;
  return `
          <table id="current-week-payroll-table" class="w-full text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr class="hidden md:table-row">
                <th class="border border-gray-300 px-4 py-2">Instructor Name</th>
                <th class="border border-gray-300 px-4 py-2">Rate / Hour</th>
                <th class="border border-gray-300 px-4 py-2">Date</th>
                <th class="border border-gray-300 px-4 py-2">Attended Hours</th>
                <th class="border border-gray-300 px-4 py-2">Income</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        `;
}

async function fetchMonthlyPayments() {
  try {
    const response = await fetch("/account/api/instructor-payments/monthly");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const monthlyData = await response.json();
    filterContainer.style.display = "flex";
    monthlyTable.innerHTML = renderMonthlyPayments(monthlyData);
    monthlyTable.style.display = "flex";
  } catch (error) {
    console.error("Error fetching weekly payments:", error);
  }
}

monthlyBtn.addEventListener("click", (event) => {
  event.preventDefault();
  monthlyTable.innerHTML = "";
  weeklyTable.innerHTML = "";
  fetchMonthlyPayments();
});

function renderMonthlyPayments(data) {
  const details = data;
  if (!data) {
    return "<p>No payroll data available.</p>";
  }

  let desktopRows = "";
  desktopRows = details
    .map(
      (arr) => `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${arr.payroll_id}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.instructor_id
            } - ${arr.instructor_name} - ${arr.rate_per_hour}
            </td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.date_start
            } <hr class="border border-black"> ${arr.date_end}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.attended_hours
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.gross_income
            }</td>
            <td class="border border-gray-300 px-4 py-2">${arr.benefits}</td>
            <td class="border border-gray-300 px-4 py-2">${arr.net_income}</td>
             <td class=" border border-gray-300 px-4 py-2">
              <button class="request-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                arr.payroll_id
              }">
                ${
                  arr.isPaid == "TRUE"
                    ? '<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>'
                    : '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                }</button></td>
            <td class="border border-gray-300 px-4 py-2">
              <button data-id="${arr.payroll_id}"
                class="monthly-delete-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Delete</button>
            </td>
          </tr>
        `
    )
    .join("");

  let mobileRows = "";
  mobileRows = details
    .map((arr) => {
      return `
        <!-- Mobile Row -->
        <tr class="border-b border-b-gray-700">
          <td colspan="5" class="px-2 py-2">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between">
                <div>
                  <span>ID:</span>
                  <span class="font-semibold">${arr.payroll_id}</span>
                </div>
                <div>Date Started: <br><strong>${arr.date_start}</strong> </div>
                <div>Date Ended: <br><strong>${arr.date_end}</strong></div>
              </div>
              <div class="flex justify-between">
                <div>Rate per Hour: <br> ${arr.rate_per_hour}</div>
                <div>Attended Hours: <br> ${arr.attended_hours}</div>
                <div>Income: <br> ${arr.gross_income}</div>
                <div>Benefits: <br> ${arr.benefits}</div>
              </div>
              <div class="flex justify-between">
                <div>
                  <span>Paid:</span>
                  <button class="paid-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                    arr.payroll_id
                  }">
                    ${
                      arr.isPaid == "TRUE"
                        ? '<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>'
                        : '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                    }
                  </button>
                </div>
                <div>Net Income: ${arr.net_income}</div>
              </div>
            </div>
          </td>
        </tr>
        `;
    })
    .join("");

  const tableRows = window.innerWidth > 768 ? desktopRows : mobileRows;
  return `
          <table id="monthly-payroll-table" class="w-full text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr class="hidden md:table-row">
                <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
                <th class="border border-gray-300 px-4 py-2">Instructor Name - Rate / Hour</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Date</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Attended Hours</th>
                <th class="border border-gray-300 px-4 py-2 w-24">Gross Income</th>
                <th class="border border-gray-300 px-4 py-2 w-32">Benefits</th>
                <th class="border border-gray-300 px-4 py-2 w-28">Net Income</th>
                <th class="border border-gray-300 px-4 py-2 w-24">Paid</th>
                <th class="border border-gray-300 px-4 py-2 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        `;
}

backBtn.addEventListener("click", () => {
  filterContainer.style.display = "none";
  weeklyTable.style.display = "none";
  monthlyTable.style.display = "none";
});

// When the user clicks on <span> (x), close the modal
spanX.onclick = function () {
  modalDetails.innerHTML = "";
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modalDetails.innerHTML = "";
    modal.style.display = "none";
  }
};

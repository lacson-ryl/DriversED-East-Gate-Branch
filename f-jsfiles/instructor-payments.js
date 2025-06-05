// Initialize modal and its components
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

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
    const response = await fetch("/api/instructor-payments/weekly");
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
  if (
    !data ||
    data.weeklyHistoryData.length === 0 ||
    data.weeklyHistoryData.length === 0
  ) {
    return "<p>No payroll data available.</p>";
  }
  const details = data;

  const weeklyHistoryData = details.weeklyHistoryData;
  const currentWeekPayrollData = details.currentWeekPayrollData;

  let tableRows = weeklyHistoryData
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
              <button class="request-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                arr.payroll_id
              }">
                ${
                  arr.isPaid == "TRUE"
                    ? '<div class="text-green-700 hover:font-semibold rounded-md">Yes</div>'
                    : '<div class="text-red-700 hover:font-semibold rounded-md">No</div>'
                }</button></td>
            <td class="border border-gray-300 px-4 py-2">
              <button data-id="${arr.instructor_id}"
                class="instructor-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
            </td>
          </tr>
        `
    )
    .join("");

  return `
          <p>Current Week </p>
          ${renderCurrentWeekPayTable(currentWeekPayrollData)}
          
          <p class="mt-5">Weekly History</p>
          <table id="weekly-payroll-table" class="w-full mt-7 text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr>
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
  let tableRows = details
    .map(
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
    )
    .join("");

  return `
          <table id="current-week-payroll-table" class="w-full text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr>
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
    const response = await fetch("/api/instructor-payments/monthly");
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
  let tableRows = details
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

  return `
          <table id="monthly-payroll-table" class="w-full text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr>
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

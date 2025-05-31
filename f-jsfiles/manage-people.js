// Initialize modal and its components
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

async function renderInstructorsList() {
  const response = await fetch("/api/manage-people/list");
  const data = await response.json();
  const instructorTable = document.getElementById(
    "instructors-payroll-history-table"
  );

  if (!data.instructorList) {
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
    const details = data.instructorList;
    let tableRows = details
      .map(
        (arr) => `
        <tr class="text-center hover:outline outline-1 outline-black">
          <td class="border border-gray-300 px-4 py-2">${arr.instructor_id}</td>
          <td class="border border-gray-300 px-4 py-2">${
            arr.instructor_name
          } - ${arr.rate_per_hour}</td>
          <td class="border border-gray-300 px-4 py-2">${
            arr.instructor_type
          }</td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              arr.isTdcOnsite === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              arr.isManual === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">
            ${
              arr.isAutomatic === 1
                ? '<div class="text-green-600 font-semibold rounded-md px-2">YES</div>'
                : '<div class="text-red-600 font-semibold rounded-md px-2">NO</div>'
            }
          </td>
          <td class="border border-gray-300 px-4 py-2">${arr.date_started}</td>
          <td class="border border-gray-300 px-4 py-2 text-sm">
            ${arr.SSS || 0} | ${arr.Pag_ibig || 0} | ${arr.Philhealth || 0}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            <button data-id="${arr.instructor_id}"
              class="instructor-weekly-payroll-btn hover:bg-gray-200 hover:outline outline-1 outline-black rounded-md px-2">Weekly</button>
            <button data-id="${arr.instructor_id}"
              class="instructor-payroll-btn hover:bg-gray-200 hover:outline outline-1 outline-black rounded-md px-2">History</button>
          </td>
          <td class="border border-gray-300 px-4 py-2">${
            arr.account_id
              ? `<div class="text-green-600 font-semibold rounded-md px-2">YES</div>`
              : `<button data-id="${arr.instructor_id}"
              class="instructor-assign-account-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2"
              >Assign</button>`
          }
            
          </td>
          <td class="border border-gray-300 px-4 py-2">
            <button data-id="${arr.instructor_id}"
              class="instructor-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
            <button data-id="${arr.instructor_id}"
              class="instructor-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Delete</button>
          </td>
        </tr>
      `
      )
      .join("");
    instructorTable.innerHTML = `
        <table id="manage-people-table" class="w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
          <thead>
            <tr class=" text-sm">
              <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
              <th class="border border-gray-300 px-4 py-2">Name & Hourly Pay</th>
              <th class="border border-gray-300 px-4 py-2 w-16">Type</th>
              <th class="border border-gray-300 px-4 py-2 w-24 text-sm">TDC <hr class="border-0"> Onsite</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Manual</th>
              <th class="border border-gray-300 px-4 py-2 w-28">Automatic</th>
              <th class="border border-gray-300 px-4 py-2 w-32">Date Started</th>
              <th class="border border-gray-300 px-4 py-2 text-sm">Benefits <hr class="border border-black"> SSS | Pagibig | PhilHealth</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Payroll</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Account</th>
              <th class="border border-gray-300 px-4 py-2 w-36">Actions</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;

    allButton(details);
  }
}

renderInstructorsList();

function filterDataById(data, filterBy, id) {
  const filteredData = data.filter((item) => item[filterBy] == id);
  return filteredData[0];
}

function filterPayrollByYear(details) {
  const yearFilterSearch = document.getElementById("year-filter");
  yearFilterSearch.style.display = "flex";

  const form = document.getElementById("year-month-payroll-filter-form");
  const newForm = form.cloneNode(true); // Clone the form to remove existing listeners
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!Array.isArray(details) || details.length === 0) {
      console.error("Invalid or empty payroll data.");
      alert("No payroll data available.");
      return;
    }

    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const month_year = `${month} ${year}`;
    const result = details.filter((item) =>
      item.month_year.includes(month_year)
    );
    console.log(result);

    if (result.length === 0) {
      alert("No payroll data found for the selected year.");
      renderMonthlyPayrollTable([]); // Clear the table
      return;
    }

    renderMonthlyPayrollTable(result);
  });
}

function allButton(details) {
  // Modal form template for adding a instructor
  const modalForm = `
    <form id="add-instructor-form" enctype="multipart/form-data" class="min-w-96">
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Instructor Name</h3>
        <input type="text" id="instructor-name" name="instructor-name" required class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Instructor Name" />
      </div>
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Rate per Hour</h3>
        <input type="number" id="rate-per-hour" name="rate-per-hour" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Rate per Hour" />
      </div>
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Instructor Type</h3>
        <select id="instructor-type" name="instructor-type" class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
          <option value="PDC">PDC</option>
          <option value="TDC">TDC</option>
          <option value="(P|T)DC">(P|T)DC</option>
        </select>
      </div>
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="">
          <h3 class="text-xl font-semibold mb-3">TDC Onsite</h3>
          <select id="tdc-onsite" name="tdc-onsite" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
        <div class="">
          <h3 class="text-xl font-semibold mb-3">Manual</h3>
          <select id="is-manual" name="is-manual" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
        <div class="">
          <h3 class="text-xl font-semibold mb-3">Automatic</h3>
          <select id="is-automatic" name="is-automatic" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
      </div>
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Accreditation Number</h3>
        <input type="text" id="accreditation-number" name="accreditation-number" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1"   />
      </div>
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Date Started</h3>
        <input type="date" id="date-started" name="date-started" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Name" />
      </div>
      </div>
      <button id="instructor-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
    </form>
    `;

  // Event listener for add instructor button
  const addButton = document.getElementById("add-instructor-button");
  if (addButton) {
    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      modalDetails.innerHTML = modalForm;
      modal.style.display = "flex";

      document
        .getElementById("add-instructor-form")
        .addEventListener("submit", async function (event) {
          event.preventDefault();
          const form = document.getElementById("add-instructor-form");
          const formData = new FormData(form);

          try {
            const response = await fetch("/api/manage-people/instructor-add", {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              alert("Instructor Added Successfully!");
              modal.style.display = "none";
              renderInstructorsList();
            } else {
              alert("Can't add Instructor right now!");
              modal.style.display = "none";
            }
          } catch (error) {
            console.error("Internal Server error", error);
            alert("Internal Server error");
            modal.style.display = "none";
          }
        });
    });
  }

  // Assign Accounts
  document
    .querySelectorAll(".instructor-assign-account-btn")
    .forEach((button) => {
      button.addEventListener("click", async function (event) {
        event.preventDefault();
        const rowId = this.getAttribute("data-id");

        if (!rowId) {
          console.error("ID not found");
          modalDetails.innerHTML = "<p>ID not found.</p>";
          modal.style.display = "flex";
          return;
        }

        const filteredData = filterDataById(details, "instructor_id", rowId);

        modalDetails.innerHTML = `
          <p>Create Account for ${filteredData.instructor_name}?</p>
          <form id="assign-account-form" class="w-96">
            <div class="mb-4">
              <label for="user_name" class="block text-gray-700 text-sm font-bold mb-2">
                NAME
              </label>
              <input
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                id="user_name" name="user_name" type="text" value="${filteredData.instructor_name}">
            </div>
            <div class="mb-4">
              <label for="user_email" class="block text-gray-700 text-sm font-bold mb-2">
                EMAIL
              </label>
              <input
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                id="user_email" name="user_email" type="text" placeholder="Enter your email: Ex. myemail@mail.my">
            </div>
            <div class="mb-4">
              <label for="account_role" class="block text-gray-700 text-sm font-bold mb-2">
                Role
              </label>
              <select id="account_role" name="account_role"
                class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="flex items-center">
              <button id="assign-account-button"
                class="bg-sky-900 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit">
                Register
              </button>
            </div>
          </form>
    `;
        modal.style.display = "flex";
        const assignAccBtn = document.getElementById("assign-account-button");
        document
          .getElementById("assign-account-form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();
            const assignAccBtn = document.getElementById(
              "assign-account-button"
            );
            assignAccBtn.innerText = "Assigning...";
            const userName = document.getElementById("user_name").value;
            const userEmail = document.getElementById("user_email").value;
            const accountRole = document.getElementById("account_role").value;

            try {
              const response = await fetch(
                `/api/manage-people/assign-account/${rowId}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userName, userEmail, accountRole }),
                }
              );

              if (!response.ok) throw new Error("Error assigning account");

              modalDetails.innerHTML = `<p>Assigning account successful.</p>`;
              assignAccBtn.innerText = "Success";
              setTimeout(() => {
                modal.style.display = "none";
                renderInstructorsList();
              }, 3000);
            } catch (error) {
              console.error(error);
              modalDetails.innerHTML = `<p>Error assigning account.</p>`;
            }
          });
      });
    });

  // Event listeners for edit buttons
  document.querySelectorAll(".instructor-edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const originalId = this.getAttribute("data-id");

      if (!originalId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      try {
        const response = await fetch(`/api/manage-people/${originalId}`);
        const result = await response.json();
        const data = result.instructor;

        if (response.ok) {
          modalDetails.innerHTML = `
            <form id="edit-instructor-form" enctype="multipart/form-data" class="w-96">
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Instructor Name</h3>
                <input type="text" id="instructor-name" name="instructor-name" value="${
                  data.instructor_name
                }" required class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Instructor Name" />
              </div>
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Rate per Hour</h3>
                <input type="number" id="rate-per-hour" name="rate-per-hour" value="${
                  data.rate_per_hour
                }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Rate per Hour" />
              </div>
              <div class="mb-4">
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
              <div class="mb-4">
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
              <div class="mb-4">
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
              <div class="mb-4">
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
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Accreditation Number</h3>
                <input type="text" id="accreditation-number" name="accreditation-number" value="${
                  data.accreditaion_number ? data.accreditaion_number : ""
                }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
              </div>
              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Date Started</h3>
                <input type="date" id="date-started" name="date-started" value="${
                  data.date_started
                }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Name" />
              </div>
              <button id="instructor-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
            </form>
          `;
          modal.style.display = "flex";

          // Attach event listener for form submission
          document
            .getElementById("edit-instructor-form")
            .addEventListener("submit", async (event) => {
              event.preventDefault();
              const formData = new FormData(event.target);

              try {
                const updateResponse = await fetch(
                  `/api/manage-people/${originalId}`,
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
            });
        } else {
          console.error("Failed to fetch instructor data");
          modalDetails.innerHTML = "<p>Failed to fetch instructor data.</p>";
          modal.style.display = "flex";
        }
      } catch (error) {
        console.error("Error fetching instructor data", error);
        modalDetails.innerHTML = "<p>Error fetching instructor data.</p>";
        modal.style.display = "flex";
      }
    });
  });

  const instructorTable = document.getElementById(
    "instructors-current-payroll-table"
  );
  const backButton = document.getElementById("back-button");
  //Event listeners for payroll buttons
  document.querySelectorAll(".instructor-payroll-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const ID = this.getAttribute("data-id");
      const response = await fetch(`/api/manage-people/payroll/${ID}`);
      const data = await response.json();

      if (response.ok) {
        filterPayrollByYear(data);
        renderMonthlyPayrollTable(data);
        backButton.style.display = "flex";
        addButton.style.display = "none";
      } else {
        console.error("Error fetching instructor payroll data", error);
        modalDetails.innerHTML =
          "<p>Error fetching instructor payroll data.</p>";
        modal.style.display = "flex";
      }
    });
  });

  document
    .querySelectorAll(".instructor-weekly-payroll-btn")
    .forEach((button) => {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        document.getElementById("year-filter").style.display = "none";
        const rowId = this.getAttribute("data-id");
        renderCurrentPayroll(rowId);
      });
    });

  backButton.addEventListener("click", () => {
    renderInstructorsList();
    backButton.style.display = "none";
    addButton.style.display = "flex";
    document.getElementById("year-filter").style.display = "none";
    instructorTable.style.display = "none";
  });

  // Event listeners for delete buttons
  document.querySelectorAll(".instructor-delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");

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
            const response = await fetch(`/api/manage-people/${rowId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              alert(`Successfully Deleted ID no. ${rowId}`);
              renderInstructorsList();
            } else {
              alert(`Can't Delete ID no. ${rowId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error deleting instructor data", error);
            alert("An error occurred while deleting the instructor.");
            modal.style.display = "none";
          }
        });

      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });
}

function renderMonthlyPayrollTable(data) {
  const instructorTable = document.getElementById(
    "instructors-current-payroll-table"
  );
  const details = data;
  let tableRows = details
    .map(
      (arr) => `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${arr.payroll_id}</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.instructor_id
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.rate_per_hour
            }</td>
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
  instructorTable.innerHTML = `
          <table id="monthly-payroll-table" class="w-full text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr>
                <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
                <th class="border border-gray-300 px-4 py-2">Instructor Name</th>
                <th class="border border-gray-300 px-4 py-2 w-28">Rate / Hour</th>
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
  instructorTable.style.display = "flex";
}

async function renderCurrentPayroll(id) {
  const response = await fetch(`/api/manage-people/current-payroll/${id}`);
  const data = await response.json();
  console.log("data", data);

  const currentPayrollTable = document.getElementById(
    "instructors-current-payroll-table"
  );

  if (!response.ok) {
    currentPayrollTable.innerText = "Failed to fetch this week payroll data";
    return;
  }

  currentPayrollTable.innerHTML = renderWeeklyPayrollTable(data);
}

function renderCurrentWeekPayrollTable(data) {
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

function renderWeeklyPayrollTable(data) {
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
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              arr.rate_per_hour
            }</td>
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
          ${renderCurrentWeekPayrollTable(currentWeekPayrollData)}
          
          <p class="mt-7">Weekly History</p>
          <table id="weekly-payroll-table" class="w-full mt-7 text-sm text-center font-normal justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead>
              <tr>
                <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
                <th class="border border-gray-300 px-4 py-2">Instructor Name</th>
                <th class="border border-gray-300 px-4 py-2 w-28">Rate / Hour</th>
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

/*
document
  .getElementById("year-month-payroll-filter-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;

    const month_year = `${month} ${year}`;
    const response = await fetch(`/api/manage-people/payroll/${month_year}`);
    const data = await response.json();

    if (!resppnse.ok) {
      currentPayrollTable.innerText = "Failed to fetch this week payroll data";
      return;
    }

    renderDataTable(data);
  });
*/

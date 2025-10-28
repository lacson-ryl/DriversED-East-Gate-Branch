import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

// Initialize modal and its components
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

const modalForm = `
    <form id="add-instructor-form" enctype="multipart/form-data" class="w-96">
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Instructor Name</h3>
        <input type="text" id="instructor-name" name="name" required
          class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Instructor Name" />
      </div>
      <div class="mb-4 flex flex-row gap-4 ">
        <div class="1/2">
          <h3 class="text-xl font-semibold mb-3">Instructor Type</h3>
          <select id="instructor-type" name="type"
            class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="PDC">PDC</option>
            <option value="TDC">TDC</option>
            <option value="(P|T)DC">(P|T)DC</option>
          </select>
        </div>
        <div class="1/2">
          <h3 class="text-xl font-semibold mb-3">Rate per Hour</h3>
          <input type="number" id="rate-per-hour" name="rate"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Rate per Hour" />
        </div>
      </div>
      
      <div class="flex flex-row gap-4 mb-4">
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">TDC Onsite</h3>
          <select id="tdc-onsite" name="onsite" required
            class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">Manual</h3>
          <select id="is-manual" name="manual" required
            class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">Automatic</h3>
          <select id="is-automatic" name="automatic" required
            class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
            <option value="0">False</option>
            <option value="1">True</option>
          </select>
        </div>
      </div>

      <div class="flex flex-row gap-4 mb-4">
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">SSS</h3>
          <input type="number" name="SSS" step="0.01" min="0"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
        </div>
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">Pagibig</h3>
          <input type="number" name="Pagibig" step="0.01" min="0"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
        </div>
        <div class="w-1/3">
          <h3 class="text-xl font-semibold mb-3">Philhealth</h3>
          <input type="number" name="Philhealth" step="0.01" min="0"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
        </div>
      </div>
      
      <div class="mb-4 flex flex-row gap-4">
        <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Accreditation Number</h3>
          <input type="text" id="accreditation-number" name="accreditationNumber"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
        </div>
        <div class="mb-4">
          <h3 class="text-xl font-semibold mb-3">Date Started</h3>
          <input type="date" id="date-started" name="dateStarted"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Name" />
        </div>
      </div>
      <div class="flex flex-row mb-4 gap-4 items-center">
        <img id="profile-picture-preview"
          class="w-36 h-32 rounded-md border-2 content-center border-gray-300 mb-4 object-fill" src=""
          alt="Profile Picture Preview">
        <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*" class="text-sm text-gray-600">
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
    setupImagePreview();

    const submitBtn = document.getElementById("instructor-submit-button");
    document.getElementById("add-instructor-form").addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const encrypting = await encryptData(formData);

        showBtnLoading(submitBtn);

        try {
          const response = await fetch(
            "/account/api/manage-people/instructor-add",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
            }
          );
          if (response.ok) {
            showBtnResult(submitBtn, true);
            alert("Successfully add Instructor!");
            renderInstructorsList();
          } else {
            showBtnResult(submitBtn, false);
            alert("Can't add Instructor right now!");
          }
          setTimeout(() => {
            modalDetails.innerText = "";
            modal.style.display = "none";
          }, 3000);
        } catch (error) {
          console.error("Internal Server error", error);
          alert("Internal Server error");
          modal.style.display = "none";
        }
      },
      { once: true }
    );
  });
}

const showAccBtn = document.getElementById("show-accounts-button");
if (showAccBtn) {
  showAccBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    await getAllAccounts();
  });
}

async function getAllAccounts() {
  try {
    const response = await fetch("/account/api/all-accounts");
    const encrypted = await response.json();
    modalDetails.innerHTML = ``;

    if (!response.ok) {
      modalDetails.innerText = encrypted.error;
      modal.style.display = "flex";
      setTimeout(() => {
        modal.style.display = "none";
      }, 3000);
      return;
    }

    const data = await decryptData(encrypted.encrypted);
    loadAccountsTable(data);
  } catch (error) {
    modalDetails.innerText = "Failed to load accounts.";
    modal.style.display = "flex";
    setTimeout(() => {
      modal.style.display = "none";
    }, 3000);
  }
}

const instructorTable = document.getElementById("instructors-table");
const accountTable = document.getElementById("accounts-table");

function loadAccountsTable(data) {
  accountTable.innerHTML = "";
  accountTable.innerHTML = `
    <div class="flex flex-col w-full">
      <div class="flex justify-between items-center mb-4">
        <div class="flex flex-row gap-4">
          <button id="back-admin-button" class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
          <- Back
          </button>
          <button id="add-admin-button" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          + Add Admin
          </button>
        </div>
      </div>
      <h2 class="text-xl place-self-center font-bold">All Accounts</h2>
      <table class="w-full border border-gray-300 rounded-md overflow-hidden">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">ID</th>
            <th class="px-4 py-2 text-left">Name</th>
            <th class="px-4 py-2 text-left">Email</th>
            <th class="px-4 py-2 text-left">Role</th>
            <th class="px-4 py-2 text-left">Status</th>
            <th class="px-4 py-2 text-left">Date Created</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (account) => `
            <tr class="hover:border-r-8 hover:border-l-8 border-r-rose-400/50 border-l-rose-400/50 ">
              <td class="px-4 py-2">${account.account_id || "—"}</td>
              <td class="px-4 py-2">${account.admin_name || "—"}</td>
              <td class="px-4 py-2">${account.user_email}</td>
              <td class="px-4 py-2">${account.account_role}</td>
              <td class="px-4 py-2">${
                account.isVerify === 1 ? "Verified" : "Pending"
              }</td>
              <td class="px-4 py-2">${account.date_created}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  accountTable.style.display = "flex";
  instructorTable.style.display = "none";
  const backAdminBtn = document.getElementById("back-admin-button");
  if (backAdminBtn) {
    backAdminBtn.addEventListener("click", () => {
      accountTable.innerHTML = "";
      accountTable.style.display = "none";
      instructorTable.style.display = "flex";
    });
  }

  const addAdminBtn = document.getElementById("add-admin-button");
  if (addAdminBtn) {
    addAdminBtn.addEventListener("click", () => {
      modalDetails.innerHTML = "";
      modalDetails.innerHTML = `
        <form id="registration-form">
            <div class="mb-4">
                <label for="admin_name" class="block text-gray-700 text-sm font-bold mb-2">
                    NAME
                </label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                    id="admin_name" name="admin_name" type="text" placeholder="Enter your name: Ex. Juan">
            </div>
            <div class="mb-4">
                <label for="user_email" class="block text-gray-700 text-sm font-bold mb-2">
                    EMAIL
                </label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                    id="user_email" name="user_email" type="text" placeholder="Enter your email: Ex. myemail@mail.my">
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="user_password">
                    PASSWORD
                </label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight hover:border-blue-900 focus:outline-none focus:blue-yellow-900"
                    id="user_password" name="user_password" type="password" placeholder="Enter your password" />
            </div>
            <div class="flex items-center justify-center">
                <button id="register-btn"
                    class="bg-sky-900 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit" value="Register">
                    Register
                </button>
            </div>
        </form>
      `;
      modal.style.display = "flex";

      const registerForm = document.getElementById("registration-form");
      registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const encrypting = await encryptData(formData);
        const regBtn = document.getElementById("register-btn");
        showBtnLoading(regBtn);
        try {
          const response = await fetch(`/account/api/admin-registration`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
          });
          if (response.ok) {
            showBtnResult(regBtn, true);
            alert("Admin Registered Successfully");
          } else {
            const data = await response.json();
            alert(`Error : ${data.error}`);
            showBtnResult(regBtn, false);
          }
          setTimeout(() => {
            modalDetails = "";
            modal.style.display = "none";
          }, 3000);
        } catch (error) {
          console.error(error);
          alert("Internal Server Error");
        }
      });
    });
  }
}

async function renderInstructorsList() {
  const response = await fetch("/account/api/manage-people/list");
  const encrypted = await response.json();
  const data = await decryptData(encrypted.encrypted);

  if (!response.ok) {
    instructorTable.innerHTML = `
        <table class="mt-3 mb-5 mx-3 text-left justify-items-center table-fixed border-collapse border-2 border-gray-300">
          <thead>
            <tr>
              <th class="border border-gray-300 px-4 py-2">Failed to render Instructor Table</th>
            </tr>
          </thead>
        </table>
      `;
  } else if (Object.keys(data).length == 0) {
    instructorTable.innerHTML = `
        <table class="mt-3 mb-5 mx-3 text-left justify-items-center table-fixed border-collapse border-2 border-gray-300">
          <thead>
            <tr>
              <th class="border border-gray-300 px-4 py-2">No Instructor added yet.</th>
            </tr>
          </thead>
        </table>
      `;
  } else {
    const details = data;
    let tableRows = details
      .map(
        (arr) => `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-2 py-2">
              <img src="${
                arr.instructor_profile_picture
                  ? arr.instructor_profile_picture
                  : "/account/f-assets/solid/black/user.svg"
              }"
                  alt="Instructor Photo"
                  class="w-10 h-10 object-cover rounded-full mx-auto" />
            </td>
            <td class="border border-gray-300 px-4 py-2">
            ${arr.instructor_id} - ${arr.instructor_name} - ${
          arr.rate_per_hour
        }</td>
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
            <td class="border border-gray-300 px-4 py-2">${
              arr.date_started
            }</td>
            <td class="border border-gray-300 px-4 py-2 text-sm">
              <span class="text-blue-500">${arr.SSS || 0}</span> |
              <span class="text-red-500">${arr.Pag_ibig || 0}</span> |
              <span class="text-yellow-500">${arr.Philhealth || 0}</span>
            </td>
            <td class="border border-gray-300 px-4 py-2">
              <button data-id="${
                arr.instructor_id
              }" class="instructor-weekly-payroll-btn hover:bg-gray-200 hover:outline outline-1 outline-black rounded-md px-2">Weekly</button>
              <button data-id="${
                arr.instructor_id
              }" class="instructor-payroll-btn hover:bg-gray-200 hover:outline outline-1 outline-black rounded-md px-2">History</button>
            </td>
            <td class="border border-gray-300 px-4 py-2">
              ${
                arr.account_id
                  ? `<div class="text-green-600 font-semibold rounded-md px-2">YES</div>
                    <button data-id="${arr.instructor_id}" class="instructor-assign-account-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Change</button>
                  `
                  : `<button data-id="${arr.instructor_id}" class="instructor-assign-account-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Assign</button>`
              }
            </td>
            <td class="border border-gray-300 px-2 py-2">
              <button data-id="${
                arr.instructor_id
              }" class="instructor-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">
                <img src="/account/f-assets/solid/icons_for_buttons/pencil.svg" class="w-6 h-6 reverse-color" />
              </button>
              <button data-id="${arr.instructor_id}" 
              data-account-id="${
                arr.account_id
              }" class="instructor-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">
                <img src="/account/f-assets/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-color" />
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    instructorTable.innerHTML = `
        <table id="manage-people-table" class="w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
          <thead>
            <tr class="text-sm">
              <th class="border border-gray-300 px-2 py-2 w-12">Photo</th>
              <th class="border border-gray-300 px-4 py-2">ID - Name - Hourly Pay</th>
              <th class="border border-gray-300 px-4 py-2 w-16">Type</th>
              <th class="border border-gray-300 px-4 py-2 w-24 text-sm">TDC <hr class="border-0"> Onsite</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Manual</th>
              <th class="border border-gray-300 px-4 py-2 w-28">Automatic</th>
              <th class="border border-gray-300 px-4 py-2 w-32">Date Started</th>
              <th class="border border-gray-300 px-4 py-2 text-sm">Benefits <hr class="border border-black"> 
                <span class="text-blue-500">SSS<span> | 
                <span class="text-red-500">Pagibig<span> | 
                <span class="text-yellow-500">PhilHealth<span></th>
              <th class="border border-gray-300 px-4 py-2 w-24">Payroll</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Account</th>
              <th class="border border-gray-300 px-4 py-2 w-24">Actions</th>
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

    if (result.length === 0) {
      alert("No payroll data found for the selected year.");
      renderMonthlyPayrollTable([]); // Clear the table
      return;
    }

    renderMonthlyPayrollTable(result);
  });
}

function allButton(details) {
  const addButton = document.getElementById("add-instructor-button");

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
                id="user_name" name="userName" type="text" value="${filteredData.instructor_name}">
            </div>
            <div class="mb-4">
              <label for="user_email" class="block text-gray-700 text-sm font-bold mb-2">
                EMAIL
              </label>
              <input
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                id="user_email" name="userEmail" value="${filteredData.user_email}" type="text" placeholder="Enter your email: Ex. myemail@mail.my">
            </div>
            <div class="mb-4">
              <label for="account_role" class="block text-gray-700 text-sm font-bold mb-2">
                Role
              </label>
              <select id="account_role" name="accountRole"
                class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div class="mb-4">
              <label for="prn" class="block text-gray-700 text-sm font-bold mb-2">
                ID PRN
              </label>
              <input
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"
                id="prn" name="prn" type="text" value="${filteredData.prn}" placeholder="Do not include special characters and spaces">
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
            assignAccBtn.innerText = "Assigning...";
            const formData = new FormData(event.target);
            formData.append("id", rowId);
            const encrypting = await encryptData(formData);

            try {
              const response = await fetch(
                `/account/api/manage-people/assign-account`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
                }
              );
              const data = await response.json();
              if (!response.ok) {
                showBtnResult(assignAccBtn, false);
                alert(data.error);
              } else {
                showBtnResult(assignAccBtn, true);
                alert(`Assigning account successful.`);
              }
              setTimeout(() => {
                modalDetails.innerHTML = "";
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

      const data = filterDataById(details, "instructor_id", originalId);

      modalDetails.innerHTML = `
            <form id="edit-instructor-form" enctype="multipart/form-data" class="w-96">
              <div class="flex flex-row gap-4 mb-4 w-full">
                <div class="w-32 gap-4 items-center">
                  <img id="profile-picture-preview"
                    class="object-cover aspect-square w-32 rounded-md border-2 content-center border-gray-300 mb-4" 
                    src="
                    ${
                      data.instructor_profile_picture
                        ? data.instructor_profile_picture
                        : ""
                    }
                    "
                    alt="Profile Picture Preview">
                  <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*" class="text-sm text-gray-600">
                </div>
                <div class="w-full">
                  <h3 class="text-xl font-semibold mb-3">Instructor Name</h3>
                  <input type="text" id="instructor-name" name="name" value="${
                    data.instructor_name
                  }" required class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Instructor Name" />
                </div>  
                
              </div>
              <div class="flex flex-row gap-4 mb-4">
                <div class="w-1/2">
                  <h3 class="text-xl font-semibold mb-3">Rate per Hour</h3>
                  <input type="number" id="rate-per-hour" name="rate" value="${
                    data.rate_per_hour
                  }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Rate per Hour" />
                </div>
                <div class="w-1/2">
                  <h3 class="text-xl font-semibold mb-3">Instructor Type</h3>
                  <select id="instructor-type" name="type" class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
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
                  <select id="tdc-onsite" name="onsite" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
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
                  <select id="is-manual" name="manual" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
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
                  <select id="is-automatic" name="automatic" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                    <option value="0" ${
                      data.isAutomatic === 0 ? "selected" : ""
                    }>False</option>
                    <option value="1" ${
                      data.isAutomatic === 1 ? "selected" : ""
                    }>True</option>
                  </select>
                </div>
              </div>
              
              <div class="flex flex-row gap-4 mb-4">
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">SSS</h3>
                  <input type="number" name="SSS" step="0.01" min="0"
                    value="${data.SSS || ""}"
                    class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
                </div>
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">Pagibig</h3>
                  <input type="number" name="Pagibig" step="0.01" min="0"
                    value="${data.Pag_ibig || ""}"
                    class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
                </div>
                <div class="w-1/3">
                  <h3 class="text-xl font-semibold mb-3">Philhealth</h3>
                  <input type="number" name="Philhealth" step="0.01" min="0"
                    value="${data.Philhealth || ""}"
                    class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Ex. 209.78" />
                </div>
              </div>

              <div class="mb-4">
                <h3 class="text-xl font-semibold mb-3">Accreditation Number</h3>
                <input type="text" id="accreditation-number" name="accreditationNumber" value="${
                  data.accreditation_number ? data.accreditation_number : ""
                }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" />
              </div>
              <div class="flex flex-row mb-4 gap-3">
                <h3 class="text-xl font-semibold mb-3">Date Started</h3>
                <input type="date" id="date-started" name="dateStarted" value="${
                  data.date_started
                }" class=" items-center outline outline-1 outline-gray-300 rounded-md text-lg px-1" 
                 />
              </div>
              <button id="instructor-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
            </form>
          `;
      modal.style.display = "flex";
      setupImagePreview();

      // Attach event listener for form submission
      const editForm = document.getElementById("edit-instructor-form");
      editForm.addEventListener("submit", async (event) => {
        const instructorSubmitBtn = document.getElementById(
          "instructor-submit-button"
        );
        event.preventDefault();
        const formData = new FormData(editForm);

        const encrypting = await encryptData(formData);
        showBtnLoading(instructorSubmitBtn);

        try {
          const updateResponse = await fetch(
            `/account/api/manage-people/${originalId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
            }
          );
          const data = await updateResponse.json();

          if (!updateResponse.ok) {
            if (contentType && contentType.includes("application/json")) {
              const error = await updateResponse.json();
              console.error("Server error:", error);
            } else {
              const text = await updateResponse.text();
              console.error("HTML error:", text);
            }
            return;
          }

          showBtnResult(instructorSubmitBtn, true);
          alert(data.message);
          renderInstructorsList();
          setTimeout(() => {
            modalDetails.innerText = "";
            modal.style.display = "none";
          }, 3000);
        } catch (error) {
          console.error("Error updating instructor data", error);
          alert("An error occurred while updating the instructor.");
          modal.style.display = "none";
        }
      });
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
      const response = await fetch(`/account/api/manage-people/payroll/${ID}`);
      const data = await response.json();

      if (response.ok) {
        filterPayrollByYear(data);
        renderMonthlyPayrollTable(data);
        backButton.style.display = "flex";
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
        backButton.style.display = "flex";
        renderCurrentPayroll(rowId);
      });
    });

  backButton.addEventListener("click", () => {
    renderInstructorsList();
    backButton.style.display = "none";
    addButton.style.display = "flex";
    document.getElementById("year-filter").style.display = "none";
    instructorTable.innerHTML = "";
    instructorTable.style.display = "none";
  });

  // Delete Instructor
  document.querySelectorAll(".instructor-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const rowId = this.getAttribute("data-id");
      const accountId = this.getAttribute("data-account-id");

      if (!rowId) {
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="text-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Instructor ID #${rowId}?</p>
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
          path: `/account/api/manage-people/${rowId}`,
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
                `/account/api/manage-people/${rowId}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "x-delete-token": data.deleteToken,
                  },
                  body: JSON.stringify({ id: accountId }),
                }
              );
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Instructor ID #${rowId}`;
                renderInstructorsList();
              } else {
                tokenIndicator.innerText = `Can't Delete Instructor ID #${rowId}`;
              }
              setTimeout(() => {
                modalDetails.innerText = "";
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting instructor data", error);
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

function setupImagePreview(
  inputId = "profile-picture-input",
  previewId = "profile-picture-preview"
) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderMonthlyPayrollTable(data) {
  const instructorTable = document.getElementById(
    "instructors-current-payroll-table"
  );
  instructorTable.innerHTML = "";
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
  const response = await fetch(
    `/account/api/manage-people/current-payroll/${id}`
  );
  const data = await response.json();

  const currentPayrollTable = document.getElementById(
    "instructors-current-payroll-table"
  );

  if (!response.ok) {
    currentPayrollTable.innerText = "Failed to fetch this week payroll data";
    return;
  }

  currentPayrollTable.innerHTML = "";
  currentPayrollTable.innerHTML = renderWeeklyPayrollTable(data);
  currentPayrollTable.style.display = "flex";
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
          ${renderCurrentWeekPayrollTable(currentWeekPayrollData)}
          
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

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modalDetails.innerText = "";
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modalDetails.innerText = "";
    modal.style.display = "none";
  }
};

import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

async function renderReportDetsTable() {
  const response = await fetch("/api/reports/list");
  const data = await response.json();
  const allReportList = document.getElementById("all-report-list");

  const reportList = data.reportlist;
  allReportList.innerHTML = `
      <table id="report-table" class="w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
          <thead class="">
                <tr>
                  <th class="w-10 border border-gray-300 px-4 py-2">ID</th>
                  <th class="border border-gray-300 px-4 py-2">Title</th>
                  <th class="w-24 border border-gray-300 px-4 py-2">Details</th>
                  <th class="w-32 border border-gray-300 px-4 py-2">Date</th>
                  <th class="w-28 border border-gray-300 px-4 py-2">Status</th>
                  <th class="border border-gray-300 px-4 py-2">Reason</th>
                </tr>
          </thead>
          <tbody class="">
                ${reportList
                  .map(
                    (arr) => `
                  <tr class="text-center hover:outline outline-1 outline-black">
                    <td class="border border-gray-300 px-4 py-2">${
                      arr.report_id
                    }</td>
                    <td class="border border-gray-300 px-4 py-2 truncate">${
                      arr.report_title
                    }</td>
                    <td class="border border-gray-300 px-4 py-2">
                      <button class="report-details-btn outline outline-2 outline-gray-500 hover:font-semibold text-black rounded-md px-2" data-id="${
                        arr.report_id
                      }">
                        Details
                      </button>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">${
                      arr.date_created
                    }</td>
                    <td class=" border border-gray-300 px-4 py-2">
                    <button class="report-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                      arr.report_id
                    }">
                    ${
                      arr.status == "Accept"
                        ? '<div class="text-green-700 hover:font-semibold rounded-md hover ">Accepted</div>'
                        : arr.status == "Deny"
                        ? '<div class="text-red-700 hover:font-semibold rounded-md">Denied</div>'
                        : '<div class="text-gray-700 hover:font-semibold rounded-md">Pending</div>'
                    }</button></td>
                    <td class="border border-gray-300 px-4 py-2 truncate">${
                      !arr.reason
                        ? "Waiting for the admin's response"
                        : arr.reason
                    } </button>
                      </td>
                  </tr>`
                  )
                  .join("")}
          </tbody>
      </table>
  
      <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
          <div class="relative bg-white rounded-lg shadow-lg min-w-screen-md max-w-screen-md p-6 ">
              <span
                  class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
              <h2 id="modal-title" class="text-xl font-semibold">Report Details</h2>
              <p id="modal-details" class="mt-4">the details</p>
          </div>
      </div>
      `;

  allButtons();
}

renderReportDetsTable();

function allButtons() {
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");
  const modalTitle = document.getElementById("modal-title");

  //table for report page
  document.querySelectorAll(".report-details-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      try {
        const response = await fetch(`/report/${id}`);
        const data = await response.json();

        if (response.ok) {
          modalDetails.innerHTML = `
                  <div class="min-w-72"
                    <div class="mb-4">
                        <h3 class="text-xl font-semibold">Name</h3>
                        <p>${data.user_name}</p>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-xl font-semibold">Title</h3>
                        <p>${data.report_title}</p>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-xl font-semibold">Details</h3>
                        <p>${data.report_details}</p>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-xl font-semibold">Status</h3>
                        <p>${
                          data.status == "Accept"
                            ? '<div class="text-green-700 font-semibold rounded-md hover ">Accepted</div>'
                            : data.status == "Deny"
                            ? '<div class="text-red-700 font-semibold rounded-md">Denied</div>'
                            : '<div class="text-gray-700 font-semibold rounded-md">Pending</div>'
                        }</p>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-xl font-semibold">Reason</h3>
                        <p>${
                          !data.reason
                            ? "Waiting for the admin's response"
                            : data.reason
                        }</p>
                    </div>
                  </div>
                `;
        } else {
          modalDetails.innerHTML = "<p>No details found for this ID.</p>";
        }

        modal.style.display = "flex";
      } catch (error) {
        console.error("Error fetching report details:", error);
        modalDetails.innerHTML =
          "<p>An error occurred while fetching details.</p>";
        modal.style.display = "flex";
      }
    });

    document.querySelectorAll(".report-status-btn").forEach((button) =>
      button.addEventListener("click", async function () {
        const rowId = this.getAttribute("data-id");

        if (!rowId) {
          console.error("ID not found");
          modalDetails.innerHTML = "<p>ID not found.</p>";
          modal.style.display = "flex";
          return;
        }
        modalTitle.innerText = "Change Status";
        modalDetails.innerHTML = `
              <form id="report-status-form" class="w-96">
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Status</h3>
                  <select id="status" name="status" required
                  class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                  <option value="Accept">Accept</option>
                  <option value="Deny">Deny</option>
                  </select>
              </div>
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Reason</h3>
                  <input type="textbox" id="reason" name="reason" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1"
                  placeholder="Admin's response" />
              </div>
              <button id="report-status-button" type="submit" class=" bg-blue-800 text-white text-lg rounded-md px-2">Save</button>
              </form>
          `;
        modal.style.display = "flex";
        const reportStatusBtn = document.getElementById("report-status-button");

        document
          .getElementById("report-status-form")
          .addEventListener("submit", async function (event) {
            event.preventDefault();
            const status = document.getElementById("status").value;
            const reason = document.getElementById("reason").value;

            showBtnLoading(reportStatusBtn);

            try {
              const response = await fetch("/api/report/change-status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, reason, rowId }),
              });

              if (response.ok) {
                showBtnResult(reportStatusBtn, true);
                alert("Status Change Successfully!");
                renderReportDetsTable();
              } else {
                showBtnResult(reportStatusBtn, false);
                alert("Unable to change right now!");
              }
              modal.style.display = "none";
            } catch (error) {
              console.error("Error fetching report details:", error);
            }
          });
      })
    );
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

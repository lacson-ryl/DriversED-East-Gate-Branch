import {
  showLoadingMessage,
  showOperationResult,
} from "../utils/modal-feedback.js";

const fetchUserRequestList = async () => {
  try {
    const response = await fetch(`/api/user-requests`, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

async function renderRequestTable() {
  const requestTable = document.getElementById("requestTable");
  const requestList = await fetchUserRequestList();
  if (!Array.isArray(requestList) || requestList.length === 0) {
    requestTable.innerText = "No request found.";
  } else {
    const desktopRows = requestList
      .map(
        (arr) =>
          `
          <tr class="text-center hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${arr.request_id}</td>
            <td class="border border-gray-300 px-4 py-2 truncate">${
              arr.request_title
            }</td>
            <td class="border border-gray-300 px-4 py-2">
              <button
                class="request-details-btn outline outline-2 outline-gray-500 hover:font-semibold text-black rounded-md px-2"
                data-id="${arr.request_id}">
                Details
              </button>
            </td>
            <td class="border border-gray-300 px-4 py-2 truncate">${
              arr.date_created
            }</td>
            <td class="border border-gray-300 px-4 py-2 truncate">
              ${
                arr.status == "Accept"
                  ? '<div class="text-green-600 font-semibold rounded-md px-2">Accepted</div>'
                  : arr.status == "Deny"
                  ? '<div class="text-red-600 font-semibold rounded-md px-2">Denied</div>'
                  : '<div class="text-gray-600 font-semibold rounded-md px-2">Pending</div>'
              }
            </td>
            <td class="border border-gray-300 px-4 py-2 truncate">
              ${!arr.reason ? "Waiting for the admin's response" : arr.reason}
            </td>
          </tr>
        `
      )
      .join("");

    const mobileRows = requestList
      .map(
        (arr) => `
    <tr class="border-b">
      <td colspan="6" class="p-3">
        <div class="flex flex-col gap-3 text-sm">

          <!-- Top Info: ID and Title -->
          <div class="flex justify-between">
            <div>
              <p class="text-gray-500">Request ID</p>
              <p class="font-semibold">${arr.request_id}</p>
            </div>
            <div>
              <p class="text-gray-500">Title</p>
              <p class=" overflow-hidden text-ellipsis">${arr.request_title}</p>
            </div>
          </div>

          <!-- Date and Status -->
          <div class="flex justify-between items-center">
            <div>
              <p class="text-gray-500">Created</p>
              <p class="text-xs">${arr.date_created}</p>
            </div>
            <div class="">
              <button class="request-details-btn outline outline-2 outline-gray-500 hover:font-semibold text-black rounded-md px-2"
                data-id="${arr.request_id}">
                Details
              </button>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <div class="px-2 py-1 rounded-md text-xs font-medium">
              ${
                arr.status == "Accept"
                  ? '<div class="text-green-600 font-semibold rounded-md px-2">Accepted</div>'
                  : arr.status == "Deny"
                  ? '<div class="text-red-600 font-semibold rounded-md px-2">Denied</div>'
                  : '<div class="text-gray-600 font-semibold rounded-md px-2">Pending</div>'
              }
              </div>
            </div>
          </div>

          <!-- Reason -->
          <div>
            <p class="text-gray-500">Admin Response</p>
            <p class="text-xs truncate">${
              !arr.reason ? "Waiting for the admin's response" : arr.reason
            }</p>
          </div>

        </div>
      </td>
    </tr>
  `
      )
      .join("");

    const tableRows = window.innerWidth > 768 ? desktopRows : mobileRows;
    const requestTableContents = `
        <h2 class="text-lg ml-4 my-2"> Manage Requests</h2>
        <table id="user-request-table" class="w-full mt-3 mb-5 table-fixed border-collapse border-2 border-gray-300">
          <thead class="">
            <tr class="text-center hidden md:table-row">
                <th class="w-10 border border-gray-300 px-4 py-2">ID</th>
                <th class="border border-gray-300 px-4 py-2">Title</th>
                <th class="w-24 border border-gray-300 px-4 py-2">Details</th>
                <th class="w-32 border border-gray-300 px-4 py-2">Date</th>
                <th class="w-24 border border-gray-300 px-4 py-2">Status</th>
                <th class="border border-gray-300 px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody class="">
            ${tableRows}
          </tbody>
        </table>
        `;
    requestTable.innerHTML = requestTableContents;
  }
  allButtons();
}
renderRequestTable();

function allButtons() {
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");
  //submition of requestform
  const requestForm = document.getElementById("request-form");

  requestForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();
      const titleRequest = document.getElementById("title-request").value;
      const detailsRequest = document.getElementById("details-request").value;

      showLoadingMessage(modalDetails, "Processing your Request...");
      modal.style.display = "flex";

      try {
        const response = await fetch("/api/submit-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleRequest, detailsRequest }),
        });

        if (response.ok) {
          showOperationResult(
            modalDetails,
            true,
            `Request Successfully Submitted`
          );
          requestForm.reset();
          renderRequestTable();
        } else {
          const data = await response.json();
          showOperationResult(modalDetails, false, `Error: ${data.error}`);
        }

        setTimeout(() => {
          modal.style.display = "none";
        }, 3000);
      } catch (error) {
        console.log("Internal Server Error", error);
        alert("Internal Server Error.");
      }
    },
    { once: true }
  );

  document.querySelectorAll(".request-details-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const requestId = this.getAttribute("data-id");

      try {
        const response = await fetch(`api/user-requests/${requestId}`);
        const data = await response.json();
        console.log(`Fetched details for request ID ${requestId}:`, data); // Debugging log
        if (response.ok) {
          modalDetails.innerHTML = `
                <div class="mb-4">
                    <h3 class="text-xl font-semibold">Title</h3>
                    <p>${data.request_title}</p>
                </div>
                <div class="mb-4">
                    <h3 class="text-xl font-semibold ">Details</h3>
                    <p class="overflow-clip text-clip">${
                      data.request_details
                    }</p>
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
            `;
        } else {
          modalDetails.innerHTML = "<p>No details found for this ID.</p>";
        }

        modal.style.display = "flex";
      } catch (error) {
        console.error("Error fetching request details:", error);
        modalDetails.innerHTML =
          "<p>An error occurred while fetching details.</p>";
        modal.style.display = "flex";
      }
    });
  });
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

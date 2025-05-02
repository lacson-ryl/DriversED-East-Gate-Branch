function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null; // Return null if the cookie is not found
}

const fetchUserReportList = async () => {
  const userId = getCookie("userId"); // Get the userId from the cookie
  if (!userId) {
    console.error("User ID not found in cookies");
    return;
  }

  try {
    const response = await fetch(`/api/user-reports/${userId}`, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

async function renderReportTable() {
  const reportTable = document.getElementById("reportTable");
  const reportList = await fetchUserReportList();
  if (!reportList) return;

  const reportTableContents = `
        <h2 class="text-lg ml-4 my-2"> Manage Reports</h2>
        <table id="user-report-table" class="w-full mt-3 mb-5 table-fixed border-collapse border-2 border-gray-300">
          <thead class="">
            <tr>
                <th class="w-10 border border-gray-300 px-4 py-2">ID</th>
                <th class="border border-gray-300 px-4 py-2">Title</th>
                <th class="w-24 border border-gray-300 px-4 py-2">Details</th>
                <th class="w-32 border border-gray-300 px-4 py-2">Date</th>
                <th class="w-24 border border-gray-300 px-4 py-2">Status</th>
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
                <td class="border border-gray-300 px-4 py-2 truncate">${
                  arr.date_created
                }</td>
                <td class="border border-gray-300 px-4 py-2 truncate">${
                  arr.status == "Accept"
                    ? '<div class="text-green-600 font-semibold rounded-md px-2">Accepted</div>'
                    : arr.status == "Deny"
                    ? '<div class="text-red-600 font-semibold rounded-md px-2">Denied</div>'
                    : '<div class="text-gray-600 font-semibold rounded-md px-2">Pending</div>'
                }</td>
                <td class="border border-gray-300 px-4 py-2 truncate">${
                  !arr.reason ? "Waiting for the admin's response" : arr.reason
                }</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
          <div class="relative bg-white rounded-lg shadow-lg min-w-screen-md max-w-screen-md p-6">
            <span class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer">&times;</span>
            <h2 class="text-xl font-semibold">Report Details</h2>
            <p id="modal-details" class="min-w-96 mt-4">the details</p>
          </div>
        </div>
        `;
  reportTable.innerHTML = reportTableContents;
  allButtons();
}

function allButtons() {
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");
  //submition of reportform
  document
    .getElementById("report-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const titleReport = document.getElementById("title-report").value;
      const detailsReport = document.getElementById("details-report").value;
      const userID = getCookie("userId");

      try {
        const response = await fetch("/api/submit-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleReport, detailsReport, userID }),
        });

        if (response.ok) {
          alert(`Report Successfully Submitted`);
          renderReportTable();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.log("Internal Server Error", error);
        alert("Internal Server Error.");
      }
    });

  document.querySelectorAll(".report-details-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const reportId = this.getAttribute("data-id");
      const userId = getCookie("userId");
      console.log(`Button clicked for report ID: ${reportId}`); // Debugging log

      try {
        const response = await fetch(`api/user-reports/${userId}/${reportId}`);
        const data = await response.json();
        console.log(`Fetched details for report ID ${reportId}:`, data); // Debugging log
        if (response.ok) {
          modalDetails.innerHTML = `
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

renderReportTable();

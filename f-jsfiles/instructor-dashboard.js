// Initialize modal and its components
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

const attendanceTable = document.getElementById("attendance-table");
const traineeInfoBox = document.getElementById("trainee-info-box");
const backBtn = document.getElementById("back-btn");

const attendanceList = [];
async function fetchAttendanceList() {
  const response = await fetch("/api/instructor/attendance-list");
  if (!response.ok) {
    modalDetails.innerText = `Cant fetch attendance list right now`;
    modal.style.display = "flex";
    setInterval(() => {
      modal.style.display = "none";
    }, 3000);
    return;
  }

  const data = await response.json();
  attendanceList.push(...data);
  renderAttendanceTable(attendanceList);
}
fetchAttendanceList();

function renderAttendanceTable(dataList) {
  // Group data by date
  const groupedData = dataList.reduce((acc, item) => {
    const date = item.date; // Assuming `date` is the field for attendance date
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Generate HTML for collapsible sections
  const tableHTML = Object.keys(groupedData)
    .map((date) => {
      const rows = groupedData[date]
        .map(
          (trainee) => `
          <tr class="text-left hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">${
              trainee.attendance_id
            }</td>
            <td class="border border-gray-300 px-4 py-2">${
              trainee.creator_id
            } - ${trainee.user_name}</td>
            <td class="border border-gray-300 px-4 py-2">${
              trainee.hours_attended
            }</td>
            <td class="text-center border border-gray-300 px-4 py-2">
              <button class="request-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                trainee.attendance_id
              }">
                ${
                  trainee.status === "Attended"
                    ? '<div class="text-green-700 hover:font-semibold rounded-md">Attended</div>'
                    : trainee.status === "Absent"
                    ? '<div class="text-red-700 hover:font-semibold rounded-md">Absent</div>'
                    : '<div class="text-gray-700 hover:font-semibold rounded-md">Pending</div>'
                }
              </button>
            </td>
            <td class="border flex flex-row items-center justify-center border-gray-300 px-4 py-2 space-x-2">
              <button data-id="${
                trainee.attendance_id
              }" class="view-applicant-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                <img src="/f-css/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-colorII" />
              </button>
              <button data-id="${
                trainee.attendance_id
              }" class="delete-applicant-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                <img src="/f-css/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-colorII" />
              </button>
            </td>
          </tr>
        `
        )
        .join("");

      return `
        <div class="collapsible-section">
          <button class="flex justify-between collapsible-header bg-sky-500 text-white px-4 py-2 w-full text-left font-semibold">
            ${date}
            <img id="collapsible-icon" src="/f-css/solid/icons_for_buttons/chevron-down.svg" class="w-4 h-4 place-self-center" />
          </button>
          <div class="collapsible-content">
            <table class="w-full text-left text-sm table-fixed border-collapse border-2 border-gray-300 mt-2">
              <thead>
                <tr>
                  <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
                  <th class="border border-gray-300 px-4 py-2">User ID - Name</th>
                  <th class="border border-gray-300 px-4 py-2 w-36">Attended Hours</th>
                  <th class="border border-gray-300 px-4 py-2 w-24">Status</th>
                  <th class="border border-gray-300 px-4 py-2 w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");

  // Inject the generated HTML into the DOM
  const attendanceTable = document.getElementById("attendance-table");
  attendanceTable.innerHTML = tableHTML;

  // Attach event listeners for collapsible functionality
  attachCollapsibleListeners();
  const data = dataList;
  allButtons(data);
}

function attachCollapsibleListeners() {
  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");

  collapsibleHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector("#collapsible-icon");

      // Toggle visibility of the collapsible content
      content.classList.toggle("expanded");

      header.setAttribute(
        "aria-expanded",
        content.classList.contains("expanded")
      );

      // Toggle rotation of the icon
      if (icon.classList.contains("rotate-180")) {
        icon.classList.remove("rotate-180");
        icon.classList.add("rotate-0");
      } else {
        icon.classList.remove("rotate-0");
        icon.classList.add("rotate-180");
      }

      // Optional: Change header background color when expanded
      header.classList.toggle("bg-sky-700");
    });
  });
}

function filterAttendanceList(data, filterBy, id) {
  return data.filter((item) => item[filterBy] == id);
}

function allButtons(dataList) {
  document.querySelectorAll(".request-status-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        setInterval(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }
      const filteredList = filterAttendanceList(
        dataList,
        "attendance_id",
        rowId
      );
      console.log("filteredList", filteredList);
      const result = filteredList[0];

      modalDetails.innerHTML = `
              <p>Change the Status of ID #${rowId}?</p>
              <p>Name: ${result.user_name} ${result.date} </p>
              <form>
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Hours Attended</h3>
                  <input type="number" id="hours-attended" name="hours-attended" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Hours" />
              </div>
              </form>
              <div class="justify-self-end space-x-4 mt-5">
                <button id="status-attended" value="Verified" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2">Attended</button>
                <button id="status-absent" value="Denied" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">Absent</button>
              </div>
            `;
      modal.style.display = "flex";

      const attendedBtn = document.getElementById("status-attended");
      attendedBtn.addEventListener("click", async function () {
        attendedBtn.innerText = "Loading...";
        attendedBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        const hoursAttended = document.getElementById("hours-attended");
        await changeStatus(rowId, "Present", hoursAttended);
      });

      const absentBtn = document.getElementById("status-absent");
      absentBtn.addEventListener("click", async function () {
        absentBtn.innerText = "Loading...";
        absentBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        await changeStatus(rowId, "Absent");
      });
    });

    async function changeStatus(id, status, hoursAttended) {
      try {
        const response = await fetch(`/api/attendance/status/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, hoursAttended }), // Send the status in the request body
        });
        if (response.ok) {
          modalDetails.innerHTML = "<p>Successfully change status</p>";
          setTimeout(() => {
            modal.style.display = "none";
          }, 3000);
          renderAttendanceTable();
        } else {
          alert(`Can't change status of ID no. ${id}`);
        }
        modal.style.display = "none";
      } catch (error) {
        console.error("Error changing status.", error);
        modalDetails.innerHTML =
          "<p>An error occurred while changing status.</p>";
        modal.style.display = "flex";
      }
    }
  });

  document.querySelectorAll(".view-applicant-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const id = this.getAttribute("data-id");

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        setInterval(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }

      const filteredList = filterAttendanceList(dataList, "attendance_id", id);
      const courseID = filteredList[0].user_course_id;
      console.log("courseID", courseID);
      const response = await fetch(
        `/api/instructor-dashboard/trainee-info/${courseID}`
      );
      if (!response.ok) {
        modalDetails.innerText = "Cant fetch trainee info right now";
        modal.style.display = "flex";
        setInterval(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }

      const data = await response.json();
      traineesInfo(data[0]);
      console.log("data", data);
    });
  });
  // Delete button
  document.querySelectorAll(".delete-applicant-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const id = this.getAttribute("data-id");
      console.log("id", id);

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        setInterval(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }

      modalDetails.innerHTML = `
            <p>Are you sure you want to delete ID #${id}?</p>
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
            const response = await fetch(`/api/applicant/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              alert(`Successfully Deleted ID no. ${id}`);
              renderAttendanceTable();
            } else {
              alert(`Can't Delete ID no. ${id}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error deleting application.", error);
            modalDetails.innerHTML =
              "<p>An error occurred while deleting application.</p>";
            modal.style.display = "flex";
          }
        });

      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });
}

function traineesInfo(profile) {
  console.log("profile", profile);
  traineeInfoBox.innerHTML = `
          <div class="flex flex-row gap-5">
              <div class="flex flex-col place-self-center">
                  <img src="/f-css/solid/user-bg.jpg" alt="" class="w-28 h-28">
                  <div>
                      <p>User Course ID: <span>${profile.course_id}</span></p>
                      <a id="edit-profile-btn"
                          class="bg-sky-900 hover:bg-red-600 text-white font-bold px-2 rounded-lg focus:outline-none focus:shadow-outline">
                          Edit Profile
                      </a>
                  </div>
              </div>
              <div class="flex flex-col gap-3">
                  <h1 class="">Name: <span class="text-xl font-semibold">${
                    profile.user_name
                  }</span></h1>
                  <h2>Program: <span class="text-xl font-semibold">${
                    profile.program_name
                  }</span></h2>
                  <div class="flex flex-row gap-5">
                      <p class="">Duration: <span class="text-xl font-semibold">${
                        profile.program_duration
                      }</span> Hours</p>
                      <p>Paid: ${
                        profile.isPaid === 1
                          ? `<span class="text-xl font-semibold text-green">YES</span>`
                          : `<span class="text-xl font-semibold text-red">NO</span>`
                      }</p>
                  </div>
                  <div class="flex flex-row gap-5">
                      <p>Date Started: <span class="text-xl font-semibold">${
                        profile.date_started
                      }</span></p>
                      <p>Completed: <span class="text-xl font-semibold">${
                        profile.date_completed || "--/--/----"
                      }</span></p>
                  </div>
                  <p>Hours Attended: <span class="text-xl font-semibold">${
                    profile.total_hours
                  }</span> Hours</p>
                  <div class="flex flex-row gap-5">
                      <p>Grade Status: ${
                        profile.grading_status === "Completed"
                          ? `<span class="text-green-700 hover:font-semibold rounded-md">${profile.grade}</span>`
                          : '<span class="text-gray-700 hover:font-semibold rounded-md">Pending</span>'
                      }</p>
                          <p>Grade Sheet: ${
                            profile.grading_status === "Pending"
                              ? '<span class="text-gray-700 hover:font-semibold rounded-md">Pending</span>'
                              : `<button id="view-grade-sheet-btn"
                              class="outline outline-1 outline-gray-400 hover:outline-gray-700 rounded-md px-1">View</button>`
                          }</p>
                  </div>
                  <p>Certificate: ${
                    profile.certificate_file
                      ? `<button id="view-certificate-btn"
                          class="outline outline-1 outline-gray-400 hover:outline-gray-700 rounded-md px-1">View</button>`
                      : '<span class="text-gray-700 hover:font-semibold rounded-md">Pending</span>'
                  }</p>
              </div>
          </div>
      `;
  traineeInfoBox.style.display = "flex";
  attendanceTable.style.display = "none";
  backBtn.style.display = "flex";

  // Add event listener for the "View Certificate" button
  const viewCertificateBtn = document.getElementById("view-certificate-btn");
  if (viewCertificateBtn) {
    viewCertificateBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const certificateUrl = profile.certificate_file;
      if (certificateUrl) {
        const newWindow = window.open(certificateUrl, "_blank");
        if (newWindow) {
          newWindow.focus();
        } else {
          alert("Please allow popups for this website.");
        }
      } else {
        alert("Certificate is not available.");
      }
    });
  }
  // Add event listener for the "View Grade Sheet" button
  const viewGradeSheetBtn = document.getElementById("view-grade-sheet-btn");
  if (viewGradeSheetBtn) {
    viewGradeSheetBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const gradeSheetUrl = profile.grade_sheet;
      if (gradeSheetUrl) {
        const newWindow = window.open(gradeSheetUrl, "_blank");
        if (newWindow) {
          newWindow.focus();
        } else {
          alert("Please allow popups for this website.");
        }
      } else {
        alert("Grade sheet is not available.");
      }
    });
  }

  // Add event listener for the "Back" button
  backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    traineeInfoBox.style.display = "none";
    attendanceTable.style.display = "flex";
    backBtn.style.display = "none";
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

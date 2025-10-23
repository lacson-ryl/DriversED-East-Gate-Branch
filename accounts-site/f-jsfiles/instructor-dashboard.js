import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { openFileViewer } from "../utils/file-helper.js";
import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";

// Initialize modal and its components
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");

const attendanceTable = document.getElementById("attendance-table");
const traineeInfoBox = document.getElementById("trainee-info-box");

const pdcBtn = document.getElementById("pdc-takers-btn");
const tdcBtn = document.getElementById("tdc-takers-btn");
let attendanceList, usersProfilePics;
async function fetchAttendanceList(type) {
  const response = await fetch(`/account/api/instructor/attendance-list/${type}`);

  if (!response.ok) {
    modalDetails.innerText = `Cant fetch attendance list right now`;
    modal.style.display = "flex";
    setTimeout(() => {
      modal.style.display = "none";
    }, 3000);
    return;
  }
  if (type == "tdc") {
    tdcBtn.classList.add("outline");
    pdcBtn.classList.remove("outline");
  } else if (type == "pdc") {
    tdcBtn.classList.remove("outline");
    pdcBtn.classList.add("outline");
  }
  const { encrypted } = await response.json();
  const { list, pictures } = await decryptData(encrypted);
  attendanceList = list;
  usersProfilePics = Array.isArray(pictures) ? pictures : [pictures];
  renderAttendanceTable(attendanceList);
}

let currentType;

tdcBtn.addEventListener("click", (event) => {
  event.preventDefault();
  currentType = "tdc";
  fetchAttendanceList("tdc");
});

pdcBtn.addEventListener("click", (event) => {
  event.preventDefault();
  currentType = "pdc";
  fetchAttendanceList("pdc");
});

function renderAttendanceTable(dataList) {
  // Group data by date
  const groupedData = dataList.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Sort keys and rebuild as a new object
  const sortedGroupedData = Object.fromEntries(
    Object.entries(groupedData).sort(
      ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
    )
  );

  // Generate HTML for collapsible sections
  const tableHTML = Object.keys(sortedGroupedData)
    .map((date) => {
      let desktopRows = "";
      desktopRows = sortedGroupedData[date]
        .map(
          (trainee) => `
              <!-- Desktop Row -->
              <tr class="hidden md:table-row text-center hover:outline outline-1 outline-black">
                <td class="border border-gray-300 px-4 py-2">${
                  trainee.attendance_id
                }</td>
                <td class="border border-gray-300 px-4 py-2 text-left">
                ${trainee.created_by.toUpperCase()} - 
                ${trainee.creator_id} - ${trainee.creator_name}</td>
                <td class="border border-gray-300 px-4 py-2">${
                  trainee.date_am_pm
                }</td>
                <td class="border border-gray-300 px-4 py-2">${
                  trainee.hours_attended
                }</td>
                <td class="text-center border border-gray-300 px-4 py-2">
                  <button class="request-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                    trainee.attendance_id
                  }">
                    ${
                      trainee.status == "Present"
                        ? '<div class="text-green-700 hover:font-semibold rounded-md">Attended</div>'
                        : trainee.status == "Absent"
                        ? '<div class="text-red-700 hover:font-semibold rounded-md">Absent</div>'
                        : '<div class="text-gray-700 hover:font-semibold rounded-md">Pending</div>'
                    }
                  </button>
                </td>
                <td class="flex border border-gray-300 px-4 py-2 text-center space-x-2">
                  <button data-id="${
                    trainee.attendance_id
                  }" class="block view-applicant-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                    <img src="/account/f-assets/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-colorII" />
                  </button>
                  <button data-id="${
                    trainee.attendance_id
                  }" class="inline-block delete-applicant-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                    <img src="/account/f-assets/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-colorII" />
                  </button>
                </td>
              </tr>
            `
        )
        .join("");

      let mobileRows = "";
      mobileRows = sortedGroupedData[date]
        .map((trainee) => {
          return `
              <!-- Mobile Row -->
            <tr class="md:hidden border-b">
              <td colspan="5" class="px-2 py-2">
                <div class="flex flex-col gap-1">
                  <div class="flex justify-between">
                    <div>
                      <span class="font-semibold">ID:</span>
                      <span>${trainee.attendance_id}</span>
                    </div>
                    <div>
                      <span class="font-semibold">Slot:</span>
                      <span>${trainee.date_am_pm}</span>
                    </div>
                    <div>Hours: ${trainee.hours_attended}</div>
                  </div>
                  <div class="flex gap-5">
                    <span class="font-semibold">Profile:</span>
                    <div class="ml-2 text-sm flex gap-5">
                      <div>${trainee.creator_name}</div>
                      <div>Status: 
                        ${
                          trainee.status === "Present"
                            ? '<span class="text-green-700 font-semibold">Attended</span>'
                            : trainee.status === "Absent"
                            ? '<span class="text-red-700 font-semibold">Absent</span>'
                            : '<span class="text-gray-600 font-semibold">Pending</span>'
                        }
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2 mt-2">
                    <button data-id="${
                      trainee.attendance_id
                    }" class="request-status-btn bg-blue-500 text-white rounded px-2 py-1 text-xs">Status</button>
                    <button data-id="${
                      trainee.attendance_id
                    }" class="view-applicant-btn bg-rose-500 text-white rounded px-2 py-1 text-xs">
                      <img src="/account/f-assets/solid/icons_for_buttons/view-boards.svg" class="w-5 h-5 inline" />
                    </button>
                    <button data-id="${
                      trainee.attendance_id
                    }" class="delete-applicant-btn bg-rose-500 text-white rounded px-2 py-1 text-xs">
                      <img src="/account/f-assets/solid/icons_for_buttons/trash.svg" class="w-5 h-5 inline" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            `;
        })
        .join("");

      return `
        <div class="collapsible-section mb-1 animate-fadeIn">
          <button class="flex justify-between collapsible-header shadow-sm shadow-gray-400 rounded-xl bg-sky-500 text-white px-4 py-2 w-full text-left font-semibold z-10">
            ${date} - ${sortedGroupedData[date].length}
            <img id="collapsible-icon" src="/account/f-assets/solid/icons_for_buttons/chevron-down.svg" class="w-4 h-4 place-self-center" />
          </button>
          <div class="collapsible-content overflow-auto max-h-data-table">
            <div class="overflow-auto max-h-data-table">
              <table class="w-full text-left text-sm border-collapse border-2 border-gray-300 mt-2">
                <thead>
                  <tr class="hidden text-center md:table-row">
                    <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
                    <th class="border border-gray-300 px-4 py-2 text-left">User ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2 w-20">Slot</th>
                    <th class="border border-gray-300 px-4 py-2 w-36">Attended Hours</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Status</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Action</th>
                  </tr>
                </thead>
                <tbody class="">
                  ${desktopRows}
                  ${mobileRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Inject the generated HTML into the DOM
  const attendanceTable = document.getElementById("attendance-table");
  attendanceTable.innerHTML = "";
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
      const content = header.parentElement.querySelector(
        ".collapsible-content"
      );

      const icon = header.querySelector("#collapsible-icon");

      // Toggle visibility of the collapsible content
      content.classList.toggle("expanded");

      if (window.innerWidth > 768) {
        const rows = content.querySelectorAll("tr.hidden"); // Select hidden desktop rows
        rows.forEach((row) => {
          row.classList.remove("hidden");
          row.classList.add("md:table-row");
        });
      }

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

function filterPictureMap(id) {
  return usersProfilePics.filter((item) => item.user_id == id);
}

function allButtons(dataList) {
  document.querySelectorAll(".request-status-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        setTimeout(() => {
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
                  <h3 class="text-xl font-semibold mb-3">Hours Attended <span class="text-sm text-gray-600">if absent leave blank</span></h3>
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
        const hoursAttended = document.getElementById("hours-attended").value;
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
        const response = await fetch(`/account/api/attendance/status/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, hoursAttended }), // Send the status in the request body
        });
        if (response.ok) {
          modalDetails.innerHTML = "<p>Successfully change status</p>";
          setTimeout(() => {
            modal.style.display = "none";
          }, 3000);
          fetchAttendanceList(currentType);
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
        setTimeout(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }

      const filteredList = filterAttendanceList(dataList, "attendance_id", id);
      let filteredProfilePic;

      filteredList[0].created_by == "user"
        ? (filteredProfilePic = filterPictureMap(filteredList[0].creator_id))
        : null;

      const courseID = filteredList[0].user_course_id;
      const profile = await fetchProfile(courseID);
      traineesInfo(profile[0], filteredProfilePic);
    });
  });

  // Delete attendace
  // Delete Applicant
  document.querySelectorAll(".delete-applicant-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const id = this.getAttribute("data-id");

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = "";
      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="font-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Applicant ID #${id}?</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2" disabled>Yes</button>
        <button id="delete-no" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">No</button>
      </div>
    `;
      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");
      const response = await fetch("/account/api/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          path: `/account/api/applicant/${id}`,
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
              const deleteResponse = await fetch(`/account/api/applicant/${id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "x-delete-token": data.deleteToken,
                },
              });
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Applicant ID #${id}`;
                renderAttendanceTable();
              } else {
                tokenIndicator.innerText = `Can't Delete Applicant ID #${id}`;
              }
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting applicant.", error);
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

async function fetchProfile(courseID) {
  const response = await fetch(
    `/account/api/instructor-dashboard/trainee-info/${courseID}`
  );
  if (!response.ok) {
    modalDetails.innerText = "Cant fetch trainee info right now";
    modal.style.display = "flex";
    setTimeout(() => {
      modal.style.display = "none";
    }, 4000);
    return;
  }
  const data = await response.json();
  return data;
}

function traineesInfo(profile, profilePic) {
  traineeInfoBox.innerHTML = "";
  traineeInfoBox.innerHTML = `
          <div class="flex flex-col md:flex-row gap-5 animate-fadeIn" >
              <div class="flex flex-col place-items-center md:place-self-center">
                  <img src="${
                    Object.keys(profilePic).length !== 0
                      ? profilePic[0].profilepic
                      : "/account/f-assets/solid/black/user.svg"
                  }" alt="" class="w-28 h-28">
                  <div>
                      <p>User Course ID: <span>${profile.course_id}</span></p>
                      <button id="back-btn"
                          class="bg-sky-900 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-lg focus:outline-none focus:shadow-outline">
                          Back
                      </button>
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
                  <div class="flex flex-col md:flex-row  gap-5">
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
                  <div class="flex flex-col md:flex-row gap-5">
                      <p>Grade Status: ${
                        profile.grading_status === "Completed"
                          ? `<span class="text-green-700 hover:font-semibold rounded-md">${profile.grade}</span>`
                          : '<span class="text-gray-700 hover:font-semibold rounded-md">Pending</span>'
                      }</p>
                          <p>Grade Sheet: ${
                            !profile.grade_sheet
                              ? `<button id="upload-grade-sheet-btn"
                              class="outline outline-1 outline-gray-400 hover:outline-gray-700 rounded-md px-1">Upload</button>`
                              : `<button id="view-grade-sheet-btn"
                              class="outline outline-1 outline-gray-400 hover:outline-gray-700 rounded-md px-1">View</button>
                                <button id="upload-grade-sheet-btn"
                              class="outline outline-1 outline-gray-400 hover:outline-gray-700 rounded-md px-1">Upload</button>
                              `
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

  const backBtn = document.getElementById("back-btn");

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

      openFileViewer({
        fileData: profile.grade_sheet,
        fileType: profile.grade_sheet_type,
        title: "View Grading Sheet",
      });
    });
  }
  //Grading sheet for completed course upload
  document.getElementById("upload-grade-sheet-btn").addEventListener(
    "click",
    function () {
      const result = profile;

      modalDetails.innerHTML = `
          <form id="grade-completion-upload-form" class="min-w-96">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Grade
                <input type="number" id="course-grade" name="course-grade" 
                 value="${result.grade || ""}"
                class="w-full outline outline-1 outline-gray-300 rounded-md px-2 py-1 mt-1" placeholder="Enter Trainee Grade"/>
            </div>
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Upload of grade sheet: 
                  <hr class="border-white">user-name:  ${
                    result.user_name
                  } | course: ${result.course_id} - ${result.program_name} </h3>
                <input type="file" id="grade-completion-file" name="grade-completion-file" 
                class="w-full rounded-md text-lg px-1" accept="image/*"/>
            </div>
            <button id="completion-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
          </form>
        `;
      modal.style.display = "flex";

      const gradeUploadBtn = document.getElementById(
        "completion-submit-button"
      );
      document
        .getElementById("grade-completion-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("grade-completion-file")
            .files[0];
          const courseGrade = document.getElementById("course-grade").value;
          const formData = new FormData();
          formData.append("grade-completion-file", file);
          formData.append("courseGrade", courseGrade);

          showBtnLoading(gradeUploadBtn);

          try {
            const response = await fetch(
              `/account/api/completed-course/grade-upload/${profile.course_id}`,
              {
                method: "POST",
                body: formData,
              }
            );
            const data = await response.json();
            if (response.ok) {
              showBtnResult(gradeUploadBtn, true);
              alert("Grading Sheet upload success!");
              traineesInfo(data, profilePic);
            } else {
              showBtnResult(gradeUploadBtn, false);
              alert(data.error);
            }
            setTimeout(() => {
              modal.style.display = "none";
            }, 3000);
            return;
          } catch (error) {
            console.error("Error uploading Template", error);
            alert("An error occurred while uploading Template.");
          }
        });
    },
    { once: true }
  );

  // Add event listener for the "Back" button
  backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    traineeInfoBox.style.display = "none";
    attendanceTable.style.display = "flex";
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

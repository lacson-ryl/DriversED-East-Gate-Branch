import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

import { openFileViewer } from "../utils/file-helper.js";

async function renderCompletedCourseList() {
  const response = await fetch("/account/api/completed-course");
  if (!response.ok) {
    console.error("Failed to fetch data from the server");
    return;
  }

  const data = await response.json();
  const certificateTable = document.getElementById("completed-course-table");

  certificateTable.innerHTML = `
        <table id="applicants-table"
            class=" w-full text-center justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead class="text-sm">
                <tr>
                    <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
                    <th class="border border-gray-300 px-4 py-2">User ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2 ">Instructor ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2">Program ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2">Date</th>
                    <th class="border border-gray-300 px-3 py-2 w-16">Hours</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Grade</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Certificate</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Action</th>
                </tr>
            </thead>
            <tbody class="">
                ${data
                  .map(
                    (arr) =>
                      `
                    <tr class=" hover:outline outline-1 outline-black">
                        <td class="text-xs font-semibold border border-gray-300 px-4 py-2">
                             ${arr.course_id} 
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.user_id}- ${arr.user_name}
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.instructor_id}- ${arr.instructor_name}
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.program_id}- ${arr.program_name}
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                             ${arr.date_started} 
                            <hr class="border border-black"> 
                             ${arr.date_completed}</td>
                        <td class="border border-gray-300 px-4 py-2">
                            ${arr.total_hours}
                        </td><td class="border border-gray-300 px-4 py-2">
                          <div>
                              ${
                                arr.grade_sheet
                                  ? `
                                  <a href="javascript:void(0);" class="bg-blue-700 hover:underline view-btn" 
                                  data-id="${arr.course_id}" 
                                  data-file='${arr.grade_sheet}' data-file-type="image/jpeg">
                                    <img src="/f-css/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-color" />  
                                  </a>
  
                                  <button data-id="${arr.course_id}" class="grade-upload-btn bg-yellow-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  `
                                  : `
                                  <button data-id="${arr.course_id}"
                                  class="grade-upload-btn bg-yellow-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  `
                              }
                          </div>
                        </td>
                        <td class="border border-gray-300">
                          <div>
                              ${
                                arr.certificate_file
                                  ? `
                                  <button href="javascript:void(0);" 
                                    class="view-btn bg-green-600 rounded-md px-2 hover:underline"
                                    data-id="${arr.course_id}" 
                                    data-file='${arr.certificate_file}' 
                                    data-file-type="${arr.certificate_file_type}">
                                      <img src="/f-css/solid/icons_for_buttons/view-boards.svg" class="w-6 h-6 reverse-color" />
                                  </button>
  
                                  <button data-id="${arr.course_id}" class="certification-upload-btn bg-yellow-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  <button data-id="${arr.course_id}" data-user-id="${arr.user_id}" data-instructor-id="${arr.instructor_id}" 
                                    class="certification-create-btn bg-red-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/white/plus.svg" class="w-6 h-6 reverse-color scale-150" />
                                  </button>
                                  
                                  <button data-id="${arr.course_id}" data-user-id="${arr.user_id}" data-instructor-id="${arr.instructor_id}" 
                                    Create</button>
                                  `
                                  : `
                                  <button data-id="${arr.course_id}"
                                  class="certification-upload-btn bg-yellow-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  <button data-id="${arr.course_id}" data-user-id="${arr.user_id}" data-instructor-id="${arr.instructor_id}" 
                                  class="certification-create-btn bg-blue-600 rounded-md px-2 hover:underline">
                                    <img src="/f-css/solid/icons_for_buttons/newspaper.svg" class="w-6 h-6 reverse-color" />
                                  </button>
                                  `
                              }
                          </div>
                        </td>
                        <td class="border border-gray-300">
                            <button data-id=" ${arr.course_id}  "
                                class="trainees-info-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">
                                <img src="/f-css/solid/icons_for_buttons/pencil.svg" class="w-6 h-6 reverse-color" />  
                              </button>
                            <button data-user-id=" ${arr.user_id} " 
                              data-date-started=" ${arr.date_started} " 
                              date-continuation=" ${arr.date_completed} "
                              class="trainees-info-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">
                              <img src="/f-css/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-color" />
                            </button>
                        </td>
                    </tr>
                    `
                  )
                  .join("")}
            </tbody>
        </table>
  
        <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
            <div class="relative bg-white rounded-lg shadow-lg min-w-screen-md max-w-screen-md p-6">
                <span
                    class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
                <h2 class="text-xl font-semibold">Completed Trainees Details</h2>
                <p id="modal-details" class="mt-4">the details</p>
            </div>
        </div>
    `;
  //call the button functions.
  allButtons(data);
}

renderCompletedCourseList();

function filterCompletedCourseList(data, id) {
  return data.filter((item) => item.course_id == id);
}

function allButtons(data) {
  // Initialize modal and its components
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  // Edit total hours
  document.querySelectorAll(".trainees-info-edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const originalId = this.getAttribute("data-id");

      if (!originalId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      const filteredList = filterCompletedCourseList(data, originalId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
              <form id="edit-total-hours-form" class="w-96">
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Total Hours</h3>
                  <input type="number" id="total-hours" name="total-hours" value="${result.total_hours}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate Name" />
              </div>
              <button id="edit-total-hours-btn" type="submit" class="bg-blue-800 text-white rounded-md px-2">Save</button>
              </form>
              `;

      modal.style.display = "flex";
      const editHoursBtn = document.getElementById("edit-total-hours-btn");

      // Attach event listener for form submission
      document
        .getElementById("edit-total-hours-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const totalHours = document.getElementById("total-hours").value;

          showBtnLoading(editHoursBtn);

          try {
            const response = await fetch(
              `/account/api/completed-course/edit-hours/${originalId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ totalHours }),
              }
            );
            if (response.ok) {
              showBtnResult(editHoursBtn, true);
              alert("Hours updated successfully!");
              renderCompletedCourseList();
            } else {
              showBtnResult(editHoursBtn, false);
              alert("Failed to update total hours. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error updating certificate data", error);
            alert("An error occurred while updating the certificate.");
          }
        });
    });
  });

  //Create Certificate
  document.querySelectorAll(".certification-create-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const courseId = this.getAttribute("data-id");
      const userId = this.getAttribute("data-user-id");
      const instructorId = this.getAttribute("data-instructor-id");

      if (!courseId || !userId || !instructorId) {
        console.error("ID not found");
        modalDetails.innerText = "ID not found.";
        modal.style.display = "flex";
        setTimeout(() => {
          modal.style.display = "none";
        }, 4000);
        return;
      }

      modalDetails.innerHTML = `
        <h5 class="mt-2 mb-4">For user:${userId} | course:${courseId} | instructor:${instructorId}</h5>
        <h5 class=" mb-4">Choose which certificate type:</h5>
        <div class="flex justify-around">
          <button id="tdc" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2">TDC</button>
          <button id="pdc" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">PDC</button>
        </div>
      `;
      modal.style.display = "flex";

      // Add event listeners for the TDC and PDC buttons
      document.getElementById("tdc").addEventListener("click", function () {
        const url = `/certificates-completion-tdc?userId=${encodeURIComponent(
          userId
        )}&courseId=${encodeURIComponent(
          courseId
        )}&instructorId=${encodeURIComponent(instructorId)}`;
        window.open(url, "_blank");
        modal.style.display = "none";
      });

      document.getElementById("pdc").addEventListener("click", function () {
        const url = `/certificates-completion-pdc?userId=${encodeURIComponent(
          userId
        )}&courseId=${encodeURIComponent(
          courseId
        )}&instructorId=${encodeURIComponent(instructorId)}`;
        window.open(url, "_blank");
        modal.style.display = "none";
      });
    });
  });

  //Certification for completed course upload
  document.querySelectorAll(".certification-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterCompletedCourseList(data, rowId);
      const result = filteredList[0];
      console.log("result", result);

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
          <form id="certificate-completion-upload-form" class="min-w-96">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Upload certificate of completion: 
                  <hr class="border-white">user-name:  ${result.user_name} | course: ${result.course_id} - ${result.program_name} </h3>
                <input type="file" id="certificate-completion-file" name="certificate-completion-file" class="w-full rounded-md text-lg px-1" accept=".pdf"/>
            </div>
            <button id="completion-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
          </form>
        `;
      modal.style.display = "flex";
      const completedCertBtn = document.getElementById(
        "completion-submit-button"
      );
      document
        .getElementById("certificate-completion-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("certificate-completion-file")
            .files[0];
          const formData = new FormData();
          formData.append("certificate-completion-file", file);

          showBtnLoading(completedCertBtn);

          try {
            const response = await fetch(
              `/account/api/completed-course/certificate-upload/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              showBtnResult(completedCertBtn, true);
              alert("Template uploaded successfully!");
              renderCompletedCourseList();
            } else {
              showBtnResult(completedCertBtn, false);
              alert("Failed to upload Template. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading Template", error);
            alert("An error occurred while uploading Template.");
          }
        });
    });
  });

  //Grading shhet for completed course upload
  document.querySelectorAll(".grade-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterCompletedCourseList(data, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
          <form id="grade-completion-upload-form" class="min-w-96">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Grade
                <input type="number" id="course-grade" name="course-grade" 
                value="${result.grade}" 
                class="w-full rounded-md text-lg px-1"/>
            </div>
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Upload of grade sheet: 
                  <hr class="border-white">user-name:  ${result.user_name} | course: ${result.course_id} - ${result.program_name} </h3>
                <input type="file" id="grade-completion-file" name="grade-completion-file" 
                class="w-full rounded-md text-lg px-1" accept="image/*"/>
            </div>
            <button id="completion-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
          </form>
        `;
      modal.style.display = "flex";

      const completedGradeBtn = document.getElementById(
        "completion-submit-button"
      );

      document
        .getElementById("grade-completion-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("grade-completion-file")
            .files[0];
          const courseGrade = document.getElementById("course-grade");
          const formData = new FormData();
          formData.append("grade-completion-file", file);
          formData.append("courseGrade", courseGrade);

          showBtnLoading(completedGradeBtn);

          try {
            const response = await fetch(
              `/account/api/completed-course/grade-upload/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            const data = await response.json();
            if (response.ok) {
              showBtnResult(completedGradeBtn, true);
              alert(data.message);
              renderCompletedCourseList();
            } else {
              showBtnResult(completedGradeBtn, false);
              alert(data.error);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading Template", error);
            alert("An error occurred while uploading Template.");
          }
        });
    });
  });

  //View for cwertificate template pdf
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const courseId = this.getAttribute("data-id");
      const fileData = this.getAttribute("data-file");
      const fileType = this.getAttribute("data-file-type");

      openFileViewer({
        fileData: fileData,
        fileType: fileType,
        title: `Course Id: #${courseId}`,
      });
    });
  });

  // Delete completed Course
  document.querySelectorAll(".trainees-info-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const userId = this.getAttribute("data-user-id");
      const dateStarted = this.getAttribute("data-date-started");
      const continuation = this.getAttribute("date-continuation");

      if (!userId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="font-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Course ID #${userId}?</p>
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
          id: userId,
          path: `/account/api/completed-course/${userId}`,
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
                `/account/api/completed-course/${userId}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "x-delete-token": data.deleteToken,
                  },
                  body: JSON.stringify({ userId, dateStarted, continuation }),
                }
              );
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Course ID #${userId}`;
                renderCompletedCourseList();
              } else {
                tokenIndicator.innerText = `Can't Delete Course ID #${userId}`;
              }
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting course data", error);
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

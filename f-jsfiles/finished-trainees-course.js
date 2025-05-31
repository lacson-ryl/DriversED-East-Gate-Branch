async function renderCompletedCourseList() {
  const response = await fetch("/api/completed-course");
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
                    <th class="border border-gray-300 px-4 py-2 w-16">ID</th>
                    <th class="border border-gray-300 px-4 py-2">User ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2 ">Instructor ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2">Program ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2">Date</th>
                    <th class="border border-gray-300 px-3 py-2 w-16">Hours</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Certificate</th>
                    <th class="border border-gray-300 px-4 py-2">Action</th>
                </tr>
            </thead>
            <tbody class="">
                ${data
                  .map(
                    (arr) =>
                      `
                    <tr class=" hover:outline outline-1 outline-black">
                        <td class="border border-gray-300 px-4 py-2">
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
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                          <div>
                              ${
                                arr.certificate_file
                                  ? `
                                  <a href="javascript:void(0);" class="text-blue-700 hover:underline view-btn" data-id="${
                                    arr.course_id
                                  }" data-file='${JSON.stringify(
                                      arr.certificate_file
                                    )}' data-file-type="${
                                      arr.certificate_file_type
                                    }">View</a>
  
                                  <button data-id="${
                                    arr.course_id
                                  }" class="certification-upload-btn text-yellow-600 rounded-md px-2 hover:underline">Re-upload</button>
                                  <button data-id="${
                                    arr.course_id
                                  }" data-user-id="${
                                      arr.user_id
                                    }" data-instructor-id="${
                                      arr.instructor_id
                                    }" class="certification-create-btn text-yellow-600 rounded-md px-2 hover:underline">Create</button>
                                  `
                                  : `
                                  <button data-id="${arr.course_id}"
                                  class="certification-upload-btn text-yellow-600 rounded-md px-2 hover:underline">Upload</button>
                                  <button data-id="${arr.course_id}" data-user-id="${arr.user_id}" data-instructor-id="${arr.instructor_id}" 
                                  class="certification-create-btn text-blue-600 rounded-md px-2 hover:underline">Create</button>
                                  `
                              }
                          </div>
                        </td>
                        <td class="border border-gray-300 px-4 py-2">
                            <button data-id=" ${arr.course_id}  "
                                class="trainees-info-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
                            <button data-user-id=" ${
                              arr.user_id
                            }  " data-date-started=" ${
                        arr.date_started
                      } " date-continuation=" ${arr.date_completed} "
                                class="trainees-info-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Delete</button>
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

function filterCertificateList(data, id) {
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

      const filteredList = filterCertificateList(data, originalId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
              <form id="edit-total-hours-form" class="w-96">
              <div class="mb-4">
                  <h3 class="text-xl font-semibold mb-3">Total Hours</h3>
                  <input type="number" id="total-hours" name="total-hours" value="${result.total_hours}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Certificate Name" />
              </div>
              <button id="certificate-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Save</button>
              </form>
              `;

      modal.style.display = "flex";

      // Attach event listener for form submission
      document
        .getElementById("edit-total-hours-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const totalHours = document.getElementById("total-hours").value;

          try {
            const response = await fetch(
              `/api/completed-course/edit-hours/${originalId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ totalHours }),
              }
            );
            if (response.ok) {
              alert("Hours updated successfully!");
              renderCompletedCourseList();
            } else {
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
      const filteredList = filterCertificateList(data, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
          <form id="certificate-completion-upload-form" class="min-w-96">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Upload Template for certificate: <hr class="border-white"> ${result.course_id}</h3>
                <input type="file" id="certificate-completion-file" name="certificate-completion-file" class="w-full rounded-md text-lg px-1" accept=".pdf"/>
            </div>
            <button id="completion-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
          </form>
        `;
      modal.style.display = "flex";

      document
        .getElementById("certificate-completion-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("certificate-completion-file")
            .files[0];
          const formData = new FormData();
          formData.append("certificate-completion-file", file);

          try {
            const response = await fetch(
              `/api/completed-course/certificate-upload/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              alert("Template uploaded successfully!");
              renderCompletedCourseList();
            } else {
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

  //View for cwertificate template pdf
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const fileData = JSON.parse(this.getAttribute("data-file"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(fileData.data);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open();
      if (fileType === "application/pdf") {
        newWindow.document.write(
          `<embed src="${url}" width="100%" height="100%" type="${fileType}" />`
        );
      } else {
        newWindow.document.write(`<p>Unsupported file type: ${fileType}</p>`);
      }
      // Revoke the object URL after the new window has loaded the content
      newWindow.onload = function () {
        URL.revokeObjectURL(url);
      };
    });
  });

  // Delete Certificate
  document.querySelectorAll(".trainees-info-delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
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
        <p>Are you sure you want to delete ID #${userId}?</p>
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
            const response = await fetch(`/api/completed-course/${userId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, dateStarted, continuation }),
            });
            if (response.ok) {
              alert(`Successfully Deleted ID no. ${userId}`);
              renderCompletedCourseList();
            } else {
              alert(`Can't Delete ID no. ${userId}`);
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error deleting certificate data", error);
            alert("An error occurred while deleting the certificate.");
            modal.style.display = "none";
          }
        });

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

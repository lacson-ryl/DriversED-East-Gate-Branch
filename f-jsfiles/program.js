async function renderProgramList() {
  const response = await fetch("/api/programs/list");
  const data = await response.json();
  const programTable = document.getElementById("programs-table");

  if (!data.programList) {
    programTable.innerHTML = `
      <table id="programs-table" class="mt-3 mb-5 mx-3 text-left justify-items-start table-fixed border-collapse border-2 border-gray-300">
        <thead>
          <tr>
            <th class="border border-gray-300 px-4 py-2 w-36">Failed to render Program Table</th>
          </tr>
        </thead>
      </table>
    `;
    return;
  }

  const details = data.programList;
  let tableRows = details
    .map(
      (arr) => `
      <tr class="text-left hover:outline outline-1 outline-black">
        <td class="border border-gray-300 px-4 py-2">${arr.program_id}</td>
        <td class="border border-gray-300 px-4 py-2">${arr.program_name}</td>
        <td class="border border-gray-300 px-4 py-2">${
          arr.program_duration
        } - ${arr.program_fee}</td>
        <td class="border border-gray-300 px-4 py-2 truncate">${
          arr.program_description
        }</td>
        <td class="border border-gray-300 px-4 py-2">
          <div>
            ${
              arr.program_cover
                ? `<a href="javascript:void(0);" class="text-blue-700 hover:underline view-btn" data-id="${
                    arr.program_id
                  }" data-image="${JSON.stringify(
                    arr.program_cover
                  )}" data-file-type="${arr.program_cover_file_type}">View</a>
              <button data-id="${
                arr.program_id
              }"class="cover-upload-btn text-yellow-600 rounded-md px-2 hover:underline">Re-upload</button>
              `
                : `
              <button data-id="${arr.program_id}"class="cover-upload-btn text-yellow-600 rounded-md px-2 hover:underline">Upload</button>
              `
            }
          </div>
        </td>
        <td class="border border-gray-300 px-4 py-2">
          ${
            arr.availability === "Available"
              ? '<div class="text-green-600 font-semibold rounded-md px-2">Available</div>'
              : '<div class="text-red-600 font-semibold rounded-md px-2">Unavailable</div>'
          }
        </td>
        <td class="border border-gray-300 px-4 py-2">
          <button data-id="${arr.program_id}"
            class="view-unassign-button bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Unassign</button>
        </td>
        <td class="border border-gray-300 px-4 py-2">
          <button data-id="${arr.program_id}"
            class="program-edit-btn bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white rounded-md px-2">Edit</button>
          <button data-id="${arr.program_id}"
            class="program-delete-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  programTable.innerHTML = `
      <table id="applicants-table" class="w-full text-left justify-items-start table-fixed border-collapse border-2 border-gray-300">
        <thead>
          <tr>
            <th class="border border-gray-300 px-4 py-2 w-16">ID</th>
            <th class="border border-gray-300 px-4 py-2">Program Name</th>
            <th class="border border-gray-300 px-4 py-2 w-36">Duration $ Fee</th>
            <th class="border border-gray-300 px-4 py-2">Description</th>
            <th class="border border-gray-300 px-4 py-2 w-24">Cover</th>
            <th class="border border-gray-300 px-4 py-2 w-32">Availability</th>
            <th class="border border-gray-300 px-4 py-2 w-36">Instructors</th>
            <th class="border border-gray-300 px-4 py-2 w-36">Action</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
        <div class="relative bg-white rounded-lg shadow-lg min-w-96 max-w-screen-md p-6">
          <span
            class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
          <h2 class="text-xl font-semibold">Program Details</h2>
          <p id="modal-details" class="mt-4">the details</p>
        </div>
      </div>
    `;
  allButtons(details);
}

renderProgramList();

//function to filter the list based on the rowid?
function filterProgramList(data, rowId) {
  return data.filter((item) => item.program_id == rowId);
}

async function fetchInstructorsName() {
  const response = await fetch("/api/programs/name-list");
  if (!response.ok) {
    const fetchInstructorsNameMessage = "Failed to fetch instructors list";
    return { error: fetchInstructorsNameMessage };
  }
  const data = await response.json();
  if (!data.instructorsNameList) {
    const fetchInstructorsNameMessage = "No instructors found";
    return { error: fetchInstructorsNameMessage };
  }
  return data.instructorsNameList;
}

// all clickable button in one function
function allButtons(details) {
  // Initialize modal and its components
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  // Modal form template for adding a program
  const modalForm = `
  <form id="add-program-form" class="w-96">
    <div class="mb-4">
      <h3 class="text-xl font-semibold mb-3">Program Name</h3>
      <input type="text" id="program-name" name="program-name" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Name" required/>
    </div>
    <div class="mb-4">
      <h3 class="text-xl font-semibold mb-3">Duration</h3>
      <input type="number" id="program-duration" name="program-duration" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Duration" required/>
    </div>
    <div class="mb-4">
      <h3 class="text-xl font-semibold mb-3">Program Fee</h3>
      <input type="number" id="program_fee" name="program_fee" step="0.01"
        class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Fee ex. 1099.99" />
    </div>
    <div class="mb-4">
      <h3 class="text-xl font-semibold mb-3">Description</h3>
      <textarea type="textbox" id="program-description" name="program-description" class="w-full min-h-28 text-start outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Description" /></textarea>
    </div>
    <div class="mb-4">
      <h3 class="text-xl font-semibold mb-3">Availability</h3>
      <select id="program-availability" name="program-availability" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
        <option value="Available">Available</option>
        <option value="Unavailable">Unavailable</option>
      </select>
    </div>
    <button id="program-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
  </form>
  `;

  // Event listener for add program button
  const addButton = document.getElementById("add-program-button");
  if (addButton) {
    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      modalDetails.innerHTML = modalForm;
      modal.style.display = "flex";

      document
        .getElementById("add-program-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const programName = document.getElementById("program-name").value;
          const status = document.getElementById("program-availability").value;
          const programDuration =
            document.getElementById("program-duration").value;
          const programFee = document.getElementById("program_fee").value;
          const programDescription = document.getElementById(
            "program-description"
          ).value;

          try {
            const response = await fetch("/api/program/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                programName,
                status,
                programDuration,
                programFee,
                programDescription,
              }),
            });
            console.log("response", response);
            if (response.ok) {
              alert("Program Added Successfully!");
              modal.style.display = "none";
              renderProgramList();
            } else {
              alert("Can't add Program right now!");
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

  // Assign programs to instructor
  function renderInstructorsdropdown(details, instructorsName) {
    return assignProgramsForm;
  }

  document
    .getElementById("assign-programs-instructor-button")
    .addEventListener("click", async (event) => {
      const instructorsName = [];
      if (instructorsName.length === 0) {
        const result = await fetchInstructorsName();
        if (result.error) {
          alert(result.error);
          return;
        }
        instructorsName.push(...result);
      }

      event.preventDefault();
      modalDetails.innerHTML = `
    <form id="assign-programs-form" class="w-96">
      <div class="mb-4">
        <label for="instructor">Select Instructor:</label>
        <select id="instructor" name="instructor_id" required 
         class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
         <option value="">Select Instructor</option>
          ${instructorsName
            .map(
              (instructor) => `
          <option value="${instructor.instructor_id}">${instructor.instructor_name}</option>
            `
            )
            .join("")}
        </select>
      </div>
      <div class="mb-4">
        <label>Select Programs:</label>
        <div class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1 gap-3">
          ${details
            .map(
              (program) => `
          <label class="flex items-center space-x-2">
            <input type="checkbox" id="program${program.program_id}" name="program_ids" value="${program.program_id}">
            <span>${program.program_name}</span>
          </label>
            `
            )
            .join("")}
        </div>
      </div>
          <button type="submit" class="bg-blue-800 text-white rounded-md px-2">Assign Programs</button>
    </form>
  `;
      modal.style.display = "flex";

      document
        .getElementById("assign-programs-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const instructorId = document.getElementById("instructor").value;
          const programIds = Array.from(
            document.querySelectorAll("input[name='program_ids']:checked")
          ).map((input) => input.value);

          const response = await fetch("/api/assign-programs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              instructor_id: instructorId,
              program_ids: programIds,
            }),
          });

          if (response.ok) {
            alert("Programs assigned successfully!");
            modal.style.display = "none";
          } else {
            alert("Failed to assign programs.");
          }
        });
    });

  // Unassign button for assigned programs of instructors
  document.querySelectorAll(".view-unassign-button").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const programId = this.getAttribute("data-id");
      const assignedList = [];

      if (assignedList.length === 0) {
        const response = await fetch("/api/programs/assigned-list");

        if (!response.ok) {
          console.error("Failed to fetch assigned programs");
          alert("Failed to fetch assigned programs");
          return;
        }

        const data = await response.json();
        const filteredData = data.filter(
          (item) => item.program_id == programId
        );
        if (filteredData.length === 0) {
          modalDetails.innerHTML =
            "<p>No instructors assigned to this program. </p>";
          modal.style.display = "flex";
          return;
        }

        modalDetails.innerHTML = `
          <form id="unassign-program-form" class="w-96">
            <div class="mb-4">
            <label>Program Name: ${filteredData[0].program_name}</label>
            </div>
            <div class="mb-4">
              <label>Select Instructors to Unassign:</label>
              <div class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1 gap-3">
                ${filteredData
                  .map(
                    (instructor) => `
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instructor${instructor.instructor_id}" name="instructor_ids" value="${instructor.instructor_id}">
                  <span>${instructor.instructor_name}</span>
                </label>
                  `
                  )
                  .join("")}
              </div>
            </div>
            <button type="submit" class="bg-red-800 text-white rounded-md px-2">Unassign Instructors</button>
          </form>
        `;

        modal.style.display = "flex";

        document
          .getElementById("unassign-program-form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();
            const instructorIds = Array.from(
              document.querySelectorAll("input[name='instructor_ids']:checked")
            ).map((input) => input.value);

            const response = await fetch("/api/unassign-programs", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                instructor_id: instructorIds,
                program_ids: [programId],
              }),
            });

            if (response.ok) {
              alert("Instructors unassigned successfully!");
              modal.style.display = "none";
            } else {
              alert("Failed to unassign instructors.");
            }
          });
      }
    });
  });

  // Event listeners for edit buttons
  document.querySelectorAll(".program-edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const originalId = this.getAttribute("data-id");
      console.log(originalId);

      if (!originalId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      const result = filterProgramList(details, originalId);
      const data = result[0];

      modalDetails.innerHTML = `
          <form id="edit-program-form" class="w-96">
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Program Id</h3>
              <input type="text" id="program-id" name="program-id" value="${
                data.program_id
              }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program ID" />
            </div>
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Program Name</h3>
              <input type="text" id="program-name" name="program-name" value="${
                data.program_name
              }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Name" />
            </div>
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Duration</h3>
              <input type="number" id="program-duration" name="program-duration" value="${
                data.program_duration
              }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Duration" />
            </div>
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Program Fee</h3>
              <input type="number" id="program_fee" name="program_fee" step="0.01" value="${
                data.program_fee
              }" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Program Fee ex. 1099.99" />
            </div>
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Description</h3>
              <textarea type="textbox" id="program-description" name="program-description" class="w-full min-h-32 text-start outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Description"/>${
                data.program_description
              }</textarea>
            </div>
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-3">Availability</h3>
              <select id="program-availability" name="program-availability" required class="mt-1 text-lg block w-full outline outline-1 outline-gray-300 rounded-sm px-1">
                <option value="Available" ${
                  data.availability === "Available" ? "selected" : ""
                }>Available</option>
                <option value="Unavailable" ${
                  data.availability === "Unavailable" ? "selected" : ""
                }>Unavailable</option>
              </select>
            </div>
            <button id="program-submit-button" type="submit" class=" bg-blue-800 text-white text-lg rounded-md px-2">Save</button>
          </form>
        `;
      modal.style.display = "flex";

      // Attach event listener for form submission
      document
        .getElementById("edit-program-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const programID = document.getElementById("program-id").value;
          const programName = document.getElementById("program-name").value;
          const availability = document.getElementById(
            "program-availability"
          ).value;
          const programDuration =
            document.getElementById("program-duration").value;
          const programFee = document.getElementById("program_fee").value;
          const programDescription = document.getElementById(
            "program-description"
          ).value;

          try {
            const updateResponse = await fetch(`/api/programs/${originalId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: programID,
                name: programName,
                availability: availability,
                duration: programDuration,
                fee: programFee,
                description: programDescription,
              }),
            });
            if (updateResponse.ok) {
              alert("Program updated successfully!");
              renderProgramList();
            } else {
              alert("Failed to update program. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error updating program data", error);
            alert("An error occurred while updating the program.");
            modal.style.display = "none";
          }
        });
    });
  });

  //Program Photo upload
  document.querySelectorAll(".cover-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterProgramList(details, rowId);
      const result = filteredList[0];

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <form id="cover-upload-form" class="min-w-96">
          <div class="mb-4">
              <h3 class="text-lg font-semibold mb-3">Upload Program Photo for plate number: ${result.program_id} ${result.program_name}</h3>
              <input type="file" id="program-cover" name="program-cover" accept="image/*" class="w-full rounded-md text-lg px-1" />
          </div>
          <button id="cover-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
        </form>
      `;
      modal.style.display = "flex";

      document
        .getElementById("cover-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const coverPhoto = document.getElementById("program-cover").files[0];
          const formData = new FormData();
          formData.append("program-cover", coverPhoto);

          try {
            const response = await fetch(
              `/api/programs/program-cover/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (response.ok) {
              alert("Program photo uploaded successfully!");
              renderProgramList();
            } else {
              alert("Failed to upload program cover. Please try again.");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading program photo", error);
            alert("An error occurred while uploading program photo.");
          }
        });
    });
  });

  // View Car photo Upload
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const carData = JSON.parse(this.getAttribute("data-car"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(carData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open();
      newWindow.document.write(
        `<img src="${url}" alt="Car Picture" style="width: 100%; height: auto;" />`
      );
    });
  });

  // Delete Program
  document.querySelectorAll(".program-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const rowId = this.getAttribute("data-id");
      if (!rowId) {
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="text-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Program ID #${rowId}?</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-blue-700 text-white rounded-md px-2" disabled>Yes</button>
        <button id="delete-no" class="bg-rose-700 text-white rounded-md px-2">No</button>
      </div>
    `;
      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");
      const response = await fetch("/api/delete-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: rowId, path: `/api/programs/${rowId}` }),
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
              const deleteResponse = await fetch(`/api/programs/${rowId}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "x-delete-token": data.deleteToken,
                },
              });
              if (deleteResponse.ok) {
                tokenIndicator.innerText = `Successfully Deleted Program ID #${rowId}`;
                renderProgramList();
              } else {
                tokenIndicator.innerText = `Can't Delete Program ID #${rowId}`;
              }
              setTimeout(() => {
                modalDetails.innerHTML = "";
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting program data", error);
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

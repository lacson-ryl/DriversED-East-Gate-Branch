async function renderApplicantsTable() {
  const response = await fetch("/api/applicants/list");
  if (!response.ok) return alert("Cant get applicants details for the table.");

  const data = await response.json();
  const applicantsTable = document.getElementById("applicants-table");

  applicantsTable.innerHTML = `
    <table id="applicants-table" class="w-full table-fixed border-collapse">
      <thead class="">
        <tr class="text-center">
          <th class="w-10 border border-gray-300 px-4 py-2 text-xs">ID</th>
          <th class="w-20 border border-gray-300 px-4 py-2">Role</th>
          <th class="border border-gray-300 px-4 py-2">Name</th>
          <th class="border border-gray-300 px-4 py-2">Instructor</th>
          <th class="w-32 border border-gray-300 px-4 py-2">Start</th>
          <th class="w-14 border border-gray-300 px-4 py-2">Slot</th>
          <th class="w-32 border border-gray-300 px-4 py-2">Continuation</th>
          <th class="w-14 border border-gray-300 px-4 py-2">Slot</th>
          <th class="w-24 border border-gray-300 px-4 py-2">Type</th>
          <th class="w-36 border border-gray-300 px-4 py-2">Date Applied</th>
          <th class="w-20"></th>
        </tr>
      </thead>
      <tbody class="">
        ${data
          .map(
            (arr) =>
              `
            <tr class="text-center group hover:outline outline-1 outline-black">
              <td class="border border-gray-300 px-4 py-2 text-xs">
                ${arr.application_id}
              </td>
              <td class="border border-gray-300 px-4 py-2">${arr.created_by == "user" ? "USER" : "ADMIN"}</td>
              <td class="border border-gray-300 px-4 py-2">${arr.creator_name}</td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.instructor_name}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.start_date}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.start_date_am_pm}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.continuation}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.continuation_am_pm}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                ${arr.transmission}
              </td>
              <td class="border border-gray-300 px-4 py-2">${arr.created}</td>
              <td class="hidden group-hover:flex justify-around mt-2 text-center">
                <button data-id="${arr.application_id}" class="delete-applicant-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">
                  Delete
                </button>
              </td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>

    <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
      <div class="relative bg-white rounded-lg shadow-lg min-w-screen-lg max-w-screen-lg p-6 ">
        <span
          class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
        <h2 class="text-xl font-semibold">Applicant Details</h2>
        <p id="modal-details" class="mt-4">the details</p>
      </div>
    </div>
  `;
  allButtons();
}

renderApplicantsTable();

function allButtons() {
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  // Add event listeners to all detail buttons FOR APPLICANTS PAGE

  document.querySelectorAll(".delete-applicant-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const applicantId = this.getAttribute("data-id");

      if (!applicantId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      modalDetails.innerHTML = `
        <p>Are you sure you want to delete ID #${applicantId}?</p>
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
            const response = await fetch(`/api/applicant/${applicantId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
              alert(`Successfully Deleted ID no. ${applicantId}`);
              renderApplicantsTable();
            } else {
              alert(`Can't Delete ID no. ${applicantId}`);
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

async function renderAttendanceTable(type) {
  const response = await fetch(`/api/attendance/${type}`);
  if (!response.ok) return alert("Cant get attendance details for the table.");

  const data = await response.json();
  console.log("data", data);
  const groupedData = data.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const tableHTML = Object.keys(groupedData)
    .map((date) => {
      // Desktop rows
      const desktopRows = groupedData[date]
        .map(
          (arr) => `
            <tr class="hidden md:table-row text-center group hover:outline outline-1 outline-black">
              <td class="border text-xs border-gray-300 px-4 py-2">${
                arr.attendance_id
              }</td>
              <td class="border border-gray-300 px-4 py-2">${
                arr.created_by == "user" ? "USER" : "ADMIN"
              } - ${arr.creator_name}</td>
              <td class="border border-gray-300 px-4 py-2">${
                arr.instructor_name
              }</td>
              <td class="border border-gray-300 px-4 py-2">${arr.date}</td>
              <td class="border border-gray-300 px-4 py-2">${
                arr.date_am_pm
              }</td>
              <td class="border border-gray-300 px-4 py-2">${
                arr.transmission
              }</td>
              <td class="border border-gray-300 px-4 py-2">${arr.created}</td>
              <td class="border border-gray-300 px-4 py-2">
                <button class="attendance-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1"
                  data-id="${arr.attendance_id}" 
                  data-date="${arr.date}" 
                  data-name="${arr.creator_name}">
                  ${
                    arr.status == "Present"
                      ? '<div class="text-green-900 hover:font-bold font-semibold rounded-md ">Present</div>'
                      : arr.status == "Absent"
                      ? '<div class="text-red-800 hover:font-bold font-semibold rounded-md">Absent</div>'
                      : '<div class="text-gray-700 hover:font-bold font-semibold rounded-md">Pending</div>'
                  }
                </button>
              </td>
              <td class="border border-gray-300 px-4 py-2 text-center space-x-2">
                <button data-id="${arr.attendance_id}"
                  class="delete-applicant-btn bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md px-2">
                  <img src="/f-css/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-color" />
                </button>
              </td>
            </tr>
          `
        )
        .join("");

      return `
        <div class="collapsible-section mb-1">
          <button class="flex justify-between shadow-sm shadow-gray-400 rounded-full collapsible-header bg-sky-500 text-white px-4 py-2 w-full text-left font-semibold z-10">
            ${date} - ${groupedData[date].length}
            <img id="collapsible-icon" src="/f-css/solid/icons_for_buttons/chevron-down.svg" class="w-4 h-4 place-self-center" />
          </button>
          <div class="collapsible-content overflow-auto max-h-data-table">
            <div class="overflow-auto max-h-data-table">
              <table class="w-full text-left text-sm border-collapse border-2 border-gray-300 mt-2">
                <thead>
                  <tr class="hidden text-center md:table-row">
                    <th class="border border-gray-300 px-4 py-2 w-10">ID</th>
                    <th class="border border-gray-300 px-4 py-2">Name</th>
                    <th class="border border-gray-300 px-4 py-2">Instructor</th>
                    <th class="border border-gray-300 px-4 py-2 w-28">Date</th>
                    <th class="border border-gray-300 px-4 py-2 w-14">Slot</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Type</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Date Applied</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Status</th>
                    <th class="border border-gray-300 px-4 py-2 w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${desktopRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const attendanceTable = document.getElementById("attendance-table");
  attendanceTable.innerHTML = tableHTML;

  attachCollapsibleListeners();
  allButtons();
}

// Collapsible logic (same as instructor dashboard)
function attachCollapsibleListeners() {
  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");
  collapsibleHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.parentElement.querySelector(
        ".collapsible-content"
      );
      const icon = header.querySelector("#collapsible-icon");
      content.classList.toggle("expanded");
      if (window.innerWidth > 768) {
        const rows = content.querySelectorAll("tr.hidden");
        rows.forEach((row) => {
          row.classList.remove("hidden");
          row.classList.add("md:table-row");
        });
      }
      header.setAttribute(
        "aria-expanded",
        content.classList.contains("expanded")
      );
      if (icon.classList.contains("rotate-180")) {
        icon.classList.remove("rotate-180");
        icon.classList.add("rotate-0");
      } else {
        icon.classList.remove("rotate-0");
        icon.classList.add("rotate-180");
      }
      header.classList.toggle("bg-sky-700");
    });
  });
}
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");
const modalTitle = document.getElementById("title-details");

function allButtons() {
  //Change status button
  document.querySelectorAll(".attendance-status-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const id = this.getAttribute("data-id");
      const name = this.getAttribute("data-name");
      const date = this.getAttribute("data-date");

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }
      modalTitle.innerText = "Save Changes";
      modalDetails.innerHTML = `
      <p>Change status of ID #${id}?</p>
      <p class="mt-3">${name} - ${date}</p>
      <div class="space-x-4 mt-5">
        <label for="hours-attended" class="text-lg font-semibold">Hours Attended:</label>
        <input type="number" id="hours-attended" name="hours-attended" 
        class="border border-gray-500 rounded-md px-2 py-1" placeholder="Enter hours attended">
      </div>
      <span class="text-sm text-gray-600">leave blank if absent</span>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="status-present" class="bg-green-700 hover:bg-gradient-to-t from-green-400 to-green-800 text-white text-lg rounded-md px-2">Present</button>
        <button id="status-absent" class="bg-red-700 hover:bg-gradient-to-t from-red-400 to-red-800 text-white text-lg rounded-md px-2">Absent</button>
      </div>
    `;
      modal.style.display = "flex";
      const presentBtn = document.getElementById("status-present");
      presentBtn.addEventListener("click", async () => {
        presentBtn.innerText = "Loading...";
        presentBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        const hoursAttended = document.getElementById("hours-attended").value;
        await changeStatus(id, "Present", hoursAttended);
      });

      const absentBtn = document.getElementById("status-absent");
      absentBtn.addEventListener("click", async () => {
        absentBtn.innerText = "Loading...";
        absentBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        await changeStatus(id, "Absent");
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

  // Delete button
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

document.getElementById("tdc-takers-btn").addEventListener("click", (event) => {
  event.preventDefault();
  renderAttendanceTable("tdc");
});

document.getElementById("pdc-takers-btn").addEventListener("click", (event) => {
  event.preventDefault();
  renderAttendanceTable("pdc");
});

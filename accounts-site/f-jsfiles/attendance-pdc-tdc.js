const pdcBtn = document.getElementById("pdc-takers-btn");
const tdcBtn = document.getElementById("tdc-takers-btn");

let currentType = "pdc";

const currentMonthYear = new Date().toISOString().slice(0, 7);

/* =========================================================
   FETCH ATTENDANCE DATA
========================================================= */

async function fetchPdcTdcData(
  type,
  monthYear = document.getElementById("monthyear")?.value || currentMonthYear,
) {
  const attendanceTable = document.getElementById("attendance-table");

  currentType = type;

  updateTrainingTypeButtons(type);

  /*
   * Show loading state
   */
  attendanceTable.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl p-10 text-center">
      <div class="flex flex-col items-center justify-center gap-3">

        <div class="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>

        <p class="text-sm font-semibold text-slate-500">
          Loading attendance records...
        </p>

      </div>
    </div>
  `;

  const url = `/account/api/attendance/${type}/${monthYear}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    renderAttendanceTable(data);
  } catch (error) {
    console.error("Failed to fetch attendance data:", error);

    attendanceTable.innerHTML = `
      <div class="bg-white border border-red-200 rounded-2xl p-8 text-center">

        <div class="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <span class="text-xl text-red-500">!</span>
        </div>

        <h3 class="font-bold text-slate-700">
          Unable to load attendance
        </h3>

        <p class="text-sm text-slate-500 mt-1">
          Please try again.
        </p>

        <button
          id="retry-attendance"
          class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold">
          Retry
        </button>

      </div>
    `;

    document
      .getElementById("retry-attendance")
      ?.addEventListener("click", () => {
        fetchPdcTdcData(currentType);
      });
  }
}

/* =========================================================
   PDC / TDC BUTTON STATE
========================================================= */

function updateTrainingTypeButtons(type) {
  if (!pdcBtn || !tdcBtn) return;

  pdcBtn.classList.remove("active");
  tdcBtn.classList.remove("active");

  if (type === "pdc") {
    pdcBtn.classList.add("active");
  }

  if (type === "tdc") {
    tdcBtn.classList.add("active");
  }
}

/* =========================================================
   MONTH FILTER
========================================================= */

const monthYearFilter = document.getElementById("monthyearfilter");
const monthYearInput = document.getElementById("monthyear");

if (monthYearInput) {
  monthYearInput.value = currentMonthYear;
}

if (monthYearFilter) {
  monthYearFilter.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedMonth = monthYearInput.value;

    if (!selectedMonth) return;

    fetchPdcTdcData(currentType, selectedMonth);
  });
}

/* =========================================================
   RENDER ATTENDANCE
========================================================= */

function renderAttendanceTable(data) {
  const attendanceTable = document.getElementById("attendance-table");

  if (!attendanceTable) return;

  /*
   * Empty state
   */
  if (!Array.isArray(data) || data.length === 0) {
    attendanceTable.innerHTML = `
      <div class="attendance-empty p-10 text-center">

        <div class="mx-auto mb-4 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <span class="text-xl text-slate-400">📋</span>
        </div>

        <h3 class="text-base font-bold text-slate-700">
          No attendance records
        </h3>

        <p class="text-sm text-slate-500 mt-1">
          There are no attendance records for the selected month.
        </p>

      </div>
    `;

    return;
  }

  /*
   * Group records by date
   */
  const groupedData = data.reduce((acc, item) => {
    const date = item.date;

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(item);

    return acc;
  }, {});

  /*
   * Sort dates chronologically
   */
  const sortedGroupedData = Object.fromEntries(
    Object.entries(groupedData).sort(
      ([dateA], [dateB]) => new Date(dateA) - new Date(dateB),
    ),
  );

  /*
   * Build date sections
   */
  const tableHTML = Object.entries(sortedGroupedData)
    .map(([date, records]) => {
      const desktopRows = records.map((arr) => createDesktopRow(arr)).join("");

      const mobileCards = records.map((arr) => createMobileCard(arr)).join("");

      return `
        <section class="attendance-date-section">

          <!-- Date Header -->
          <button
            type="button"
            class="attendance-date-header collapsible-header flex items-center justify-between px-4 md:px-5 text-left"
            aria-expanded="false">

            <div class="flex items-center gap-3">

              <div class="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                <span class="text-sm font-bold">
                  ${formatDay(date)}
                </span>
              </div>

              <div>

                <div class="font-bold text-sm md:text-base">
                  ${formatDate(date)}
                </div>

                <div class="text-xs opacity-75 mt-0.5">
                  ${records.length}
                  ${records.length === 1 ? "applicant" : "applicants"}
                </div>

              </div>

            </div>

            <div class="flex items-center gap-3">

              <span class="hidden sm:inline-flex text-xs font-bold bg-white/60 px-3 py-1 rounded-full">
                ${records.length}
              </span>

              <img
                src="/account/f-assets/solid/icons_for_buttons/chevron-down.svg"
                class="attendance-chevron w-4 h-4"
                alt=""
              />

            </div>

          </button>


          <!-- Date Content -->
          <div class="attendance-date-content collapsible-content">

            <!-- Desktop -->
            <div class="attendance-table-wrapper hidden md:block">

              <table class="attendance-table">

                <thead>

                  <tr>

                    <th class="text-center">ID</th>
                    <th>Name</th>
                    <th>Instructor</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Type</th>
                    <th>Date Applied</th>
                    <th class="text-center">Status</th>
                    <th class="text-center">Action</th>

                  </tr>

                </thead>

                <tbody>
                  ${desktopRows}
                </tbody>

              </table>

            </div>


            <!-- Mobile -->
            <div class="md:hidden p-1">
              ${mobileCards}
            </div>

          </div>

        </section>
      `;
    })
    .join("");

  attendanceTable.innerHTML = tableHTML;

  attachCollapsibleListeners();

  allButtons();
}

/* =========================================================
   DESKTOP ROW
========================================================= */

function createDesktopRow(arr) {
  const creatorLabel = arr.created_by === "user" ? "USER" : "ADMIN";

  return `
    <tr class="text-center">

      <td class="text-center font-semibold text-slate-500">
        ${escapeHTML(arr.attendance_id)}
      </td>

      <td>
        <div class="font-semibold text-slate-700">
          ${escapeHTML(creatorLabel)} -
          ${escapeHTML(arr.creator_name)}
        </div>
      </td>

      <td>
        ${escapeHTML(arr.instructor_name)}
      </td>

      <td>
        ${escapeHTML(arr.date)}
      </td>

      <td>
        <span class="inline-flex px-2 py-1 rounded-md bg-slate-100 text-xs font-bold">
          ${escapeHTML(arr.date_am_pm)}
        </span>
      </td>

      <td>
        ${escapeHTML(arr.transmission)}
      </td>

      <td>
        ${escapeHTML(arr.created)}
      </td>

      <td class="text-center">

        <button
          class="attendance-status-btn"
          data-id="${escapeHTML(arr.attendance_id)}"
          data-date="${escapeHTML(arr.date)}"
          data-name="${escapeHTML(arr.creator_name)}">

          ${getStatusBadge(arr.status)}

        </button>

      </td>

      <td class="text-center">

        <button
          data-id="${escapeHTML(arr.attendance_id)}"
          data-creator-id="${escapeHTML(arr.creator_id)}"
          data-created-by="${escapeHTML(arr.created_by)}"
          data-course-id="${escapeHTML(arr.user_course_id)}"
          class="delete-applicant-btn attendance-delete-btn"
          title="Delete applicant">

          <img
            src="/account/f-assets/solid/icons_for_buttons/trash.svg"
            class="reverse-color"
            alt="Delete"
          />

        </button>

      </td>

    </tr>
  `;
}

/* =========================================================
   MOBILE CARD
========================================================= */

function createMobileCard(arr) {
  const creatorLabel = arr.created_by === "user" ? "USER" : "ADMIN";

  return `
    <article class="attendance-mobile-card">

      <div class="flex items-start justify-between gap-3 mb-4">

        <div>

          <div class="attendance-mobile-label">
            Applicant
          </div>

          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(creatorLabel)} -
            ${escapeHTML(arr.creator_name)}
          </div>

        </div>

        <div>
          ${getStatusBadge(arr.status)}
        </div>

      </div>


      <div class="grid grid-cols-2 gap-x-4 gap-y-3">

        <div>
          <div class="attendance-mobile-label">ID</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.attendance_id)}
          </div>
        </div>

        <div>
          <div class="attendance-mobile-label">Slot</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.date_am_pm)}
          </div>
        </div>

        <div>
          <div class="attendance-mobile-label">Instructor</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.instructor_name)}
          </div>
        </div>

        <div>
          <div class="attendance-mobile-label">Type</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.transmission)}
          </div>
        </div>

        <div>
          <div class="attendance-mobile-label">Date</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.date)}
          </div>
        </div>

        <div>
          <div class="attendance-mobile-label">Date Applied</div>
          <div class="attendance-mobile-value mt-1">
            ${escapeHTML(arr.created)}
          </div>
        </div>

      </div>


      <div class="border-t border-slate-100 mt-4 pt-3 flex justify-end">

        <button
          data-id="${escapeHTML(arr.attendance_id)}"
          data-creator-id="${escapeHTML(arr.creator_id)}"
          data-created-by="${escapeHTML(arr.created_by)}"
          data-course-id="${escapeHTML(arr.user_course_id)}"
          class="delete-applicant-btn attendance-delete-btn"
          title="Delete applicant">

          <img
            src="/account/f-assets/solid/icons_for_buttons/trash.svg"
            class="reverse-color"
            alt="Delete"
          />

        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function getStatusBadge(status) {
  if (status === "Present") {
    return `
      <span class="attendance-status attendance-status-present">
        Present
      </span>
    `;
  }

  if (status === "Absent") {
    return `
      <span class="attendance-status attendance-status-absent">
        Absent
      </span>
    `;
  }

  return `
    <span class="attendance-status attendance-status-pending">
      Pending
    </span>
  `;
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDay(dateString) {
  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.getDate();
}

/* =========================================================
   COLLAPSIBLE SECTIONS
========================================================= */

function attachCollapsibleListeners() {
  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");

  collapsibleHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.parentElement.querySelector(
        ".collapsible-content",
      );

      const icon = header.querySelector(".attendance-chevron");

      if (!content) return;

      const isExpanded = content.classList.contains("expanded");

      /*
       * Close
       */
      if (isExpanded) {
        content.classList.remove("expanded");

        header.classList.remove("expanded");

        header.setAttribute("aria-expanded", "false");

        icon?.classList.remove("rotated");
      } else {

      /*
       * Open
       */
        content.classList.add("expanded");

        header.classList.add("expanded");

        header.setAttribute("aria-expanded", "true");

        icon?.classList.add("rotated");
      }
    });
  });
}

/* =========================================================
   BUTTON FUNCTIONALITY
========================================================= */

function allButtons() {
  /*
   * STATUS BUTTONS
   */
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

          <p class="text-sm text-slate-500">
            Change attendance status for:
          </p>

          <p class="mt-1 font-semibold text-slate-800">
            ${escapeHTML(name)}
          </p>

          <p class="text-sm text-slate-500 mt-1">
            Attendance ID #${escapeHTML(id)}
            · ${escapeHTML(date)}
          </p>


          <div class="space-y-2 mt-5">

            <label
              for="hours-attended"
              class="text-sm font-semibold text-slate-700">
              Hours Attended
            </label>

            <input
              type="number"
              id="hours-attended"
              name="hours-attended"
              min="0"
              step="0.5"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Enter hours attended"
            />

            <span class="text-xs text-slate-500">
              Leave blank if absent.
            </span>

          </div>


          <div class="flex justify-end gap-2 mt-6">

            <button
              id="status-absent"
              class="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold">
              Absent
            </button>

            <button
              id="status-present"
              class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
              Present
            </button>

          </div>

        `;

      modal.style.display = "flex";

      /*
       * PRESENT
       */
      const presentBtn = document.getElementById("status-present");

      presentBtn?.addEventListener("click", async () => {
        const hoursAttended = document.getElementById("hours-attended")?.value;

        if (
          !hoursAttended ||
          isNaN(hoursAttended) ||
          Number(hoursAttended) < 0
        ) {
          alert("Please enter a valid number of hours attended.");
          return;
        }

        presentBtn.innerText = "Saving...";
        presentBtn.disabled = true;

        presentBtn.classList.add("cursor-not-allowed", "animate-pulse");

        await changeStatus(id, "Present", hoursAttended);
      });

      /*
       * ABSENT
       */
      const absentBtn = document.getElementById("status-absent");

      absentBtn?.addEventListener("click", async () => {
        absentBtn.innerText = "Saving...";
        absentBtn.disabled = true;

        absentBtn.classList.add("cursor-not-allowed", "animate-pulse");

        await changeStatus(id, "Absent");
      });
    });
  });

  /*
   * DELETE BUTTONS
   */
  document.querySelectorAll(".delete-applicant-btn").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();

      const id = this.getAttribute("data-id");

      const creatorId = this.getAttribute("data-creator-id");

      const createdBy = this.getAttribute("data-created-by");

      const courseId = this.getAttribute("data-course-id");

      if (!id) {
        console.error("ID not found");

        modalDetails.innerHTML = "<p>ID not found.</p>";

        modal.style.display = "flex";

        return;
      }

      modalTitle.innerText = "Delete Applicant";

      modalDetails.innerHTML = `

          <p
            id="delete-token-indicator"
            class="text-sm text-slate-500 animate-pulse">
            Checking delete authorization...
          </p>

          <p class="mt-3 text-slate-700">
            Are you sure you want to delete
            Applicant ID
            <strong>#${escapeHTML(id)}</strong>?
          </p>

          <div class="flex justify-end gap-2 mt-6">

            <button
              id="delete-no"
              class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
              Cancel
            </button>

            <button
              id="delete-yes"
              class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              disabled>
              Delete
            </button>

          </div>

        `;

      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");

      /*
       * Cancel
       */
      document.getElementById("delete-no")?.addEventListener("click", () => {
        modal.style.display = "none";
      });

      /*
       * Request delete token
       */
      try {
        const response = await fetch("/account/api/delete-token", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id,
            path: "/account/api/delete-attendance",
          }),
        });

        const tokenData = await response.json();

        if (!response.ok) {
          tokenIndicator.innerText =
            tokenData.error || "Failed to fetch delete token.";

          tokenIndicator.classList.remove("text-slate-500");

          tokenIndicator.classList.add("text-red-600");

          return;
        }

        tokenIndicator.innerText = "Delete authorization ready.";

        tokenIndicator.classList.remove("animate-pulse", "text-slate-500");

        tokenIndicator.classList.add("text-emerald-600");

        const deleteYes = document.getElementById("delete-yes");

        deleteYes.disabled = false;

        deleteYes.addEventListener(
          "click",
          async () => {
            deleteYes.innerText = "Deleting...";

            deleteYes.disabled = true;

            try {
              const deleteResponse = await fetch(
                "/account/api/delete-attendance",
                {
                  method: "DELETE",

                  headers: {
                    "Content-Type": "application/json",

                    "x-delete-token": tokenData.deleteToken,
                  },

                  body: JSON.stringify({
                    id,
                    creatorId,
                    createdBy,
                    courseId,
                  }),
                },
              );

              const dataDelRes = await deleteResponse.json();

              if (deleteResponse.ok) {
                tokenIndicator.innerText =
                  dataDelRes.message || "Applicant deleted successfully.";

                tokenIndicator.classList.remove("text-emerald-600");

                tokenIndicator.classList.add("text-green-600");

                /*
                 * Refresh using the actual API.
                 *
                 * The old version called:
                 * renderAttendanceTable(currentType)
                 *
                 * which passes a string instead of
                 * the attendance array.
                 */
                setTimeout(() => {
                  modal.style.display = "none";

                  fetchPdcTdcData(currentType);
                }, 1000);
              } else {
                tokenIndicator.innerText =
                  dataDelRes.error || "Unable to delete applicant.";

                tokenIndicator.classList.remove("text-emerald-600");

                tokenIndicator.classList.add("text-red-600");

                deleteYes.disabled = false;

                deleteYes.innerText = "Delete";
              }
            } catch (error) {
              console.error("Error deleting applicant.", error);

              tokenIndicator.innerText = "An error occurred while deleting.";

              tokenIndicator.classList.add("text-red-600");

              deleteYes.disabled = false;

              deleteYes.innerText = "Delete";
            }
          },
          { once: true },
        );
      } catch (error) {
        console.error("Error fetching delete token:", error);

        tokenIndicator.innerText =
          "An error occurred while requesting authorization.";

        tokenIndicator.classList.remove("text-slate-500");

        tokenIndicator.classList.add("text-red-600");
      }
    });
  });
}

/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(id, status, hoursAttended) {
  try {
    const response = await fetch(`/account/api/attendance/status/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        status,
        hoursAttended,
      }),
    });

    modalDetails.innerHTML = "";

    if (response.ok) {
      modalDetails.innerHTML = `

        <div class="text-center py-4">

          <div class="text-emerald-600 font-bold">
            Attendance updated successfully.
          </div>

        </div>

      `;

      /*
       * Refresh the current PDC/TDC list correctly.
       */
      setTimeout(() => {
        modal.style.display = "none";

        fetchPdcTdcData(currentType);
      }, 800);
    } else {
      modalDetails.innerHTML = `

        <div class="text-red-600">
          Can't change status of ID #${escapeHTML(id)}.
        </div>

      `;
    }
  } catch (error) {
    console.error("Error changing status.", error);

    modalDetails.innerHTML = `

      <div class="text-red-600">
        An error occurred while changing status.
      </div>

    `;
  }
}

/* =========================================================
   MODAL
========================================================= */

const modal = document.getElementById("myModal");

const span = document.getElementsByClassName("close")[0];

const modalDetails = document.getElementById("modal-details");

const modalTitle = document.getElementById("title-details");

if (span) {
  span.onclick = function () {
    modal.style.display = "none";
  };
}

window.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   PDC / TDC EVENTS
========================================================= */

if (tdcBtn) {
  tdcBtn.addEventListener("click", (event) => {
    event.preventDefault();

    fetchPdcTdcData("tdc", monthYearInput?.value || currentMonthYear);
  });
}

if (pdcBtn) {
  pdcBtn.addEventListener("click", (event) => {
    event.preventDefault();

    fetchPdcTdcData("pdc", monthYearInput?.value || currentMonthYear);
  });
}

/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /*
   * Start with PDC using the current month.
   */
  fetchPdcTdcData("pdc", monthYearInput?.value || currentMonthYear);
});

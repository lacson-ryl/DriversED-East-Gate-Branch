import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";

const state = {
  instructors: [],
  assignments: [],
  courses: [],
  availability: {},
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
};
const $ = (id) => document.getElementById(id);
const today = new Date().toISOString().split("T")[0];

const dateInputs = document.querySelectorAll(".date-input");
console.log('dateInputs', dateInputs);

dateInputs.forEach((input) => {
  input.setAttribute("min", today);
});

function instructorLabel(instructor) {
  return `${instructor.instructor_name} - ${instructor.instructor_type}`;
}
function selectedInstructor() {
  return state.instructors.find(
    (item) => String(item.instructor_id) === $("program-new-instructor").value,
  );
}
function setMessage(message, isError = false) {
  const element = $("program-new-calendar-error");
  element.textContent = message;
  element.classList.toggle("hidden", !isError);
}

function populateInstructorOptions() {
  const selects = [
    $("program-new-instructor"),
    $("program-new-modal-instructor"),
  ];
  selects.forEach((select) => {
    select.innerHTML = `<option value="">Select an instructor</option>`;
    state.instructors.forEach((instructor) => {
      const option = document.createElement("option");
      option.value = instructor.instructor_id;
      option.textContent = instructorLabel(instructor);
      select.appendChild(option);
    });
  });
}

function updateInstructorFields() {
  const instructor = selectedInstructor();
  const transmission = $("program-new-transmission");
  const program = $("program-new-program");
  transmission.innerHTML = "";
  program.innerHTML = "";
  if (!instructor) {
    transmission.innerHTML =
      '<option value="">Select an instructor first</option>';
    program.innerHTML = '<option value="">Select a program</option>';
    renderCalendar();
    return;
  }
  if (String(instructor.isTdcOnsite) === "1")
    transmission.append(new Option("Onsite (AM only)", "Onsite"));
  if (String(instructor.isManual) === "1")
    transmission.append(new Option("Manual", "Manual"));
  if (String(instructor.isAutomatic) === "1")
    transmission.append(new Option("Automatic", "Automatic"));
  const assigned = state.assignments.filter(
    (item) => item.instructor_id == instructor.instructor_id,
  );
  if (!assigned.length)
    program.append(new Option("No Program Assigned", "No Program"));
  assigned.forEach((item) =>
    program.append(
      new Option(`${item.program_id} - ${item.program_name}`, item.program_id),
    ),
  );
  loadAvailability(instructor.instructor_id);
}

async function loadAvailability(instructorId) {
  const calendar = $("program-new-calendar");
  const label = $("program-new-loading-label");
  calendar.className = "program-new-calendar program-new-loading";
  calendar.innerHTML = "";
  label.classList.remove("hidden");
  setMessage("");
  try {
    const response = await fetch(
      `/account/api/instructors/${instructorId}/availability`,
    );
    if (!response.ok)
      throw new Error("Unable to load instructor availability.");
    state.availability = await response.json();
    renderCalendar();
  } catch (error) {
    calendar.className = "program-new-calendar";
    setMessage(error.message, true);
  } finally {
    label.classList.add("hidden");
  }
}

function renderCalendar() {
  const calendar = $("program-new-calendar");
  if (!calendar) return;
  calendar.className = "program-new-calendar";
  calendar.innerHTML = "";
  const instructor = selectedInstructor();
  const monthName = new Date(state.year, state.month).toLocaleString("en-US", {
    month: "long",
  });
  $("program-new-month").textContent = `${monthName} ${state.year}`;
  $("program-new-calendar-subtitle").textContent = instructor
    ? `${instructor.instructor_name} · ${instructor.instructor_type}`
    : "Select an instructor to view their live schedule.";
  const firstDay = new Date(state.year, state.month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  for (let index = 0; index < offset; index += 1)
    calendar.appendChild(document.createElement("div"));
  const days = new Date(state.year, state.month + 1, 0).getDate();
  const currentDay = new Date();
  currentDay.setHours(0, 0, 0, 0);
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(state.year, state.month, day);
    const key = `${state.year}-${String(state.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const slots = state.availability[key];
    const cell = document.createElement("div");
    cell.className = "program-new-day";
    if (date < currentDay) cell.classList.add("is-past");
    if (date.getDay() === 0) cell.classList.add("is-sunday");
    const markers = [];
    if (!date || date < currentDay) {
      /* preserve past-date behavior */
    } else if (slots) {
      const noPdc =
        (slots.am === 0 || slots.am == null) &&
        (slots.pm === 0 || slots.pm == null) &&
        (slots.onsite === 0 || slots.onsite == null);
      if (noPdc) cell.classList.add("is-open");
      if (slots.onsite != null && slots.onsite >= 0) {
        cell.classList.add("is-tdc");
        markers.push(
          `<span class="program-new-marker bg-blue-100 text-blue-700">${slots.onsite}</span>`,
        );
      }
      if (slots.am === 1)
        markers.push(
          '<span class="program-new-marker bg-emerald-100 text-emerald-700">AM</span>',
        );
      if (slots.pm === 1)
        markers.push(
          '<span class="program-new-marker bg-emerald-100 text-emerald-700">PM</span>',
        );
    } else if (date.getDay() !== 0) cell.classList.add("is-open");
    const hasOpenIndicator =
      date >= currentDay &&
      date.getDay() !== 0 &&
      (!slots ||
        ((slots.am === 0 || slots.am == null) &&
          (slots.pm === 0 || slots.pm == null) &&
          (slots.onsite === 0 || slots.onsite == null)));
    cell.innerHTML = `<div class="flex items-center justify-between"><span class="text-sm font-bold text-[#0B2D4A]">${day}</span>${hasOpenIndicator ? '<span class="program-new-open-label text-[10px] text-slate-400">Open</span>' : ""}</div><div class="mt-3 flex flex-wrap gap-1">${markers.join("")}</div>`;
    calendar.appendChild(cell);
  }
}

function renderLogs(data) {
  const target = $("program-new-logs");
  if (!data?.userApplication?.length) {
    target.innerHTML =
      '<p class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No applications found.</p>';
    return;
  }
  target.innerHTML = `<table class="w-full min-w-[760px] text-left text-sm"><thead><tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400"><th class="p-3">ID</th><th class="p-3">Name</th><th class="p-3">Instructor</th><th class="p-3">Start</th><th class="p-3">Slot</th><th class="p-3">Continuation</th><th class="p-3">Slot</th><th class="p-3">Type</th><th class="p-3">Date applied</th></tr></thead><tbody>${data.userApplication.map((row) => `<tr class="border-b border-slate-100 text-slate-600"><td class="p-3 font-semibold">${row.application_id}</td><td class="p-3">${row.creator_name}</td><td class="p-3">${row.instructor_name}</td><td class="p-3">${row.start_date}</td><td class="p-3"><span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">${row.start_date_am_pm}</span></td><td class="p-3">${row.continuation}</td><td class="p-3"><span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">${row.continuation_am_pm}</span></td><td class="p-3">${row.transmission}</td><td class="p-3">${row.created}</td></tr>`).join("")}</tbody></table>`;
}

async function loadLogs() {
  const response = await fetch("/account/api/applications-list");
  if (!response.ok) throw new Error("Unable to load application logs.");
  const data = await response.json();
  state.courses = data.userCourseList || [];
  renderLogs(data);
}

function populateContinuationCourses() {
  const course = $("program-new-course");
  course.innerHTML = "";
  state.courses.forEach((item) =>
    course.append(
      new Option(
        `#${item.course_id} - ${item.program_name} (${item.program_duration - item.total_hours})`,
        item.course_id,
      ),
    ),
  );
}

async function submitApplication(event) {
  event.preventDefault();
  const button = $("program-new-submit");
  showBtnLoading(button);
  const payload = {
    instructor: $("program-new-instructor").value,
    startDate: $("program-new-start").value,
    startDateAMPM: $("program-new-start-slot").value,
    continuation: $("program-new-continuation").value,
    continuationAMPM: $("program-new-continuation-slot").value,
    transmissionType: $("program-new-transmission").value,
    program_id: $("program-new-program").value,
  };
  try {
    const response = await fetch("/account/api/user-application/applyTDC", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    showBtnResult(button, response.ok);
    if (!response.ok) throw new Error(data.error);
    alert(data.message || "Application successfully submitted.");
    await loadLogs();
    await loadAvailability(payload.instructor);
  } catch (error) {
    alert(error.message || "Unable to submit application.");
  }
}

async function submitContinuation(event) {
  event.preventDefault();
  const button = $("program-new-continuation-submit");
  showBtnLoading(button);
  try {
    const response = await fetch(
      "/account/api/user-application/add-continuation",
      { method: "POST", body: new FormData(event.target) },
    );
    const data = await response.json();
    showBtnResult(button, response.ok);
    if (!response.ok) throw new Error(data.error);
    alert(data.message);
    $("program-new-modal").classList.add("hidden");
    await loadLogs();
    await loadAvailability($("program-new-instructor").value);
  } catch (error) {
    alert(error.message || "Unable to add continuation.");
  }
}

function bindModal() {
  const modal = $("program-new-modal");
  $("program-new-continuation-open").addEventListener("click", () => {
    populateContinuationCourses();
    $("program-new-modal").classList.remove("hidden");
    $("program-new-modal").classList.add("flex");
  });
  $("program-new-modal-close").addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
}

function bindSlotButtons() {
  document.querySelectorAll("[data-slot-target]").forEach((group) => {
    const target = $(group.dataset.slotTarget);
    group.querySelectorAll("[data-slot-value]").forEach((button) => {
      button.addEventListener("click", () => {
        target.value = button.dataset.slotValue;
        group.querySelectorAll("[data-slot-value]").forEach((item) => {
          item.classList.toggle("is-selected", item === button);
        });
        target.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  });
}

function focusCalendarOnMobile() {
  if (window.innerWidth >= 768) return;
  const calendar = $("program-new-calendar");
  const section = calendar?.closest("section");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  section.classList.remove("program-new-calendar-pop");
  requestAnimationFrame(() =>
    section.classList.add("program-new-calendar-pop"),
  );
}

async function initialize() {
  document
    .querySelectorAll(".date-input")
    .forEach((input) => (input.min = today));
  const instructorsResponse = await fetch("/account/api/instructors");
  const data = await instructorsResponse.json();
  state.instructors = data.instructors || [];
  state.assignments = data.assignedProgramToInstructor || [];
  populateInstructorOptions();
  $("program-new-instructor").addEventListener("change", () => {
    updateInstructorFields();
    focusCalendarOnMobile();
  });
  $("program-new-application").addEventListener("submit", submitApplication);
  $("program-new-continuation-form").addEventListener(
    "submit",
    submitContinuation,
  );
  $("program-new-prev").addEventListener("click", () => {
    state.month -= 1;
    if (state.month < 0) {
      state.month = 11;
      state.year -= 1;
    }
    renderCalendar();
  });
  $("program-new-next").addEventListener("click", () => {
    state.month += 1;
    if (state.month > 11) {
      state.month = 0;
      state.year += 1;
    }
    renderCalendar();
  });
  bindModal();
  bindSlotButtons();
  renderCalendar();
  await loadLogs();
}

initialize().catch((error) => {
  console.error("Programs page initialization failed:", error);
  const target = $("program-new-calendar-error");
  if (target) {
    target.textContent = error.message || "Unable to load programs.";
    target.classList.remove("hidden");
  }
});

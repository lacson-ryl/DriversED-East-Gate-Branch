import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";

let instructorsInfo = [];
let userCourseList = [];
//form application
async function renderForm() {
  // make the past dates unselectable.
  const dateInputs = document.querySelectorAll(".date-input");
  const today = new Date().toISOString().split("T")[0];

  dateInputs.forEach((input) => {
    input.setAttribute("min", today);
  });

  const instructorSelect = document.getElementById("instructor");
  const transmissionSelect = document.getElementById("transmission");
  const programSelect = document.getElementById("program");
  const applicationForm = document.getElementById("applicationForm");

  // Fetch instructors from the server
  try {
    const response = await fetch("/account/api/instructors");
    const data = await response.json();
    const instructors = data.instructors;
    instructorsInfo = [];
    instructorsInfo = instructors;
    const assignedProgramToInstructor = data.assignedProgramToInstructor;

    instructors.forEach((instructor) => {
      const option = document.createElement("option");
      option.value = instructor.instructor_id;
      option.innerText =
        instructor.instructor_name + " - " + instructor.instructor_type;
      option.setAttribute("data-type", instructor.instructor_type);
      option.setAttribute("data-is-tdc-onsite", instructor.isTdcOnsite);
      option.setAttribute("data-is-manual", instructor.isManual);
      option.setAttribute("data-is-automatic", instructor.isAutomatic);
      instructorSelect.appendChild(option);
    });

    // Function to set transmission type and populate programs based on instructor attributes
    instructorSelect.addEventListener("change", (event) => {
      const selectedOption = event.target.options[event.target.selectedIndex];
      const instructorId = selectedOption.value;
      const isTdcOnsite =
        selectedOption.getAttribute("data-is-tdc-onsite") === "1";
      const isManual = selectedOption.getAttribute("data-is-manual") === "1";
      const isAutomatic =
        selectedOption.getAttribute("data-is-automatic") === "1";

      transmissionSelect.innerHTML = ""; // Clear existing options
      programSelect.innerHTML = ""; // Clear existing program options

      if (isTdcOnsite) {
        const option = document.createElement("option");
        option.value = "Onsite";
        option.text = "Onsite (AM only)";
        transmissionSelect.appendChild(option);
      }
      if (isManual) {
        const option = document.createElement("option");
        option.value = "Manual";
        option.text = "Manual";
        transmissionSelect.appendChild(option);
      }
      if (isAutomatic) {
        const option = document.createElement("option");
        option.value = "Automatic";
        option.text = "Automatic";
        transmissionSelect.appendChild(option);
      }

      // Populate the instructor's assigned programs
      const assignedPrograms = assignedProgramToInstructor.filter(
        (arr) => arr.instructor_id == instructorId
      );

      if (assignedPrograms.length === 0) {
        const programOption = document.createElement("option");
        programOption.value = "No Program";
        programOption.innerText = "No Program Assigned";
        programSelect.appendChild(programOption);
      } else {
        assignedPrograms.forEach((program) => {
          const programOption = document.createElement("option");
          programOption.value = program.program_id;
          programOption.innerText =
            program.program_id + " - " + program.program_name;
          programSelect.appendChild(programOption);
        });
      }
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    alert("Error fetching instructors. Please try again later.");
  }

  const applyButton = document.getElementById("apply-button");
  applicationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const instructor = instructorSelect.value;
    const startDate = document.getElementById("startDate").value;
    const startDateAMPM = document.getElementById("startDateAMPM").value;
    const continuation = document.getElementById("continuation").value;
    const continuationAMPM = document.getElementById("continuationAMPM").value;
    const transmissionType = transmissionSelect.value;
    const program_id = programSelect.value;

    showBtnLoading(applyButton);

    try {
      const response = await fetch("/account/api/user-application/applyTDC", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor,
          startDate,
          startDateAMPM,
          continuation,
          continuationAMPM,
          transmissionType,
          program_id,
        }),
      });

      if (response.ok) {
        applicationForm.reset();
        showBtnResult(applyButton, true);
        alert("Application Successfully Submitted");
        updateCalendar(instructor); // Refresh the calendar to show updated availability
        renderUserApplicationsList();
      } else {
        const data = await response.json();
        showBtnResult(applyButton, false);
        alert(`Error: ${data.error}`);
      }
      setTimeout(() => {
        applyButton.innerText = "Submit";
      }, 3000);
    } catch (error) {
      alert("Sorry! Can’t connect to the server right now.");
      console.error(error); // Log the error to the console for debugging
    }
  });
  renderUserApplicationsList();
}

renderForm();
//form application

// calendar po

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();

function getMonthDays(monthIndex, year) {
  const month = monthNames[monthIndex];
  if (month === "February") {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  } else if (["April", "June", "September", "November"].includes(month)) {
    return 30;
  } else {
    return 31;
  }
}

const calendar = document.getElementById("calendar");
async function updateCalendar(instructorId) {
  const monthLabel = document.getElementById("monthLabel");

  const daysInMonth = getMonthDays(currentMonthIndex, currentYear);
  monthLabel.textContent = `${monthNames[currentMonthIndex]} ${currentYear}`;
  calendar.innerHTML = ""; // Clear previous calendar

  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const adjustedFirstDay = (firstDayOfMonth + 6) % 7;
  for (let i = 0; i < adjustedFirstDay; i++) {
    const emptyDiv = document.createElement("div");
    calendar.appendChild(emptyDiv);
  }

  // Fetch unavailable dates from the backend
  let availability = {};
  if (instructorId) {
    try {
      const response = await fetch(
        `/account/api/instructors/${instructorId}/availability`
      );
      if (response.ok) {
        availability = await response.json();
      }
    } catch (error) {
      console.error("Error fetching availability data:", error);
    }
  } else {
    document.getElementById("announcement").innerText =
      "Please select an instructor to view availability.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight to compare dates correctly

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${(currentMonthIndex + 1)
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const date = new Date(currentYear, currentMonthIndex, day);
    const isSunday = date.getDay() === 0;

    const dayDiv = document.createElement("div");
    dayDiv.classList.add(
      "day",
      "flex",
      "flex-col",
      "items-center",
      "justify-between"
    );

    const dateLabel = document.createElement("span");
    dateLabel.classList.add("text-xs", "font-bold", "mb-2");
    dateLabel.textContent = day;
    dayDiv.appendChild(dateLabel);

    if (date < today) {
      dayDiv.classList.add("bg-red-50"); // Past dates are red
    } else {
      // Check if the date is unavailable
      const slots = availability[dateKey];
      if (isSunday) {
        dayDiv.classList.add("bg-red-100"); // Unavailable dates are red
      } else if (slots) {
        const allUnavailable =
          (slots.am === 0 || slots.am === null) &&
          (slots.pm === 0 || slots.pm === null) &&
          (slots.onsite === 0 || slots.onsite === null);

        if (allUnavailable) {
          dayDiv.classList.add("bg-green-100"); // Mark as available (green)
        } else {
          const circleContainer = document.createElement("div");
          circleContainer.classList.add(
            "flex",
            "justify-center",
            "w-full",
            "space-x-1",
            "mb-2",
            "text-xs",
            "font-light"
          );

          if (slots.onsite >= 0 && slots.onsite != null) {
            const onsiteCircle = document.createElement("div");
            onsiteCircle.classList.add("circle", "onsite-tdc");
            onsiteCircle.textContent = `${slots.onsite}`;
            circleContainer.appendChild(onsiteCircle);
            dayDiv.classList.remove("bg-red-100");
            dayDiv.classList.add("bg-blue-200");
          }
          if (slots.am === 1) {
            const amCircle = document.createElement("div");
            amCircle.classList.add(
              "circle",
              slots.am ? "available-am" : "unavailable"
            );
            amCircle.textContent = "AM";
            circleContainer.appendChild(amCircle);
          }

          if (slots.pm === 1) {
            const pmCircle = document.createElement("div");
            pmCircle.classList.add(
              "circle",
              slots.pm ? "available-pm" : "unavailable"
            );
            pmCircle.textContent = "PM";
            circleContainer.appendChild(pmCircle);
          }
          dayDiv.appendChild(circleContainer);
        }
      } else {
        dayDiv.classList.add("bg-green-100"); // Available dates are green
      }
    }
    calendar.appendChild(dayDiv);
  }
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonthIndex = (currentMonthIndex - 1 + 12) % 12;
  if (currentMonthIndex === 11) currentYear--; // Adjust year if moving to December of the previous year
  updateCalendar(document.getElementById("instructor").value);
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonthIndex = (currentMonthIndex + 1) % 12;
  if (currentMonthIndex === 0) currentYear++; // Adjust year if moving to January of the next year
  updateCalendar(document.getElementById("instructor").value);
});

document.getElementById("instructor").addEventListener("change", (event) => {
  if (event.target.value) {
    updateCalendar(event.target.value);
    if (window.innerWidth < 768) {
      setTimeout(() => {
        calendar.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
        calendar.classList.add("animate-pulse");
        setTimeout(() => calendar.classList.remove("animate-pulse"), 2000);
      }, 500);
    }
  }
});

// Initialize calendar with the current month and no instructor selected
updateCalendar();

// table for user applications
async function renderUserApplicationsList() {
  const tableAnnouncement = document.getElementById("table-announcement");
  const userApplicationTable = document.getElementById(
    "user-applications-table"
  );

  // fetch user applications from the server
  const response = await fetch("/account/api/applications-list");
  if (!response.ok) {
    tableAnnouncement.innerText = "Sorry! cant fetch data right now";
    console.error("Error fetching user applications:", error);
    return;
  }

  const data = await response.json();
  if (data.length === 0) {
    tableAnnouncement.innerText = "No applications found";
    return;
  } else {
    userCourseList = [];
    userCourseList = data.userCourseList;
    const userApplication = data.userApplication;
    tableAnnouncement.innerText = "Application Logs";
    const desktopTable = userApplication
      .map(
        (arr) =>
          `
            <tr class="text-center group hover:outline outline-1 outline-black">
              <td class="border border-gray-300 px-4 py-2 text-xs">
                ${arr.application_id}
              </td>
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
            </tr>
          `
      )
      .join("");

    const mobileTable = userApplication
      .map(
        (arr) => `
    <tr class="border-b">
      <td colspan="9" class="p-3">
        <div class="flex flex-col gap-4 text-sm">
          
          <!-- Application & Creator -->
          <div class="flex justify-between items-center">
            <div>
              <p class="text-gray-500">Application ID</p>
              <p class="font-semibold">${arr.application_id}</p>
            </div>
            <div>
              <p class="text-gray-500">Created by</p>
              <p class="font-medium">${arr.creator_name}</p>
            </div>
          </div>

          <!-- Instructor & Transmission -->
          <div class="flex justify-between items-center">
            <div>
              <p class="text-gray-500">Instructor</p>
              <p>${arr.instructor_name}</p>
            </div>
            <div>
              <p class="text-gray-500">Transmission</p>
              <p>${arr.transmission}</p>
            </div>
          </div>

          <!-- Schedule -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-gray-500">Start Date</p>
              <p>${arr.start_date} ${arr.start_date_am_pm}</p>
            </div>
            <div>
              <p class="text-gray-500">Continuation</p>
              <p>${arr.continuation} ${arr.continuation_am_pm}</p>
            </div>
          </div>

          <!-- Created Timestamp -->
          <div>
            <p class="text-gray-500">Created At</p>
            <p class="text-xs">${arr.created}</p>
          </div>

        </div>
      </td>
    </tr>
  `
      )
      .join("");

    const tableRows = window.innerWidth > 768 ? desktopTable : mobileTable;
    userApplicationTable.innerHTML = `
    <table id="applicants-table" class="w-full border-collapse">
      <thead class="">
        <tr class="text-center hidden md:table-row">
          <th class="w-10 border border-gray-300 px-4 py-2 text-xs">ID</th>
          <th class="border border-gray-300 px-4 py-2">Name</th>
          <th class="border border-gray-300 px-4 py-2">Instructor</th>
          <th class="w-32 border border-gray-300 px-4 py-2">Start</th>
          <th class="w-14 border border-gray-300 px-4 py-2">Slot</th>
          <th class="w-32 border border-gray-300 px-4 py-2">Continuation</th>
          <th class="w-14 border border-gray-300 px-4 py-2">Slot</th>
          <th class="w-24 border border-gray-300 px-4 py-2">Type</th>
          <th class="w-36 border border-gray-300 px-4 py-2">Date Applied</th>
        </tr>
      </thead>
      <tbody class="">
        ${tableRows}
      </tbody>
    `;
  }
  addContinuationDate();
}

async function addContinuationDate() {
  const modal = document.getElementById("formModal");
  const closeBtn = document.querySelector(".close");
  const addContinuationBtn = document.getElementById("add-continuation");
  const addContinuationForm = document.getElementById("add-continuation-form");
  const courseSelect = document.getElementById("course");
  const instructorSelect = document.getElementById("instructor-modal");

  if (!userCourseList) addContinuationBtn.setAttribute("disable");

  instructorsInfo.forEach((instructor) => {
    const option = document.createElement("option");
    option.value = instructor.instructor_id;
    option.innerText =
      instructor.instructor_name + " - " + instructor.instructor_type;
    option.setAttribute("data-type", instructor.instructor_type);
    option.setAttribute("data-is-tdc-onsite", instructor.isTdcOnsite);
    option.setAttribute("data-is-manual", instructor.isManual);
    option.setAttribute("data-is-automatic", instructor.isAutomatic);
    instructorSelect.appendChild(option);
  });

  userCourseList.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.course_id;
    option.innerText = `#${course.course_id} - ${course.program_name} (${
      course.program_duration - course.total_hours
    })`;
    option.setAttribute("data-course-id", course.user_course_id);
    courseSelect.appendChild(option);
  });

  addContinuationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const continuationSubmitBtn = document.getElementById("continuation-btn");
    showBtnLoading(continuationSubmitBtn);

    try {
      const response = await fetch(
        "/account/api/user-application/add-continuation",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        showBtnResult(continuationSubmitBtn, false);
        alert(data.error);
      }

      showBtnResult(continuationSubmitBtn, true);
      alert(data.message);
      addContinuationForm.reset();
      renderForm(); // Refresh the calendar to show updated availability
      renderUserApplicationsList();

      setTimeout(() => {
        modal.style.display = "none";
      }, 3000);
    } catch (error) {
      alert("Sorry! Can’t connect to the server right now.");
      console.error(error); // Log the error to the console for debugging
    }
  });

  // Modal functionality
  addContinuationBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

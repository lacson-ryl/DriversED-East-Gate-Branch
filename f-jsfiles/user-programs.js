//get id from the cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null; // Return null if the cookie is not found
}

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
    const response = await fetch("/api/instructors");
    const data = await response.json();
    const instructors = data.instructors;
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

  applicationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const instructor = instructorSelect.value;
    const startDate = document.getElementById("startDate").value;
    const startDateAMPM = document.getElementById("startDateAMPM").value;
    const continuation = document.getElementById("continuation").value;
    const continuationAMPM = document.getElementById("continuationAMPM").value;
    const transmissionType = transmissionSelect.value;
    const program_id = programSelect.value;

    try {
      const response = await fetch("/api/user-application/applyTDC", {
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
        alert("Application Successfully Submitted");
        updateCalendar(instructor); // Refresh the calendar to show updated availability
        renderUserApplicationsList();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Sorry! Can’t connect to the server right now.");
      console.error(error); // Log the error to the console for debugging
    }
  });
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

async function updateCalendar(instructorId) {
  const monthLabel = document.getElementById("monthLabel");
  const calendar = document.getElementById("calendar");

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
        `/api/instructors/${instructorId}/availability`
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
      console.log("slots", slots);
      if (slots || isSunday) {
        dayDiv.classList.add("bg-red-100"); // Unavailable dates are red

        if (!isSunday && slots) {
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
  updateCalendar(event.target.value);
});

// Initialize calendar with the current month and no instructor selected
updateCalendar();

// table for user applications
async function renderUserApplicationsList() {
  const table = document.getElementById("user-applications-table");
  const tableAnnouncement = document.getElementById("table-announcement");
  const userApplicationTable = document.getElementById(
    "user-applications-table"
  );

  // fetch user applications from the server
  const response = await fetch("/api/applications-list");
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
    tableAnnouncement.innerText = "Application Logs";
    userApplicationTable.innerHTML = `
    <table id="applicants-table" class="w-full border-collapse">
      <thead class="">
        <tr class="text-center">
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
        ${data
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
  }
}

renderUserApplicationsList();

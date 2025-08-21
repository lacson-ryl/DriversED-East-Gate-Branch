//get id from the cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null; // Return null if the cookie is not found
}

let instructorsList;
let assignedProgramToInstructor;
// Fetch instructors from the server
async function fetchInstructors() {
  try {
    const response = await fetch("/api/instructors");
    const data = await response.json();
    const instructors = data.instructors;
    instructorsList = instructors;
    assignedProgramToInstructor = data.assignedProgramToInstructor;
  } catch (error) {
    console.error("Error fetching instructors:", error);
    alert("Error fetching instructors. Please try again later.");
  }
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

  await fetchInstructors();

  instructorsList.forEach((instructor) => {
    const option = document.createElement("option");
    option.value = instructor.instructor_id;
    option.innerText =
      instructor.instructor_name + "-" + instructor.instructor_type;
    option.setAttribute("data-type", instructor.instructor_type);
    option.setAttribute("data-is-tdc-onsite", instructor.isTdcOnsite);
    option.setAttribute("data-is-manual", instructor.isManual);
    option.setAttribute("data-is-automatic", instructor.isAutomatic);
    instructorSelect.appendChild(option);

    // Function to set transmission type based on instructor attributes
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
  });

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
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Sorry! Can’t connect to the server right now.");
      console.error(error); // Log the error to the console for debugging
    }
  });

  const setTdcDateBtn = document.getElementById("setTdcDate");
  const modal = document.getElementById("myModal");
  const closeBtn = document.querySelector(".close");
  const tdcDateForm = document.getElementById("tdcDateForm");
  const tdcInstructorSelect = document.getElementById("tdcInstructor");
  // Modal functionality
  setTdcDateBtn.addEventListener("click", () => {
    const modalForm = `
      <div class="relative justify-self-center bg-white rounded-lg shadow-lg min-w-96 max-w-screen-lg p-6 ">
          <span
              class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer">&times;</span>
          <h2 class="text-xl font-semibold">Set TDC Date</h2>
          <form id="tdcDateForm" class="mt-4">
              <div class="mb-4">
                  <label for="tdcInstructor" class="block text-sm font-medium text-gray-700">Instructor</label>
                  <select id="tdcInstructor" name="tdcInstructor" required>

                  </select>
              </div>
              <div class="mb-4">
                  <label for="tdcDate" class="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" id="tdcDate" name="tdcDate" required
                      class="date-input mt-1 block w-full outline outline-1 outline-gray-500 hover:outline-yellow-500 focus:outline-yellow-500 px-1">
              </div>
              <div class="mb-4">
                  <label for="max-slot" class="block text-sm font-medium text-gray-700">Max Slots</label>
                  <input type="number" id="max-slot" name="max-slot" required
                      class="mt-1 block w-full outline outline-1 outline-gray-500 hover:outline-yellow-500 focus:outline-yellow-500 px-1">
              </div>
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 mt-4">Submit</button>

          </form>
      </div>
    `;
    modal.innerHTML = "";
    modal.innerHTML = modalForm;
    instructorsList.forEach((instructor) => {
      // Also populate the modal's dropdown
      if (instructor.instructor_type === "TDC") {
        const tdcOption = document.createElement("option");
        tdcOption.value = instructor.instructor_id;
        tdcOption.innerText = instructor.instructor_name;
        tdcInstructorSelect.appendChild(tdcOption);
      }
    });
    modal.classList.remove("hidden");

    tdcDateForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const tdcInstructor = tdcInstructorSelect.value;
      const tdcDate = document.getElementById("tdcDate").value;
      const maxSlots = document.getElementById("max-slot").value;

      try {
        const response = await fetch("/api/user-application/setTdcDate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tdcInstructor,
            tdcDate,
            maxSlots,
          }),
        });

        if (response.ok) {
          alert("TDC Date Submitted Successfully");
          modal.classList.add("hidden"); // Close the modal on successful submission
          updateCalendar(tdcInstructor); // Optionally update the calendar or other UI elements
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        alert("Sorry! Can’t connect to the server right now.");
        console.error(error); // Log the error to the console for debugging
      }
    });
  });

  const addContinuationBtn = document.getElementById("add-continuation");

  addContinuationBtn.addEventListener("click", () => {
    const modalForm = `
        <form id="add-continuation-form" class="mt-4">
            <div class="mb-4">
                <label for="instructor" class="block text-base font-medium text-gray-700">Instructor</label>
                <select id="instructor-continuation" name="instructor" required>

                </select>
            </div>
            <div class="mb-4">
                <label for="course" class="block text-base font-medium text-gray-700">Course <span class="text-xs">(remaing
                        hours)</span></label>
                <select id="transmissionType" name="transmissionType" required>
                    
                </select>
            </div>
            <div class="mb-4">
                <label for="continuationDate" class="block text-sm font-medium text-gray-700">Continuation
                    Date</label>
                <input type="date" id="continuationDate" name="continuationDate" required
                    class="date-input mt-1 block w-full outline outline-1 outline-gray-500 hover:outline-yellow-500 focus:outline-yellow-500 px-1">
            </div>
            <div class="flex flex-row gap-4 mb-4">
                <label for="dateAMPM" class="block text-base font-medium text-gray-700">Slot</label>
                <select id="dateAMPM" name="dateAMPM" required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 mt-4">Submit</button>

        </form>
      `;
    modal.innerHTML = "";
    modal.innerHTML = modalForm;
    modal.classList.remove("hidden");

    const continuationInstructorOption = document.getElementById(
      "instructor-continuation"
    );
    const transmissionType = document.getElementById(
      "transmission-type"
    );
    instructorsList.forEach((instructor) => {
      const option = document.createElement("option");
      option.value = instructor.instructor_id;
      option.innerText =
        instructor.instructor_name + "-" + instructor.instructor_type;
      option.setAttribute("data-type", instructor.instructor_type);
      option.setAttribute("data-is-tdc-onsite", instructor.isTdcOnsite);
      option.setAttribute("data-is-manual", instructor.isManual);
      option.setAttribute("data-is-automatic", instructor.isAutomatic);
      continuationInstructorOption.appendChild(option);

      // Function to set transmission type based on instructor attributes
      continuationInstructorOption.addEventListener("change", (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const isTdcOnsite =
          selectedOption.getAttribute("data-is-tdc-onsite") === "1";
        const isManual = selectedOption.getAttribute("data-is-manual") === "1";
        const isAutomatic =
          selectedOption.getAttribute("data-is-automatic") === "1";

        transmissionType.innerHTML = ""; // Clear existing options

        if (isTdcOnsite) {
          const option = document.createElement("option");
          option.value = "Onsite";
          option.text = "Onsite (AM only)";
          transmissionType.appendChild(option);
        }
        if (isManual) {
          const option = document.createElement("option");
          option.value = "Manual";
          option.text = "Manual";
          transmissionType.appendChild(option);
        }
        if (isAutomatic) {
          const option = document.createElement("option");
          option.value = "Automatic";
          option.text = "Automatic";
          transmissionType.appendChild(option);
        }

      });
    });
    // Event listener for the form submission
    document
      .getElementById("add-continuation-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        try {
          const response = await fetch(
            "/api/user-application/admin-add-continuation",
            {
              method: "POST",
              body: formData,
            }
          );
          const data = await response.json();

          if (!response.ok) alert(data.error);

          alert(data.message);
        } catch (error) {
          alert("Sorry! Can’t connect to the server right now.");
          console.error(error); // Log the error to the console for debugging
        }
      });
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

    // Check if the date is in the past
    if (date < today) {
      dayDiv.classList.add("bg-red-50"); // Past dates are red
    } else {
      // Check if the date is unavailable
      const slots = availability[dateKey];
      console.log("slots", slots);
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
            const numberOfSlots = Number(slots.onsite);
            const onsiteCircle = document.createElement("div");
            onsiteCircle.classList.add("circle", "onsite-tdc");
            onsiteCircle.textContent = `${numberOfSlots}`;
            circleContainer.appendChild(onsiteCircle);
            dayDiv.classList.remove("bg-red-100");
            dayDiv.classList.add("bg-blue-200");
          }
          if (slots.am == 1) {
            const amCircle = document.createElement("div");
            amCircle.classList.add(
              "circle",
              slots.am ? "available-am" : "unavailable"
            );
            amCircle.textContent = "AM";
            circleContainer.appendChild(amCircle);
          }

          if (slots.pm == 1) {
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

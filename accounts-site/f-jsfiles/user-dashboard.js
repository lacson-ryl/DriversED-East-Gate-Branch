import { openFileViewer } from "../utils/file-helper.js";

function errorBox(message) {
  return `
  <div
    class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
    ${message}
  </div>`;
}

let courseList, programList;

async function renderUserCourseCards() {
  const clientCourseCard = document.querySelector(".swiper1 .swiper-wrapper");
  const response = await fetch("/account/api/user-dashboard/client-courses");
  if (!response.ok) {
    console.error("Failed to fetch client courses");
    clientCourseCard.innerHTML = `
      <div class="swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          Failed to fetch client courses
        </div>
      </div>
      `;
    return;
  }

  const data = await response.json();
  const traineesCourseList = data.traineesCourseList;
  const traineesCourseSchedule = data.traineesCourseSchedule;

  if (traineesCourseList.length === 0) {
    clientCourseCard.innerHTML = `
      <div class="swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No enrolled courses Found
        </div>
      </div>
      `;
    // Disable Swiper navigation when no courses are found
    document.querySelector(".swiper-button-next").style.display = "none";
    document.querySelector(".swiper-button-prev").style.display = "none";
    return;
  } else {
    function generateCourseCard(course, scheduleList) {
      const progress =
        course.total_hours === 0
          ? 0
          : Math.round((course.total_hours / course.program_duration) * 100);

      const courseId = course.course_id;

      const scheduleHTML = scheduleList
        .filter((s) => s.user_course_id == courseId)
        .map(
          (s) => `<p class="text-sm">${s.date} - ${s.slot} - ${s.status}</p>`
        )
        .join("");

      return `
        <div class="swiper-slide p-2">
          <div class="card flex flex-col scale-75 md:scale-100 max-w-full max-h-screen gap-y-5 items-center">
            <div class="relative min-w-96 w-1/2 min-h-44 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-yellow-400 border-l-yellow-400 rounded-xl p-5 space-y-2 shadow-lg transform transition duration-500 hover:scale-105">
              <div class="absolute top-2 left-2 rounded-full w-6 h-6 text-sm md:w-8 md:h-8 md:text-base bg-yellow-400 text-red-600 flex items-center justify-center font-medium">
                ${courseId}
              </div>

              <h1 class="text-2xl mb-2 font-bold text-gray-800">${
                course.program_name
              }</h1>
              <p class="text-green-700 font-semibold">Enrolled</p>
              <h2 class="text-xl mb-2 font-semibold text-gray-700">${
                course.instructor_name
              }</h2>

              <div class="flex justify-between items-center gap-3">
                <div class="w-2/3">
                  <div class="flex h-5 w-full overflow-hidden rounded-md bg-neutral-50 dark:bg-white outline outline-1 outline-gray-200"
                      role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                    <div class="h-full rounded-md bg-blue-500 p-0.5 text-center text-sm font-semibold leading-none text-black"
                        style="width: ${progress >= 100 ? 100 : progress}%">
                      <span>${progress >= 100 ? 100 : progress}%</span>
                    </div>
                  </div>
                  <p class="text-sm text-black font-semibold">${
                    course.total_hours
                  } / ${course.program_duration} Hours</p>
                </div>
                <div class="w-1/3 text-left">
                  <p class="text-sm">Start: ${course.date_started}</p>
                  <p class="text-sm">End: ${
                    !course.date_completed
                      ? "--/--/----"
                      : course.date_completed
                  }</p>
                </div>
              </div>

              <div class="w-full text-left mt-2">
                <h5 class="text-base font-semibold">Schedule:</h5>
                ${scheduleHTML}

                <div class="flex flex-row items-center justify-around mt-2">
                  <div class="text-base font-semibold">Grade:
                    ${course.grade || ""}
                    ${
                      course.grade == 0
                        ? course.grading_status
                        : `<button class="grading-sheet-view-button bg-yellow-500 text-white px-2 py-2 rounded-md hover:outline outline-1 outline-offset-2 outline-red-500 mt-1" data-id="${courseId}">View</button>`
                    }
                  </div>
                  <div class="text-base font-semibold">Certificate:
                    ${
                      !course.certificate_file
                        ? "Pending"
                        : `<a href="${
                            course.type == "sample"
                              ? course.certificate_file
                              : "#"
                          }" class="certificate-view-button bg-yellow-500 text-white px-2 py-1 rounded-md hover:outline outline-1 outline-offset-2 outline-red-500 mt-1" data-id="${
                            course.course_id
                          }">
                            View
                          </a>`
                    }
                  </div>

                </div>

                <h6 class="text-base font-semibold mt-2">Payment: ${
                  course.isPaid === 0
                    ? `<span class="text-black font-semibold">${course.program_fee} <a href="/user-payments" class="text-blue-500 underline">Click here to Pay</a></span>`
                    : `<span class="text-green-700 font-semibold">Paid ✓</span>`
                }</h6>
              </div>
            </div>
          </div>
        </div>
        `;
    }
    const sampleCourseData = {
      course_id: 0,
      program_name: "Sample Driving Course",
      instructor_name: "Juan Dela Cruz",
      total_hours: 12,
      program_duration: 20,
      date_started: "2025-10-01",
      date_completed: null,
      grade: 85,
      grading_status: "Completed",
      type: "sample",
      certificate_file: "/account/f-assets/sample-certificate.pdf",
      isPaid: 1,
      program_fee: "2,500",
    };
    const sampleScheduleList = [
      {
        user_course_id: 0,
        date: "2025-10-02",
        slot: "AM/PM",
        status: "Completed",
      },
      {
        user_course_id: 0,
        date: "2025-10-04",
        slot: "AM/PM",
        status: "Completed",
      },
      {
        user_course_id: 0,
        date: "2025-10-06",
        slot: "AM/PM",
        status: "Scheduled",
      },
    ];
    clientCourseCard.innerHTML = generateCourseCard(
      sampleCourseData,
      sampleScheduleList
    );
    courseList = traineesCourseList;

    clientCourseCard.innerHTML += traineesCourseList
      .map((course) => generateCourseCard(course, traineesCourseSchedule))
      .join("");
  }

  // Initialize Swiper only if there are courses
  const userCourseSwiper = new Swiper(".swiper1", {
    direction: "horizontal",
    pagination: {
      el: ".swiper-pagination1",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next1",
      prevEl: ".swiper-button-prev1",
    },
    grabbingCursor: true,
    breakpoints: {
      // When window width is >= 0px (mobile)
      0: {
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 30,
      },
      // When window width is >= 768px (desktop)
      768: {
        slidesPerView: 3,
        centeredSlides: true,
      },
    },
  });

  allButtons();
}

// Call the function to render course cards
renderUserCourseCards();

function filterData(data, filter, id) {
  return data.filter((arr) => arr[filter] == id);
}

function allButtons() {
  // Add event listeners for "View Grading Sheet" buttons
  document.querySelectorAll(".grading-sheet-view-button").forEach((button) => {
    button.addEventListener("click", function () {
      const courseId = this.getAttribute("data-id");
      const filtered = filterData(courseList, "course_id", courseId);
      openFileViewer({
        fileData: filtered[0].grade_sheet,
        fileType: filtered[0].grade_sheet_type.mime,
        title: `User course #${courseId} grading sheet`,
      });
    });
  });

  document.querySelectorAll(".certificate-view-button").forEach((button) => {
    button.addEventListener("click", function () {
      const courseId = this.getAttribute("data-id");
      const filtered = filterData(courseList, "course_id", courseId);
      console.log("filtered", filtered);

      openFileViewer({
        fileData: filtered[0].certificate_file,
        fileType: filtered[0].certificate_file_type,
        title: `User course #${courseId} certificate`,
      });
    });
  });
}

async function renderCourseCards() {
  const programCourseCard = document.querySelector(".swiper2 .swiper-wrapper");
  const response = await fetch("/account/api/user-dashboard/program-list");
  if (!response.ok) {
    console.error("Failed to fetch client courses");
    programCourseCard.innerHTML = `
      <div class="program-swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          Failed to fetch driving courses because of server error.
        </div>
      </div>
      `;
    return;
  }

  const data = await response.json();
  const programList = data.programList;

  if (programList.length === 0) {
    programCourseCard.innerHTML = `
     <div class="swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No Programs Found
        </div>
      </div>
      `;
    document.querySelector(".swiper-button-next2").style.display = "none";
    document.querySelector(".swiper-button-prev2").style.display = "none";
    return;
  } else {
    programCourseCard.innerHTML = programList
      .map((program) => {
        const instructors = program.instructors
          .map(
            (instructor) =>
              `<p class="text-sm">${instructor.instructor_name}</p>`
          )
          .join("");

        const programCover = program.program_cover
          ? program.program_cover
          : "/account/f-assets/solid/user-bg.jpg";

        return `
          <div class="swiper-slide p-2 mb-5">
            <div class="card flex flex-col scale-75 md:scale-100 max-w-full max-h-screen gap-y-5 items-center">
              <div class="rounded-md overflow-hidden relative h-96 w-96 group [perspective:1000px]">
                <div
                  class="card-inner relative h-full w-full rounded-md transition-all duration-500 [transform-style:preserve-3d]  md:group-hover:[transform:rotateY(180deg)]">
                  
                  <!-- Front Side -->
                  <div class="absolute inset-0 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-yellow-400 border-l-yellow-400 rounded-xl p-5 space-y-2 shadow-lg [backface-visibility:visible]">
                    <img src="${programCover}" alt="Program Cover" class="w-full h-32 object-cover rounded-md">
                    <h1 class="text-2xl mb-2 font-bold text-gray-800">${
                      program.program_name
                    }</h1>
                    ${
                      program.availability == "Available"
                        ? '<div class="text-green-700 hover:font-semibold rounded-md">Available</div>'
                        : '<div class="text-red-700 hover:font-semibold rounded-md">Unavailable</div>'
                    }</p>
                    <p class="mt-2">${program.program_duration} Hours | 
                    ${program.program_fee} pesos</p>
                    <div class="w-full text-left text-lg mt-2">
                      <div>
                        <h5 class="font-semibold">Instructor(s):</h5>
                        <p>${instructors || "No instructors assigned</p>"}
                      </div>
                      <div class='relative w-full md:hidden'>
                        <div class="absolute bottom-2 right-2 rounded-full text-xs md:text-base text-gray-400 flex items-center justify-center font-medium">
                          view details
                        </div>
                      </div>
                    </div>
                  </div>
        
                  <!-- Back Side -->
                  <div
                    class="absolute inset-0 h-full w-full rounded-md bg-black/80 backdrop-blur-sm p-5 text-center text-blue-100 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div class="flex h-full flex-col items-center justify-center gap-5">
                        <div class="undo-rotate absolute top-4 left-4 rounded-full text-xs md:text-base text-gray-400 flex items-center justify-center font-medium">
                          <img src="/account/f-assets/solid/icons_for_buttons/minus-circle.svg" class="opacity-70 scale-150 hover:opacity-100 md:hidden" />
                        </div>
                      <h2 class="text-xl font-bold">${program.program_name}</h2>
                      <p class="font-Montserrat max-w-full text-clip leading-relaxed text-left overflow-y-auto custom-scrollbar whitespace-pre-line">${
                        program.program_description
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".card-inner").forEach((cardInner) => {
      const viewDetails = cardInner.querySelector(".text-gray-400.text-xs"); // your "view details" button
      const undoRotate = cardInner.querySelector(".undo-rotate");

      if (viewDetails) {
        viewDetails.addEventListener("click", () => {
          cardInner.classList.add("rotated");
        });
      }

      if (undoRotate) {
        undoRotate.addEventListener("click", () => {
          cardInner.classList.remove("rotated");
        });
      }
    });
  }
  // Initialize Swiper
  const programSwiper = new Swiper(".swiper2", {
    direction: "horizontal",
    pagination: {
      el: ".swiper-pagination2",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next2",
      prevEl: ".swiper-button-prev2",
    },
    grabcursor: true,
    breakpoints: {
      // When window width is >= 0px (mobile)
      0: {
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 30,
      },
      // When window width is >= 768px (desktop)
      768: {
        slidesPerView: 3,
        centeredSlides: true,
      },
    },
  });
}
// Call the function to render course cards
renderCourseCards();

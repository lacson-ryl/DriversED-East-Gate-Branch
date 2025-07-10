function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null; // Return null if the cookie is not found
}

function errorBox(message) {
  return `
  <div
    class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
    ${message}
  </div>`;
}

async function renderUserCourseCards() {
  const clientCourseCard = document.querySelector(".swiper1 .swiper-wrapper");
  const response = await fetch("/api/user-dashboard/client-courses");
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
          No courses Found
        </div>
      </div>
      `;
    // Disable Swiper navigation when no courses are found
    document.querySelector(".swiper-button-next").style.display = "none";
    document.querySelector(".swiper-button-prev").style.display = "none";
    return;
  } else {
    clientCourseCard.innerHTML = traineesCourseList
      .map((arr) => {
        const progress =
          arr.total_hours === 0
            ? 0
            : Math.round((arr.total_hours / arr.program_duration) * 100);

        const courseId = arr.course_id;
        return `
          <div class="swiper-slide p-2">
            <div class="card flex flex-col max-w-full max-h-screen gap-y-5 items-center">
              <div class="min-w-96 w-1/2 min-h-44 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-yellow-400 border-l-yellow-400 rounded-xl p-5 space-y-2 shadow-lg transform transition duration-500 hover:scale-105">
                <h1 class="text-2xl mb-2 font-bold text-gray-800">${
                  arr.program_name
                }</h1>
                <p class="text-green-700 font-semibold">Enrolled</p>
                <h2 class="text-xl mb-2 font-semibold text-gray-700">${
                  arr.instructor_name
                }</h2>
                <div class="flex justify-between items-center gap-3">
                  <div class="w-2/3 ">
                    <div class="flex h-5 w-full overflow-hidden rounded-md bg-neutral-50 dark:bg-white outline outline-1 outline-gray-200"
                        role="progressbar" aria-label="default progress bar" aria-valuenow="${progress}" aria-valuemin="0"
                        aria-valuemax="100">
                      <div class="h-full rounded-md bg-blue-500 p-0.5 text-center  text-sm font-semibold leading-none text-black"
                          style="width: ${progress}%">
                        <span>${progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm text-black font-semibold">${
                        arr.total_hours
                      } / ${arr.program_duration} Hours</p>
                    </div>
                  </div>
                  <div class="w-1/3 text-left">
                    <p class="text-sm">Start: ${arr.date_started}</p>
                    <p class="text-sm">End: ${
                      !arr.date_ended ? "--/--/----" : arr.date_ended
                    }</p>
                  </div>
                </div>
                <div class="w-full text-left mt-2">
                  <h5 class="text-base font-semibold">Schedule:</h5>
                  ${traineesCourseSchedule
                    .filter((schedule) => schedule.user_course_id == courseId)
                    .map(
                      (schedule) => `
                      <p class="text-sm">${schedule.date} - ${schedule.slot} - ${schedule.status}</p>`
                    )
                    .join("")}
                  <h5 class="text-base font-semibold">Grade: ${
                    arr.grade == null ? 0 : arr.grade
                  } <span>Status: ${arr.grading_status}</span></h5>
                  <button class="grading-sheet-view-button bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700 mt-1" data-file='${JSON.stringify(
                    !arr.grading_sheet ? null : arr.grading_sheet.data
                  )}' data-file-type="image/jpeg">View Grading Sheet</button>
                  <h6 class="text-base font-semibold mt-2">Payment: ${
                    arr.isPaid === 0
                      ? `<span class="text-black font-semibold">${arr.program_fee} <a href="/user-payments" class="text-blue-500 underline">Click here to Pay</a></span>`
                      : `<span class="text-green-700 font-semibold">Paid ✓</span>`
                  }</h6>
                </div>
              </div>
            </div>
          </div>
        `;
      })
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

function allButtons() {
  // Add event listeners for "View Grading Sheet" buttons
  document.querySelectorAll(".grading-sheet-view-button").forEach((button) => {
    button.addEventListener("click", function () {
      const fileData = JSON.parse(this.getAttribute("data-file"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(fileData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank", "width=800,height=600");
      newWindow.document.write(`
      <html>
        <head>
          <title>Grading Sheet</title>
          <style>
            body {
              background-color: black;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            img {
              max-width: 100%;
              max-height: 100%;
            }
          </style>
        </head>
        <body>
          <img src="${url}" alt="grading-sheet" />
        </body>
      </html>
    `);
      newWindow.document.close();

      // Revoke the object URL after the new window has loaded the content
      newWindow.onload = function () {
        URL.revokeObjectURL(url);
      };
    });
  });
}

async function renderCourseCards() {
  const programCourseCard = document.querySelector(".swiper2 .swiper-wrapper");
  const response = await fetch("/api/user-dashboard/program-list");
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
      <div class="program-swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No courses Found
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
          ? URL.createObjectURL(
              new Blob([new Uint8Array(program.program_cover.data)], {
                type: program.program_cover_file_type,
              })
            )
          : "/f-css/solid/user-bg.jpg";

        return `
          <div class="swiper-slide p-2 mb-5">
            <div class="card flex flex-col max-w-full max-h-screen gap-y-5 items-center">
              <div class="rounded-md overflow-hidden relative h-96 w-96 group [perspective:1000px]">
                <div
                  class="relative h-full w-full rounded-md transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  
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
                      <h5 class="font-semibold">Instructor(s):</h5>
                      <p>${instructors || "No instructors assigned</p>"}
                    </div>
                  </div>
        
                  <!-- Back Side -->
                  <div
                    class="absolute inset-0 h-full w-full rounded-md bg-black/80 backdrop-blur-sm p-5 text-center text-blue-100 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div class="flex h-full flex-col items-center justify-center gap-5">
                      <h2 class="text-xl font-bold">${program.program_name}</h2>
                      <p class="font-Montserrat max-w-full text-clip overflow-y-auto custom-scrollbar">${
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

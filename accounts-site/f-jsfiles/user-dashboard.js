import { openFileViewer } from "../utils/file-helper.js";

function errorBox(message) {
  return `
  <div
    class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
    ${message}
  </div>`;
}

let courseList, programList;

function generateCourseCard(course, scheduleList) {
  const progress =
    course.total_hours === 0
      ? 0
      : Math.round((course.total_hours / course.program_duration) * 100);
  const safeProgress = Math.min(100, Math.max(0, progress));
  const courseId = course.course_id;
  const courseSchedules = scheduleList.filter((s) => s.user_course_id == courseId);

  const scheduleHTML = courseSchedules.length
    ? courseSchedules
        .map(
          (schedule) => `
            <div class="flex items-center justify-between gap-3 border-b border-slate-100 py-1 last:border-0">
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-700">${schedule.date}</p>
                <p class="text-[10px] text-slate-400">${schedule.slot}</p>
              </div>
              <span class="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">${schedule.status}</span>
            </div>`
        )
        .join("")
    : `<p class="py-2 text-sm text-slate-400">No schedule available</p>`;

  return `
    <div class="course-slider__slide">
      <article class="card dashboard-course-card max-w-2xl overflow-hidden rounded-2xl bg-white text-left shadow-[0_12px_35px_rgba(11,45,74,0.10)] ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,45,74,0.16)]">
        <div class="flex items-start justify-between gap-3 border-b border-slate-100 p-4 md:p-5">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1976D2]">
              <img src="/account/f-assets/solid/white/view-grid.svg" class="h-5 w-5" alt="" />
            </div>
            <div class="min-w-0">
              <h3 class="truncate text-base font-bold text-[#0B2D4A] md:text-lg">${course.program_name}</h3>
              <p class="mt-0.5 text-xs font-medium text-emerald-600">Enrolled</p>
              <p class="mt-1 truncate text-xs text-slate-500">${course.instructor_name}</p>
            </div>
          </div>
          <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">#${courseId}</span>
        </div>

        <div class="space-y-2 p-3 md:p-4">
          <section aria-label="Course progress">
            <div class="mb-1 flex items-center justify-between gap-3">
              <p class="text-xs font-semibold text-slate-600">Progress</p>
              <p class="text-base font-bold text-[#1976D2]">${safeProgress}%</p>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow="${safeProgress}" aria-valuemin="0" aria-valuemax="100" aria-label="Course progress">
              <div class="h-full rounded-full bg-[#2585F5] transition-all duration-500" style="width: ${safeProgress}%"></div>
            </div>
            <p class="mt-0.5 text-[10px] font-semibold text-slate-500">${course.total_hours} / ${course.program_duration} Hours</p>
          </section>

          <div class="grid grid-cols-2 gap-3 border-y border-slate-100 py-2">
            <div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Start date</p><p class="mt-0.5 text-xs font-semibold text-slate-700">${course.date_started}</p></div>
            <div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">End date</p><p class="mt-0.5 text-xs font-semibold text-slate-700">${!course.date_completed ? "--/--/----" : course.date_completed}</p></div>
          </div>

          <section>
            <div class="mb-0.5 flex items-center max-h-24 justify-between"><h4 class="text-[11px] font-bold text-[#0B2D4A]">Schedule</h4><span class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1976D2]">${courseSchedules.length}</span></div>
            <div class="rounded-lg bg-slate-50 px-3">${scheduleHTML}</div>
          </section>

          <div class="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2">
            <div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Grade</p><div class="flex items-center gap-2"><p class="truncate text-base font-bold text-[#0B2D4A]">${course.grade || "0"}</p>${course.grade == 0 ? `<span class="text-[10px] font-semibold text-amber-600">${course.grading_status}</span>` : `<button class="grading-sheet-view-button rounded-md bg-[#FFC400] px-2 py-1 text-[10px] font-bold text-[#0B2D4A] transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500" data-id="${courseId}">View</button>`}</div></div>
            <div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Certificate</p>${!course.certificate_file ? `<p class="mt-0.5 text-xs font-semibold text-amber-600">Pending</p>` : `<a href="${course.type == "sample" ? course.certificate_file : "#"}" class="certificate-view-button mt-1 inline-block rounded-md bg-[#FFC400] px-2 py-1 text-[10px] font-bold text-[#0B2D4A] transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500" data-id="${course.course_id}">View</a>`}</div>
          </div>

          <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2.5 py-1.5">
            <div class="flex flex-row items-center gap-3"><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Payment</p>${course.isPaid === 0 ? `<p class="font-bold text-xs text-slate-700">${course.program_fee}</p>` : `<p class="font-bold text-xs text-emerald-600">Paid ✓</p>`}</div>
            ${course.isPaid === 0 ? `<a href="/account/user-payments" class="shrink-0 rounded-md bg-[#FFC400] px-2 py-1 text-[10px] font-bold text-[#0B2D4A] transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500">Click here to Pay</a>` : ""}
          </div>
        </div>
      </article>
    </div>`;
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

async function renderUserCourseCards() {
  const clientCourseCard = document.getElementById("course-slider-track");
  const response = await fetch("/account/api/user-dashboard/client-courses");
  if (!response.ok) {
    console.error("Failed to fetch client courses");

    clientCourseCard.innerHTML = `
      <div class="course-slider__slide">
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
    clientCourseCard.innerHTML = generateCourseCard(
      sampleCourseData,
      sampleScheduleList
    );

    clientCourseCard.innerHTML += `
      <div class="course-slider__slide">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No enrolled courses Found
        </div>
      </div>
      `;

  } else {
    clientCourseCard.innerHTML = generateCourseCard(
      sampleCourseData,
      sampleScheduleList
    );
    courseList = traineesCourseList;

    clientCourseCard.innerHTML += traineesCourseList
      .map((course) => generateCourseCard(course, traineesCourseSchedule))
      .join("");
  }

  setupCourseSlider();
  allButtons();
}

let courseSliderState = { currentPage: 0, pageCount: 1 };

function setupCourseSlider() {
  const slider = document.getElementById("course-slider");
  const track = document.getElementById("course-slider-track");
  const previous = document.getElementById("course-slider-prev");
  const next = document.getElementById("course-slider-next");
  const dots = document.getElementById("course-slider-dots");
  if (!slider || !track || !previous || !next || !dots) return;

  const slides = [...track.children];
  const visibleCount = window.innerWidth < 768 ? 1 : 2;
  const pageCount = Math.max(1, Math.ceil(slides.length / visibleCount));
  courseSliderState.pageCount = pageCount;
  courseSliderState.currentPage = Math.min(
    courseSliderState.currentPage,
    pageCount - 1,
  );

  dots.innerHTML = Array.from({ length: pageCount }, (_, index) =>
    `<button class="course-slider__dot${
      index === courseSliderState.currentPage ? " is-active" : ""
    }" type="button" aria-label="Go to course page ${index + 1}" data-page="${index}"></button>`,
  ).join("");

  const updateSlider = (page) => {
    courseSliderState.currentPage = Math.max(0, Math.min(page, pageCount - 1));
    const viewportWidth = slider.querySelector(".course-slider__viewport").clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = visibleCount === 1 ? viewportWidth : (viewportWidth - gap) / 2;
    track.style.transform = `translateX(-${courseSliderState.currentPage * (cardWidth + gap) * visibleCount}px)`;
    previous.disabled = courseSliderState.currentPage === 0;
    next.disabled = courseSliderState.currentPage === pageCount - 1;
    dots.querySelectorAll(".course-slider__dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === courseSliderState.currentPage);
      dot.setAttribute("aria-current", index === courseSliderState.currentPage ? "true" : "false");
    });
  };

  previous.onclick = () => updateSlider(courseSliderState.currentPage - 1);
  next.onclick = () => updateSlider(courseSliderState.currentPage + 1);
  dots.querySelectorAll(".course-slider__dot").forEach((dot) => {
    dot.onclick = () => updateSlider(Number(dot.dataset.page));
  });
  updateSlider(courseSliderState.currentPage);
}

function setupProgramSlider() {
  const slider = document.getElementById("program-slider");
  const track = document.getElementById("program-slider-track");
  const previous = document.getElementById("program-slider-prev");
  const next = document.getElementById("program-slider-next");
  const dots = document.getElementById("program-slider-dots");
  if (!slider || !track || !previous || !next || !dots) return;

  const slides = [...track.children];
  const visibleCount = window.innerWidth < 768 ? 1 : 3;
  const pageCount = Math.max(1, Math.ceil(slides.length / visibleCount));
  let currentPage = Math.min(
    Number(slider.dataset.page || 0),
    pageCount - 1,
  );
  slider.dataset.page = currentPage;

  dots.innerHTML = Array.from({ length: pageCount }, (_, index) =>
    `<button class="course-slider__dot${index === currentPage ? " is-active" : ""}" type="button" aria-label="Go to program page ${index + 1}" data-page="${index}"></button>`,
  ).join("");

  const updateSlider = (page) => {
    currentPage = Math.max(0, Math.min(page, pageCount - 1));
    slider.dataset.page = currentPage;
    const viewportWidth = slider.querySelector(".program-slider__viewport").clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = visibleCount === 1 ? viewportWidth : (viewportWidth - gap * (visibleCount - 1)) / visibleCount;
    track.style.transform = `translateX(-${currentPage * (cardWidth + gap) * visibleCount}px)`;
    previous.disabled = currentPage === 0;
    next.disabled = currentPage === pageCount - 1;
    dots.querySelectorAll(".course-slider__dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentPage);
      dot.setAttribute("aria-current", index === currentPage ? "true" : "false");
    });
  };

  previous.onclick = () => updateSlider(currentPage - 1);
  next.onclick = () => updateSlider(currentPage + 1);
  dots.querySelectorAll(".course-slider__dot").forEach((dot) => {
    dot.onclick = () => updateSlider(Number(dot.dataset.page));
  });
  updateSlider(currentPage);
}

window.addEventListener("resize", setupCourseSlider);
window.addEventListener("resize", setupProgramSlider);

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
  const programCourseCard = document.getElementById("program-slider-track");
  const response = await fetch("/account/api/user-dashboard/program-list");
  if (!response.ok) {
    console.error("Failed to fetch client courses");
    programCourseCard.innerHTML = `
      <div class="program-slider__slide">
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
    <div class="program-slider__slide">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No Programs Found
        </div>
      </div>
      `;
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
          <div class="program-slider__slide">
            <div class="card flex max-w-full items-center justify-center">
              <div class="relative h-[360px] w-full max-w-[380px] overflow-hidden rounded-2xl group [perspective:1000px]">
                <div
                  class="card-inner relative h-full w-full rounded-2xl transition-all duration-500 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)]">
                  
                  <!-- Front Side -->
                  <div class="absolute inset-0 bg-white p-5 text-center text-black shadow-[0_12px_35px_rgba(11,45,74,0.10)] [backface-visibility:visible]">
                    <img src="${programCover}" alt="Program Cover" class="h-32 w-full rounded-xl object-cover">
                    <h1 class="mb-2 mt-4 truncate text-xl font-bold text-[#0B2D4A]">${
                      program.program_name
                    }</h1>
                    ${
                      program.availability == "Available"
                        ? '<div class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Available</div>'
                        : '<div class="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Unavailable</div>'
                    }
                    <p class="mt-3 text-sm font-semibold text-slate-600">${program.program_duration} Hours |
                    ${program.program_fee} pesos</p>
                    <div class="mt-4 w-full text-left text-sm">
                      <div>
                        <h5 class="font-semibold text-[#0B2D4A]">Instructor(s)</h5>
                        <div class="mt-1 text-slate-500">${instructors || "<p>No instructors assigned</p>"}</div>
                      </div>
                      <div class='relative w-full md:hidden'>
                        <div class="view-details absolute bottom-2 right-2 rounded-full text-xs md:text-base text-[#1976D2] flex items-center justify-center font-semibold">
                          view details
                        </div>
                      </div>
                    </div>
                  </div>
        
                  <!-- Back Side -->
                  <div
                    class="absolute inset-0 h-full w-full rounded-2xl bg-[#0B2D4A] p-5 text-center text-blue-100 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div class="flex h-full flex-col items-center justify-center gap-5">
                        <div class="undo-rotate absolute left-4 top-4 rounded-full text-xs md:text-base text-slate-300 flex items-center justify-center font-medium">
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
      const viewDetails = cardInner.querySelector(".view-details");
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
  setupProgramSlider();
}
// Call the function to render course cards
renderCourseCards();

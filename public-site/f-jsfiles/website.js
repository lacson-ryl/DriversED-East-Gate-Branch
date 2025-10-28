const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");
let isMenuOpen = false;

// Initial state
if (window.innerWidth < 768) {
  navMenu.style.display = "none";
}

navToggle.addEventListener("click", (e) => {
  e.stopPropagation(); // ✅ Prevent bubbling to window
  isMenuOpen = !isMenuOpen;
  navMenu.style.display = isMenuOpen ? "flex" : "none";
});

// ✅ Persistent outside click listener
window.addEventListener("click", (event) => {
  if (
    isMenuOpen &&
    navMenu &&
    !navMenu.contains(event.target) &&
    !navToggle.contains(event.target)
  ) {
    navMenu.style.display = "none";
    isMenuOpen = false;
  }
});

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.remove("h-32", "bg-opacity-0");
    navbar.classList.add("h-20");
  } else {
    navbar.classList.remove("h-20");
    navbar.classList.add("h-32", "bg-opacity-0");
  }
});

const data = [
  {
    imageBackground: "/public/f-assets/public/learn-drive.jpg",
    tagLine: "Learn to Drive with Calm Confidence",
    tagParagraph:
      "We turn nervous starts into confident journeys with patient guidance and real-world practice.",
  },
  {
    imageBackground: "/public/f-assets/solid/user-bg.jpg",
    tagLine: "Drive Smart. Drive Safe.",
    tagParagraph:
      "  Our expert instructors and modern vehicles make learning to drive a smooth, stress-free experience.",
  },
  {
    imageBackground: "/public/f-assets/public/your-license.jpg",
    tagLine: "  Your License, Your Freedom",
    tagParagraph:
      "  Unlock independence with lessons tailored to your pace, schedule, and comfort level.",
  },
  {
    imageBackground: "/public/f-assets/public/confidence.jpg",
    tagLine: "Confidence Behind the Wheel Starts Here",
    tagParagraph:
      "  From first-time drivers to road-ready pros, we guide every step with patience, clarity, and care.",
  },
  {
    imageBackground: "/public/f-assets/public/stay-strong.jpg",
    tagLine: "  Start Strong. Stay Safe.",
    tagParagraph:
      "  Our driving school blends safety, skill, and support to prepare you for every road ahead.",
  },
];

const imgBg = document.getElementById("image-background");
const promoteContainer = document.getElementById("promote-container");
const promoteOutput = document.getElementById("promotional-output");
const tagLine = document.getElementById("tag-line");
const tagPrgph = document.getElementById("tag-paragraph");
const promoteCircles = document.getElementById("circles-indicators");
const nxtPromote = document.getElementById("next-promote");
const prvPromote = document.getElementById("previous-promote");

let currentIndex = 0;
let sliderStarted = false;
let countdownTimer = null;

function updatePromo(index) {
  // Reset animation state
  promoteOutput.classList.remove("animate-fadeIn-public");
  promoteOutput.classList.add("animate-fadeOut-public");

  void promoteOutput.offsetWidth;

  // Preload image
  const tempImg = new Image();
  tempImg.src = data[index].imageBackground;

  tempImg.onload = () => {
    imgBg.src = tempImg.src;
    promoteOutput.classList.remove("animate-fadeOut-public");
    promoteOutput.classList.add("animate-fadeIn-public");

    // Update content
    tagLine.textContent = data[index].tagLine.trim();
    tagPrgph.textContent = data[index].tagParagraph.trim();
    updateIndicators(index);

    // Start countdown only after image is ready
    if (sliderStarted) {
      clearInterval(countdownTimer);
    }
    sliderStarted = true;
    startCountdown();
  };
  let nextIndex = (index + 1) % data.length;
  const preloadImg = new Image();
  preloadImg.src = data[nextIndex].imageBackground;
}

function startCountdown() {
  let countDown = 7;

  countdownTimer = setInterval(() => {
    countDown--;

    if (countDown <= 0) {
      clearInterval(countdownTimer);
      currentIndex = (currentIndex + 1) % data.length;
      updatePromo(currentIndex);
    }
  }, 1000);
}

function updateIndicators(activeIndex) {
  promoteCircles.innerHTML = "";

  data.forEach((_, i) => {
    const circle = document.createElement("div");
    circle.className =
      "w-2 h-2 rounded-full transition-all duration-300" +
      (i === activeIndex
        ? " bg-yellow-400 opacity-100"
        : " bg-black opacity-75");
    promoteCircles.appendChild(circle);
  });
}

// Initial render
updatePromo(currentIndex);

// Optional manual controls
if (nxtPromote) {
  nxtPromote.addEventListener("click", () => {
    clearInterval(countdownTimer);
    currentIndex = (currentIndex + 1) % data.length;
    updatePromo(currentIndex);
  });
}

if (prvPromote) {
  prvPromote.addEventListener("click", () => {
    clearInterval(countdownTimer);
    currentIndex = (currentIndex - 1 + data.length) % data.length;
    updatePromo(currentIndex);
  });
}

document.getElementById("year").textContent = new Date().getFullYear();

//let progList = {};
//let instructorList = {};
const servicesSection = document.getElementById("services-section");
const instructorSection = document.getElementById("instructor-section");

let progList = null;
let instructorList = null;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;

        if (id === "services-section" && !progList) {
          fetchAndRender("services");
        }

        if (id === "instructor-section" && !instructorList) {
          fetchAndRender("instructors");
        }

        observer.unobserve(entry.target); // ✅ Only load once
      }
    });
  },
  {
    rootMargin: "0px 0px -100px 0px", // Trigger slightly before full visibility
    threshold: 0.1,
  }
);

observer.observe(servicesSection);
observer.observe(instructorSection);

async function fetchAndRender(type) {
  try {
    const response = await fetch("/public/request/web-infos");
    const data = await response.json();

    if (!response.ok) throw new Error("Fetch failed");

    if (type === "services") {
      progList = data.programList;
      console.log("fetch prog list");
      renderCourseCards(progList);
    }

    if (type === "instructors") {
      instructorList = data.instructorList;
      console.log("fetch instructor list");
      renderInstructorCards(instructorList);
    }
  } catch (err) {
    console.error("Error loading section:", type, err);
  }
}

async function renderCourseCards(programList) {
  const programCourseCard = document.querySelector(".swiper1 .swiper-wrapper");

  if (programList.error) {
    programCourseCard.innerHTML = `
     <div class="swiper-slide p-2">
        <div
          class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          No Programs Found
        </div>
      </div>
      `;
    document.querySelector(".swiper-button-next1").style.display = "none";
    document.querySelector(".swiper-button-prev1").style.display = "none";
    return;
  } else {
    const programs = programList.data;
    programCourseCard.innerHTML = programs
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
  const programSwiper = new Swiper(".swiper1", {
    direction: "horizontal",
    slidesPerView: 1,
    centeredSlides: true,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination1",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next1",
      prevEl: ".swiper-button-prev1",
    },
    grabcursor: true,
  });
}

async function renderInstructorCards(instructorList) {
  console.log("instructorList", instructorList);
  const instructorCardWrapper = document.querySelector(
    ".swiper2 .swiper-wrapper"
  );

  if (instructorList.error) {
    instructorCardWrapper.innerHTML = `
      <div class="swiper-slide p-2">
        <div class="min-w-40 min-h-20 bg-white text-center text-black border-2 border-l-4 border-b-4 border-b-red-400 border-l-red-400 rounded-xl p-5 space-y-5">
          ${instructorList.error}
        </div>
      </div>
    `;
    document.querySelector(".swiper-button-next2").style.display = "none";
    document.querySelector(".swiper-button-prev2").style.display = "none";
    return;
  }

  instructorCardWrapper.innerHTML = instructorList.data
    .map((instructor) => {
      const profilePic =
        instructor.instructor_profile_picture ||
        "/public/f-assets/solid/black/user.svg";
      const mode = `${instructor.isAutomatic == 1 ? "Automatic" : ""} ${
        instructor.isManual == 1 ? "Manual" : ""
      } ${instructor.isTdcOnsite == 1 ? "Onsite" : ""}  `;

      return `
        <div class="swiper-slide p-2 mb-5">
          <div class="card flex flex-col items-center gap-10 w-56 h-[25rem] bg-white rounded-xl shadow-md p-4 space-y-3">
            <img src="${profilePic}" alt="Instructor Profile" class="w-full h-32 object-cover rounded-md">
            <div class="flex flex-col gap-2">
              <h1 class="text-lg font-bold text-gray-800 text-center">${instructor.instructor_name}</h1>
              <p class="text-sm text-gray-700">${instructor.instructor_type}</p>
              <p class="text-sm text-gray-600">Started: ${instructor.date_started}</p>
              <p class="text-xs text-gray-600 italic">Mode: <br> ${mode}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Initialize Swiper
  const instructorSwiper = new Swiper(".swiper2", {
    direction: "horizontal",
    slidesPerView: 1,
    centeredSlides: true,
    spaceBetween: 10,
    pagination: {
      el: ".swiper-pagination2",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next2",
      prevEl: ".swiper-button-prev2",
    },
    grabcursor: true,
  });
}

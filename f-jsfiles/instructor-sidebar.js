const sidebarContent = `
        <div id="side-bar" class="fixed top-0 left-0 h-full w-16 md:w-[160px] p-2 bg-sky-950 text-white z-50 transition-all duration-300">
                <div class="block">
                    <button id="sidebar-toggle" class="absolute top-3 left-1 focus:outline-none">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium sidebar-label">USER</h1>
                </div>
                <div class="absolute top-16">
                    <ul class="flex flex-col justify-items-center gap-4 font-light text-base">
                        <li id="dashboard"
                            class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/admin-dashboard">
                                <img src="/f-css/solid/white/view-grid.svg" class="side-icons" />
                            <span class="sidebar-label">Dashboard</span>
                            </a>
                        </li>
                        <li id="profile"
                            class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/instructor-profile">
                                <img src="/f-css/solid/white/user.svg" class="side-icons" />
                            <span class="sidebar-label">Profile</span>
                            </a>
                        </li>
                        <li id="requests" class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/instructor-requests">
                                <img src="/f-css/solid/white/question-mark-circle.svg" class="side-icons" />
                            <span class="sidebar-label">Requests</span>
                            </a>
                        </li>
                        <li id="reports" class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/instructor-reports">
                                <img src="/f-css/solid/white/exclamation-circle.svg" class="side-icons" />
                            <span class="sidebar-label">Reports</span>
                            </a>
                        </li>
                        <li id="payments" class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/payments">
                                <img src="/f-css/solid/white/cash.svg" class="side-icons" />
                            <span class="sidebar-label">Payments</span>
                            </a>
                        </li>
                        <li id="logout" class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                            <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/logout">
                                <img src="/f-css/solid/white/logout.svg" class="side-icons" />
                            <span class="sidebar-label">Logout</span>
                            </a>
                        </li>
                    </ul>
                </div>
          <div class="absolute bottom-3 items-center ml-2 object-cover">
          <img src="/f-css/solid/drivers_ed_logo-no-bg.png" />
          </div>
          <div>
          
      `;
const sidebarContainer = document.getElementById("sidebar-container");
if (sidebarContainer) {
  sidebarContainer.innerHTML = sidebarContent;
} else {
  console.error("Sidebar container not found");
}

const sidebar = document.getElementById("side-bar");
const toggleBtn = document.getElementById("sidebar-toggle");
const labels = sidebar.querySelectorAll(".sidebar-label");

toggleBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("w-16")) {
    sidebar.classList.remove("w-16");
    sidebar.classList.add("w-44");
    labels.forEach((label) => label.classList.remove("hidden"));
  } else {
    sidebar.classList.remove("w-44");
    sidebar.classList.add("w-16");
    labels.forEach((label) => label.classList.add("hidden"));
  }
});

const isMobile = window.innerWidth < 768;

// Start collapsed by default
if (isMobile) {
  labels.forEach((label) => label.classList.add("hidden"));
}

currentPath = window.location.pathname;
navLinks = document.querySelectorAll(".side-nav-link");
iconMap = {
  "/admin-dashboard": "/f-css/solid/black/view-grid.svg",
  "/instructor-profile": "/f-css/solid/black/user.svg",
  "/instructor-requests": "/f-css/solid/black/question-mark-circle.svg",
  "/instructor-reports": "/f-css/solid/black/exclamation-circle.svg",
  "/payments": "/f-css/solid/black/cash.svg",
  "/logout": "/f-css/solid/black/logout.svg",
};

navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPath) {
    link.parentElement.classList.add("active-nav");
    link.parentElement.classList.remove("hover:hover-bg-custom");
    const icon = link.querySelector(".side-icons");
    icon.src = iconMap[href]; // Update the src attribute
  }
});

const sidebarContent = `
          <div id="side-bar" class="block h-svh sidebar-width fixed p-4 bg-sky-950 text-white space-y-5 z-20">
              <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium">USER</h1>
              <ul class="flex flex-1 flex-col gap-4 font-light text-base">
                  <li id="dashboard"
                      class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-dashboard"">
                          <img src="/f-css/solid/white/view-grid.svg" class="side-icons" />
                      <span>Dashboard</span>
                      </a>
                  </li>
                  <li id="profile"
                      class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-profile"">
                          <img src="/f-css/solid/white/user.svg" class="side-icons" />
                      <span>Profile</span>
                      </a>
                  </li>
                  <li id="programs" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-programs">
                          <img src="/f-css/solid/white/table.svg" class="side-icons" />
                      <span>Programs</span>
                      </a>
                  </li>
                  <li id="requests" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-requests">
                          <img src="/f-css/solid/white/question-mark-circle.svg" class="side-icons" />
                      <span>Requests</span>
                      </a>
                  </li>
                  <li id="reports" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-reports">
                          <img src="/f-css/solid/white/exclamation-circle.svg" class="side-icons" />
                      <span>Reports</span>
                      </a>
                  </li>
                  <li id="payments" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/user-payments">
                          <img src="/f-css/solid/white/cash.svg" class="side-icons" />
                      <span>Payments</span>
                      </a>
                  </li>
                  <li id="logout" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                      <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/logout">
                          <img src="/f-css/solid/white/logout.svg" class="side-icons" />
                      <span>Logout</span>
                      </a>
                  </li>
              </ul>
          <div>
          <div class="absolute bottom-3 items-center ml-2 w-44 h-20">
          <img src="/f-css/solid/drivers_ed_logo-no-bg.png" />
          </div>
          
      `;
const sidebarContainer = document.getElementById("sidebar-container");
if (sidebarContainer) {
  sidebarContainer.innerHTML = sidebarContent;
} else {
  console.error("Sidebar container not found");
}

currentPath = window.location.pathname;
navLinks = document.querySelectorAll(".side-nav-link");
iconMap = {
  "/user-dashboard": "/f-css/solid/black/view-grid.svg",
  "/user-profile": "/f-css/solid/black/user.svg",
  "/user-programs": "/f-css/solid/black/table.svg",
  "/user-requests": "/f-css/solid/black/question-mark-circle.svg",
  "/user-reports": "/f-css/solid/black/exclamation-circle.svg",
  "/user-payments": "/f-css/solid/black/cash.svg",
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
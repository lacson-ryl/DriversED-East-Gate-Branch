const sidebarContent = `
        <div id="side-bar" class="block h-svh sidebar-width fixed p-4 bg-sky-950 text-white space-y-5 z-20">
            <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium">ADMIN</h1>
            <ul class="flex flex-1 flex-col gap-4 font-light text-base">
                <li id="dashboard"
                    class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/admin-dashboard"">
                        <img src="/f-css/solid/white/view-grid.svg" class="side-icons" />
                    <span>Dashboard</span>
                    </a>
                </li>
                <li id="manage-people" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/manage-people">
                        <img src="/f-css/solid/white/user-group.svg" class="side-icons" />
                    <span>Manage People</span>
                    </a>
                </li>
                <li id="programs" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/programs">
                        <img src="/f-css/solid/white/table.svg" class="side-icons" />
                    <span>Programs</span>
                    </a>
                </li>
                <li id="applicants" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/applicants">
                        <img src="/f-css/solid/white/identification.svg" class="side-icons"/>
                    <span>Applicants</span>
                    </a>
                </li>
                <li id="search" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/search">
                        <img src="/f-css/solid/white/search-circle.svg" class="side-icons" />
                    <span>Search</span>
                    </a>
                </li>
                <li id="requests" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/requests">
                        <img src="/f-css/solid/white/question-mark-circle.svg" class="side-icons" />
                    <span>Requests</span>
                    </a>
                </li>
                <li id="certificates" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/certificates">
                        <img src="/f-css/solid/white/star.svg" class="side-icons" />
                    <span>Certificates</span>
                    </a>
                </li>
                <li id="reports" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/payments">
                        <img src="/f-css/solid/white/cash.svg" class="side-icons" />
                    <span>Payments</span>
                    </a>
                </li>
                <li id="reports" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/reports">
                        <img src="/f-css/solid/white/exclamation-circle.svg" class="side-icons" />
                    <span>Reports</span>
                    </a>
                </li>
                <li id="logout" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                    <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/logout">
                        <img src="/f-css/solid/white/logout.svg" class="side-icons" />
                    <span>Logout</span>
                    </a>
                </li>
            </ul>
        </div>
    `;
document.getElementById("sidebar-container").innerHTML = sidebarContent;

const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll(".side-nav-link");
const iconMap = {
  "/admin-dashboard": "/f-css/solid/black/view-grid.svg",
  "/manage-people": "/f-css/solid/black/user-group.svg",
  "/programs": "/f-css/solid/black/table.svg",
  "/applicants": "/f-css/solid/black/identification.svg",
  "/search": "/f-css/solid/black/search-circle.svg",
  "/requests": "/f-css/solid/black/question-mark-circle.svg",
  "/certificates": "/f-css/solid/black/star.svg",
  "/payments": "/f-css/solid/black/cash.svg",
  "/reports": "/f-css/solid/black/exclamation-circle.svg",
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
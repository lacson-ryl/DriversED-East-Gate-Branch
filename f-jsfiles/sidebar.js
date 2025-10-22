const sidebarContent = `
<div id="side-bar" class="block h-svh sidebar-width fixed p-4 bg-sky-950 text-white space-y-5 z-20">
    <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium">ADMIN</h1>
    <ul class="flex flex-1 flex-col gap-4 font-light text-base">
        <li id="dashboard"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/admin-dashboard"">
                        <img src=" /f-css/solid/white/view-grid.svg" class="side-icons" />
            <span>Dashboard</span>
            </a>
        </li>
        <li id="manage-people"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/manage-people">
                <img src="/f-css/solid/white/user-group.svg" class="side-icons" />
                <span>Manage People</span>
            </a>
        </li>
        <li id="programs"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/programs">
                <img src="/f-css/solid/white/table.svg" class="side-icons" />
                <span>Programs</span>
            </a>
        </li>
        <li id="applicants"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/applicants">
                <img src="/f-css/solid/white/identification.svg" class="side-icons" />
                <span>Applicants</span>
            </a>
        </li>
        <li id="search" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/search">
                <img src="/f-css/solid/white/search-circle.svg" class="side-icons" />
                <span>Search</span>
            </a>
        </li>
        <li id="requests"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/requests">
                <img src="/f-css/solid/white/question-mark-circle.svg" class="side-icons" />
                <span>Requests</span>
            </a>
        </li>
        <li id="certificates"
            class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/certificates">
                <img src="/f-css/solid/white/star.svg" class="side-icons" />
                <span>Certificates</span>
            </a>
        </li>
        <li id="reports" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/payments">
                <img src="/f-css/solid/white/cash.svg" class="side-icons" />
                <span>Payments</span>
            </a>
        </li>
        <li id="reports" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/reports">
                <img src="/f-css/solid/white/exclamation-circle.svg" class="side-icons" />
                <span>Reports</span>
            </a>
        </li>
        <li id="logout" class="flex flex-row items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
            <a class="side-nav-link flex flex-row items-center w-full gap-5" href="/account/logout">
                <img src="/f-css/solid/white/logout.svg" class="side-icons" />
                <span>Logout</span>
            </a>
        </li>
    </ul>
    <div class="absolute bottom-3 items-center ml-1 mr-3 object-cover">
        <img src="/f-css/solid/drivers_ed_logo-no-bg.png" />
    </div>
</div>
    <div id="logout-confirmation" class="hidden fixed bg-sky-950 px-11 py-3 mt-4 text-center text-white rounded-lg shadow-lg z-50">
        <p>Are you sure??</p>
        <div class="">
            <button id="logout-yes"
                class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 rounded w-full mt-2">Yes</button>
            <button id="logout-no"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 rounded w-full mt-2">No</button>
        </div>
    </div>
<div id="notificationDropdown"
    class="hidden absolute w-72 max-h-80 overflow-auto bg-white shadow-lg rounded border border-black"
    style="z-index: 99999;">
    <div class="p-2">
        <h3 class="font-semibold">Recent Notifications</h3>
        <ul id="notificationList" class="text-sm"></ul>
    </div>
</div>
    `;
document.getElementById("sidebar-container").innerHTML = sidebarContent;

const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll(".side-nav-link");
const iconMap = {
  "/account/admin-dashboard": "/f-css/solid/black/view-grid.svg",
  "/account/manage-people": "/f-css/solid/black/user-group.svg",
  "/account/programs": "/f-css/solid/black/table.svg",
  "/account/applicants": "/f-css/solid/black/identification.svg",
  "/account/search": "/f-css/solid/black/search-circle.svg",
  "/account/requests": "/f-css/solid/black/question-mark-circle.svg",
  "/account/certificates": "/f-css/solid/black/star.svg",
  "/account/payments": "/f-css/solid/black/cash.svg",
  "/account/reports": "/f-css/solid/black/exclamation-circle.svg",
  "/account/logout": "/f-css/solid/black/logout.svg",
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

// Logout confirmation logic
const logoutBtn = document.querySelector("#logout a");
const logoutConfirm = document.getElementById("logout-confirmation");

logoutBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const rect = logoutBtn.getBoundingClientRect();
  logoutConfirm.style.left = rect.left + "px";
  logoutConfirm.style.top = 20 + rect.top + "px";
  logoutConfirm.style.display = "block";

  document.getElementById("logout-yes").addEventListener("click", () => {
    window.location.href = "/account/logout";
  });
  document.getElementById("logout-no").addEventListener("click", () => {
    logoutConfirm.style.display = "none";
  });
});

// Notification logic (position dropdown under bell icon, always on top)
const notifBtn = document.getElementById("notif-button");
const notifDropDown = document.getElementById("notificationDropdown");

if (notifBtn && notifDropDown) {
  notifBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const notifList = document.getElementById("notificationList");

    // Get the bell icon's position relative to the viewport
    const rect = notifBtn.getBoundingClientRect();

    // Set dropdown position (fixed to viewport)
    notifDropDown.style.left = rect.left + "px";
    notifDropDown.style.top = rect.bottom + "px";

    // Show/hide logic
    if (notifDropDown.classList.contains("hidden")) {
      notifDropDown.classList.remove("hidden");
      notifList.classList.remove("hidden");
      renderNotificationsList();
    } else {
      notifDropDown.classList.add("hidden");
      notifList.classList.add("hidden");
      const notifNewIndicator = document.getElementById("notif-new-indicator");
      if (notifNewIndicator) {
        notifNewIndicator.classList.add("hidden");
      }
    }
  });

  // Hide dropdown when clicking outside
  window.addEventListener("click", function (event) {
    if (
      notifDropDown &&
      !notifDropDown.contains(event.target) &&
      notifBtn &&
      !notifBtn.contains(event.target)
    ) {
      notifDropDown.classList.add("hidden");
    }
  });
}

async function renderNotificationsList() {
  const response = await fetch("/account/api/notifications");
  if (!response.ok) {
    console.error("Failed to fetch notifications");
    return "Failed to fetch notifications.";
  }
  const notifData = await response.json();
  const notifList = document.getElementById("notificationList");
  notifList.innerHTML = "";
  notifData.forEach((notif) => {
    const notifItem = document.createElement("li");
    notifItem.className =
      "flex items-center justify-between p-2 hover:bg-gray-100";
    notifItem.innerHTML = `
      <div class="flex w-full items-center">
        <div class="flex-shrink-0 mr-2">
          <div class="h-4 w-4 ${
            notif.isRead ? "hidden" : ""
          } rounded-full bg-blue-900 animate-pulse"></div>
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <h1 class="font-semibold text-sm">${notif.notif_type}</h1>
          <p class="block text-xs text-ellipsis break-words overflow-hidden">${
            notif.message
          }</p>
        </div>
        <span class="text-xs w-20 flex-shrink-0 text-gray-500 text-right">${
          notif.date_created
        }</span>
      </div>
    `;
    notifList.appendChild(notifItem);
  });
}

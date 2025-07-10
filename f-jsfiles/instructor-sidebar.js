const sidebarContent = `
<div id="side-bar"
    class="flex flex-col fixed top-0 left-0 h-full w-16 md:w-[160px] p-2 bg-sky-950 text-white z-50 transition-all duration-300">
    <div class="block mt-1 min-h-14">
        <button id="sidebar-toggle" class="absolute md:hidden top-4 left-4 focus:outline-none">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium sidebar-label">INSTRUCTOR</h1>
    </div>
    <div class="block mt-4">
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
            <li id="payments"
                class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/payments">
                    <img src="/f-css/solid/white/cash.svg" class="side-icons" />
                    <span class="sidebar-label">Payments</span>
                </a>
            </li>
            <li id="logout"
                class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
                <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/logout">
                    <img src="/f-css/solid/white/logout.svg" class="side-icons" />
                    <span class="sidebar-label">Logout</span>
                </a>
            </li>
        </ul>
        <div class="absolute bottom-3 items-center ml-1 mr-3 object-cover">
            <img src="/f-css/solid/drivers_ed_logo-no-bg.png" />
        </div>
    </div>
    <div id="logout-confirmation" class="hidden mt-4 text-center text-white rounded-lg shadow-lg z-50">
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
        <div class="p-2 text-black">
            <h3 class="font-semibold">Recent Notifications</h3>
            <ul id="notificationList" class="text-sm"></ul>
        </div>
    </div>
</div>    
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
    toggleBtn.classList.remove("left-4");
    toggleBtn.classList.add("left-1");
    labels.forEach((label) => label.classList.remove("hidden"));
  } else {
    sidebar.classList.remove("w-44");
    sidebar.classList.add("w-16");
    toggleBtn.classList.remove("left-1");
    toggleBtn.classList.add("left-4");
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

// Logout confirmation logic
const logoutBtn = document.querySelector("#logout a");
const logoutConfirm = document.getElementById("logout-confirmation");

logoutBtn.addEventListener("click", (event) => {
  event.preventDefault();
  logoutConfirm.style.display = "block";

  document.getElementById("logout-yes").addEventListener("click", () => {
    window.location.href = "/logout";
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
  const response = await fetch("/api/notifications");
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

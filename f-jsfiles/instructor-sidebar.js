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

const notifBtn = document.getElementById("notif-button");
const notifDropDown = document.getElementById("notificationDropdown");
notifBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const notifList = document.getElementById("notificationList");
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
// Close notif when clicking outside of it
window.addEventListener("click", function (event) {
  // If the click is outside both the button and the dropdown, close it
  if (
    notifDropDown &&
    !notifDropDown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    notifDropDown.classList.add("hidden");
  }
});

async function renderNotificationsList() {
  const response = await fetch("/api/notifications");
  if (!response.ok) {
    console.error("Failed to fetch notifications");
    return "Failed to fetch notifications.";
  }

  const notifData = await response.json();
  const notifList = document.getElementById("notificationList");
  notifList.innerHTML = ""; // Clear previous notifications

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
      <span class="text-xs w-20 flex-shrink-0 text-gray-500 text-right">
        ${notif.date_created}
      </span>
    </div>
    `;
    notifList.appendChild(notifItem);
  });
}

function renderSampleNotifications() {
  const notifList = document.getElementById("notificationList");
  notifList.innerHTML = ""; // Clear previous notifications

  const sampleNotifs = [
    {
      notif_type: "Payment",
      message: "Your payroll for June is now available.",
      date_created: "2025-06-10",
      isRead: false,
    },
    {
      notif_type: "Request",
      message: "A new leave request has been submitted.",
      date_created: "2025-06-09",
      isRead: true,
    },
    {
      notif_type: "System",
      message:
        "System maintenance scheduled for June 12. dgfssssssssssssssssssssssssssssss addafd asdfsaf  asfaea fefewwegrgdrs",
      date_created: "2025-06-08",
      isRead: false,
    },
    {
      notif_type: "Reminder",
      message: "Please update your profile information.",
      date_created: "2025-06-07",
      isRead: true,
    },
  ];

  sampleNotifs.forEach((notif) => {
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
      <span class="text-xs w-20 flex-shrink-0 text-gray-500 text-right">
        ${notif.date_created}
      </span>
    </div>
    `;
    notifList.appendChild(notifItem);
  });
}

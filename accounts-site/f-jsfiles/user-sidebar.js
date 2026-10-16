const sidebarContent = `
<div id="side-bar"
  class="flex flex-col fixed top-0 left-0 h-full w-[180px] p-2 bg-sky-950 text-white z-50">
<div class="block mt-1 min-h-14 ">
    <h1 class="text-center border-b-2 border-slate-500 p-2 text-lg font-medium">USER</h1>
  </div>
  <div class="block mt-4">
    <ul class="flex flex-col justify-items-center gap-4 font-light text-base">
      <li id="dashboard"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/account/user-dashboard">
          <img src="/account/f-assets/solid/white/view-grid.svg" class="side-icons" />
          <span>Dashboard</span>
        </a>
      </li>
      <li id="profile"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom ">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/account/user-profile">
          <img src="/account/f-assets/solid/white/user.svg" class="side-icons" />
          <span>Profile</span>
        </a>
      </li>
      <li id="programs"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/account/user-programs">
          <img src="/account/f-assets/solid/white/table.svg" class="side-icons" />
          <span>Programs</span>
        </a>
      </li>
      <li id="chatbox"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/account/user-chatbox">
          <img src="/account/f-assets/solid/white/question-mark-circle.svg" class="side-icons" />
          <span>Chat Box</span>
        </a>
      </li>
      <li id="payments"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5" href="/account/user-payments">
          <img src="/account/f-assets/solid/white/cash.svg" class="side-icons" />
          <span>Payments</span>
        </a>
      </li>
      <li id="logout"
        class="flex justify-items-center items-center rounded-3xl hover:font-bold py-1 px-2 hover:hover-bg-custom">
        <a class="side-nav-link flex justify-items-center items-center w-full gap-5">
          <img src="/account/f-assets/solid/white/logout.svg" class="side-icons" />
          <span>Logout</span>
        </a>
      </li>
    </ul>
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
  <div class="absolute bottom-3 items-center ml-1 mr-3 object-cover">
    <img src="/account/f-assets/solid/drivers_ed_logo-no-bg.png" />
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

const sidebarStyles = document.createElement("style");
sidebarStyles.textContent = `
  #side-bar {
    padding: 1rem .75rem;
    background: #0B2D4A;
    box-shadow: 6px 0 24px rgba(11, 45, 74, .12);
  }

  #side-bar .active-nav {
    background: #2585F5;
    color: #fff;
    box-shadow: 0 8px 18px rgba(37, 133, 245, .22);
  }

  #side-bar li {
    transition: background-color .2s ease, transform .2s ease;
  }

  #side-bar li:hover {
    transform: translateX(2px);
  }

  #side-bar .side-nav-link {
    min-height: 2.25rem;
  }

  #mobile-sidebar-toggle {
    display: none;
  }

  @media (max-width: 767px) {
    body.user-sidebar-layout {
      padding-left: 0;
    }

    #side-bar {
      transform: translateX(-100%);
      box-shadow: 10px 0 30px rgba(11, 45, 74, .2);
      transition: transform .2s ease;
    }

    #side-bar.mobile-sidebar-open {
      transform: translateX(0);
    }

    #mobile-sidebar-toggle {
      display: inline-flex;
      width: 2.5rem;
      height: 2.5rem;
      align-items: center;
      justify-content: center;
      border: 1px solid #dbe7f2;
      border-radius: .75rem;
      background: #fff;
      color: #0B2D4A;
      box-shadow: 0 6px 18px rgba(11, 45, 74, .14);
    }

    #mobile-sidebar-toggle svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    #sidebar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: rgba(11, 45, 74, .35);
      opacity: 0;
      pointer-events: none;
      transition: opacity .2s ease;
    }

    #sidebar-backdrop.is-visible {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;
document.head.appendChild(sidebarStyles);

const sidebarContainer = document.getElementById("sidebar-container");
if (sidebarContainer) {
  sidebarContainer.innerHTML = sidebarContent;
} else {
  console.error("Sidebar container not found");
}

const sidebar = document.getElementById("side-bar");
document.body.classList.add("user-sidebar-layout");

const leftSide = document.getElementById("left-side");
const notifButton = document.getElementById("notif-button");
const mobileToggleMarkup = `<button id="mobile-sidebar-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>`;

if (!document.getElementById("mobile-sidebar-toggle")) {
  if (leftSide && notifButton) {
    notifButton.insertAdjacentHTML("beforebegin", mobileToggleMarkup);
  } else {
    document.body.insertAdjacentHTML("afterbegin", mobileToggleMarkup);
  }
}
document.body.insertAdjacentHTML("afterbegin", `<div id="sidebar-backdrop"></div>`);

const mobileToggle = document.getElementById("mobile-sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");

function setMobileSidebar(open) {
  sidebar.classList.toggle("mobile-sidebar-open", open);
  sidebarBackdrop.classList.toggle("is-visible", open);
  mobileToggle.setAttribute("aria-expanded", String(open));
  mobileToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

mobileToggle.addEventListener("click", () => {
  setMobileSidebar(!sidebar.classList.contains("mobile-sidebar-open"));
});
sidebarBackdrop.addEventListener("click", () => setMobileSidebar(false));
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) setMobileSidebar(false);
});

const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll(".side-nav-link");

navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPath) {
    link.parentElement.classList.add("active-nav");
    link.parentElement.classList.remove("hover:hover-bg-custom");
  }

  link.addEventListener("click", () => {
    if (window.innerWidth < 768 && link.parentElement?.id !== "logout") {
      setMobileSidebar(false);
    }
  });
});

// Logout confirmation logic
const logoutBtn = document.querySelector("#logout a");
const logoutConfirm = document.getElementById("logout-confirmation");

logoutBtn.addEventListener("click", (event) => {
  event.preventDefault();
  logoutConfirm.style.display = "block";

  document.getElementById("logout-yes").addEventListener("click", () => {
    window.location.href = "/account/logout";
  });
  document.getElementById("logout-no").addEventListener("click", () => {
    logoutConfirm.style.display = "none";
  });
});

if (!window.notifSocketInitialized) {
  // Connect once per session
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${wsProtocol}://${window.location.host}/account/notifications/socket`;
  window.notifSocket = new WebSocket(wsUrl);
  
  window.notifSocket.onopen = () => {
    console.log("Notification WebSocket opened");
    window.dispatchEvent(new Event("ticket-socket-open"));
  };

  window.notifSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "chat") {
      window.dispatchEvent(new CustomEvent("ticket-chat-message", { detail: data }));
    } else if (data.type === "notif" || data.type === "init") {
      updateNotifIndicator(data.unread_count);
    }
  };

  window.notifSocket.onerror = (err) => {
    console.error("Notification WebSocket error:", err);
  };

  window.notifSocket.onclose = () => {
    console.log("Notification WebSocket closed");
  };

  window.notifSocketInitialized = true;
}

function updateNotifIndicator(unreadCount) {
  const indicator = document.getElementById("notif-new-indicator");
  if (!indicator) return;

  if (unreadCount > 0) {
    indicator.classList.remove("hidden");
    indicator.classList.add("flex");
    indicator.textContent = unreadCount;
  } else {
    indicator.classList.add("hidden");
    indicator.classList.remove("flex");
    indicator.textContent = "";
  }
}

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

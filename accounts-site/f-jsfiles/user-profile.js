import { decryptData } from "../utils/f-webCryptoKeys.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const displayValue = (value) => escapeHtml(value || "----------------");

function renderLockNotice() {
  return `<div class="relative inline-flex"><button id="lock-info" type="button" class="rounded-lg p-1 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Show privacy information">&#128274;</button><span id="lock-tooltip" class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">Your information is secure and private.</span></div>`;
}

function renderSection(title, content, description = "") {
  return `<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(11,45,74,0.06)] md:p-6"><div class="mb-4 border-b border-slate-100 pb-3"><h2 class="text-base font-bold text-[#0B2D4A]">${title}</h2>${description ? `<p class="mt-1 text-xs text-slate-500">${description}</p>` : ""}</div>${content}</section>`;
}

function renderInfoItem(label, value, className = "") {
  return `<div class="min-w-0 ${className}"><dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">${label}</dt><dd class="mt-1 break-words text-sm font-semibold text-[#17324D]">${displayValue(value)}</dd></div>`;
}

function renderProfileHeader(profile) {
  const name = profile.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`
    : "User Profile";
  return `<div class="border-b border-slate-200 bg-[#0B2D4A] px-5 py-6 text-white md:px-7"><div class="flex flex-col items-center gap-4 sm:flex-row"><img id="profile-picture-preview" class="h-24 w-24 rounded-2xl border-4 border-white/30 object-cover shadow-lg" src="${escapeHtml(profile.profile_picture || "")}" alt="Profile picture"><div class="min-w-0 text-center sm:text-left"><p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Client profile</p><h1 class="mt-1 text-2xl font-bold">${escapeHtml(name)}</h1><div class="mt-2 flex items-center justify-center gap-2 text-sm text-blue-100 sm:justify-start">${renderLockNotice()}<span>Your information is protected</span></div></div></div></div>`;
}

function renderPersonalInformation(profile) {
  return renderSection("Personal information", `<dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${renderInfoItem("First name", profile.first_name)}${renderInfoItem("Middle name", profile.middle_name)}${renderInfoItem("Last name", profile.last_name)}${renderInfoItem("Birth date", profile.birth_date)}${renderInfoItem("Age", profile.age)}${renderInfoItem("Nationality", profile.nationality)}${renderInfoItem("Gender", profile.gender)}${renderInfoItem("Civil status", profile.civil_status)}</dl>`);
}

function renderContactInformation(profile) {
  return renderSection("Contact information", `<dl class="grid gap-4 sm:grid-cols-2">${renderInfoItem("Phone number", profile.phone_number)}${renderInfoItem("Email", profile.email)}${renderInfoItem("Address", profile.address, "sm:col-span-2")}${renderInfoItem("LTO client ID", profile.lto_client_id)}</dl>`);
}

function renderGovernmentId(profile) {
  const image = profile.identification_card_picture || "/account/f-assets/solid/black/identification.svg";
  return renderSection("Government ID", `<div class="flex flex-col gap-4 sm:flex-row sm:items-start"><img id="government-id-preview" class="h-32 w-48 rounded-xl border border-slate-200 bg-slate-50 object-cover" src="${escapeHtml(image)}" alt="Government ID preview"><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-[#17324D]">${displayValue(profile.identification_card || "Government ID")}</p><p class="mt-2 text-xs leading-5 text-slate-500">Please keep an ID uploaded for account verification in case you lose your password.</p></div></div>`);
}

function renderEnrolledPrograms(courseList) {
  if (!courseList?.length) return renderSection("Enrolled programs", `<p class="text-sm text-slate-500">No enrolled programs yet.</p>`);
  const cards = courseList.map((course) => `<article class="rounded-xl border border-slate-100 bg-slate-50 p-4"><h3 class="truncate text-sm font-bold text-[#0B2D4A]">${escapeHtml(course.program_name)}</h3><dl class="mt-3 grid grid-cols-3 gap-3">${renderInfoItem("Started", course.date_started)}${renderInfoItem("Completed", course.date_completed || "Pending")}${renderInfoItem("Hours", `${course.total_hours} / ${course.program_duration}`)}</dl></article>`).join("");
  return renderSection("Enrolled programs", `<div class="space-y-3">${cards}</div>`);
}

function renderProfile(profile, courseList) {
  return `<div class="mx-auto my-5 w-full max-w-6xl overflow-hidden rounded-2xl bg-[#F4F7FB] shadow-[0_12px_35px_rgba(11,45,74,0.08)]">${renderProfileHeader(profile)}<div class="grid gap-5 p-5 md:p-7 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]"><div class="space-y-5">${renderPersonalInformation(profile)}${renderContactInformation(profile)}</div><div class="space-y-5">${renderGovernmentId(profile)}${renderEnrolledPrograms(courseList)}</div></div><div class="px-5 pb-6 md:px-7"><a id="edit-profile-btn" href="/account/user-profile-form" class="inline-flex rounded-lg bg-[#1976D2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0B2D4A] focus:outline-none focus:ring-2 focus:ring-blue-500">Edit profile</a></div></div>`;
}

function initializeProfileEvents() {
  const lockButton = document.getElementById("lock-info");
  const tooltip = document.getElementById("lock-tooltip");
  if (!lockButton || !tooltip) return;
  lockButton.addEventListener("click", () => {
    tooltip.classList.toggle("hidden");
    window.setTimeout(() => tooltip.classList.add("hidden"), 4000);
  });
}

async function loadProfile() {
  const response = await fetch("/account/api/user-profile");
  const encrypted = await response.json();
  return decryptData(encrypted.encrypted);
}

async function renderDetails() {
  const data = await loadProfile();
  const profileDisplay = document.getElementById("profile-display");
  if (!profileDisplay) return;
  const profile = data.userProfileDetails || {};
  profileDisplay.innerHTML = renderProfile(profile, data.userCourseInfoList);
  initializeProfileEvents();
}

renderDetails();

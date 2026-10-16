import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#17324D] outline-none transition focus:border-[#2585F5] focus:ring-2 focus:ring-blue-100";

function renderLockHeader() {
  return `<div class="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4"><div class="rounded-xl bg-blue-50 p-2 text-[#1976D2]"><span aria-hidden="true">&#128274;</span></div><div><h1 class="text-xl font-bold text-[#0B2D4A]">Profile details</h1><p class="text-xs text-slate-500">Your information is secure and private.</p></div><button id="lock-info" type="button" class="ml-auto rounded-lg p-2 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Show privacy information">&#128274;</button><span id="lock-tooltip" class="hidden">Secure profile</span></div>`;
}

function renderField(
  label,
  id,
  name,
  value = "",
  type = "text",
  required = false,
  extra = "",
) {
  return `<label class="block text-xs font-semibold text-slate-600">${label}${required ? ` <span class="text-red-500">*</span>` : ""}<input id="${id}" name="${name}" type="${type}" value="${escapeHtml(value)}" class="${inputClass}" ${required ? "required" : ""} ${extra}></label>`;
}

function renderPersonalFields(profile, isCreate) {
  return `<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(11,45,74,0.06)] md:p-6"><div class="mb-4 border-b border-slate-100 pb-3"><h2 class="text-base font-bold text-[#0B2D4A]">Personal information</h2><p class="mt-1 text-xs text-slate-500">Keep your account details current.</p></div><div class="grid gap-4 md:grid-cols-3">${renderField("First name", "first-name", "firstName", profile.first_name, "text", isCreate)}${renderField("Middle name", "middle-name", "middleName", profile.middle_name, "text", isCreate)}${renderField("Last name", "last-name", "lastName", profile.last_name, "text", isCreate)}</div><div class="mt-4 grid gap-4 sm:grid-cols-2">${renderField("Phone number", "phone-number", "phoneNumber", profile.phone_number, "number", isCreate)}${renderField("Email", "email", "email", profile.email, "email", isCreate)}</div><div class="mt-4 grid gap-4 sm:grid-cols-3">${renderField("Age", "age", "age", profile.age || "Set in birth date", "text", false, "readonly")}${renderField("Birth date", "birth-date", "birthDate", profile.birth_date, "date", isCreate)}${renderField("Nationality", "nationality", "nationality", profile.nationality)}</div><div class="mt-4 grid gap-4 sm:grid-cols-2"><label class="block text-xs font-semibold text-slate-600">Gender<select id="gender" name="gender" class="${inputClass}"><option value="Male" ${profile.gender === "Male" ? "selected" : ""}>Male</option><option value="Female" ${profile.gender === "Female" ? "selected" : ""}>Female</option><option value="LGBTQ" ${profile.gender === "LGBTQ" ? "selected" : ""}>LGBTQ</option></select></label>${renderField("Civil status", "civil-status", "civilStatus", profile.civil_status)}</div></section>`;
}

function renderContactFields(profile) {
  return `<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(11,45,74,0.06)] md:p-6"><div class="mb-4 border-b border-slate-100 pb-3"><h2 class="text-base font-bold text-[#0B2D4A]">Address and licensing</h2></div><label class="block text-xs font-semibold text-slate-600">Address<textarea id="address" name="address" class="${inputClass} min-h-24">${escapeHtml(profile.address)}</textarea></label><div class="mt-4">${renderField("LTO client ID", "lto-client-id", "ltoClientId", profile.lto_client_id)}</div></section>`;
}

function renderUploads(profile) {
  const idImage =
    profile.identification_card_picture ||
    "/account/f-assets/solid/black/identification.svg";
  return `<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(11,45,74,0.06)] md:p-6"><div class="mb-4 border-b border-slate-100 pb-3"><h2 class="text-base font-bold text-[#0B2D4A]">Verification documents</h2><p class="mt-1 text-xs text-slate-500">Upload clear images for account recovery and verification.</p></div><div class="flex flex-col gap-4 sm:flex-row"><img id="government-id-preview" class="h-28 w-40 rounded-xl border border-slate-200 object-cover" src="${escapeHtml(idImage)}" alt="Government ID preview"><div class="min-w-0 flex-1 space-y-3">${renderField("ID type", "id-type", "identification_card", profile.identification_card)}<label class="block text-xs font-semibold text-slate-600">Government ID image<input type="file" id="government-id-input" name="identification_card_picture" accept="image/*" class="mt-1 block w-full text-xs text-slate-500"></label><label class="block text-xs font-semibold text-slate-600">PRN<input id="prn" name="prn" type="number" value="${escapeHtml(profile.prn)}" class="${inputClass}" placeholder="Exclude spaces and dashes"></label></div></div><div class="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"><img id="profile-picture-preview" class="h-24 w-32 rounded-xl border border-slate-200 object-cover" src="${escapeHtml(profile.profile_picture || "")}" alt="Profile picture preview"><label class="block text-xs font-semibold text-slate-600">Profile picture<input type="file" id="profile-picture-input" name="profile_picture" accept="image/*" class="mt-1 block w-full text-xs text-slate-500"></label></div></section>`;
}

function renderForm(profile, isEdit) {
  return `
  <div class="mx-4 my-5 w-full max-w-5xl rounded-2xl bg-[#F4F7FB] p-4 md:p-7"><form id="${isEdit ? "edit-profile-form" : "profile-form"}" enctype="multipart/form-data" class="space-y-5">${renderLockHeader()}${renderPersonalFields(profile, !isEdit)}${renderContactFields(profile)}${renderUploads(profile)}<button id="${isEdit ? "edit-request-btn" : "submit-request-btn"}" type="submit" class="rounded-lg bg-[#1976D2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0B2D4A] focus:outline-none focus:ring-2 focus:ring-blue-500">${isEdit ? "Save changes" : "Submit profile"}</button></form></div>`;
}

function initializePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  input.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ✅ enforce image-only
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      event.target.value = ""; // clear invalid selection
      preview.src = ""; // reset preview
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      preview.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function initializeFormEvents(isEdit) {
  const form = document.getElementById(
    isEdit ? "edit-profile-form" : "profile-form",
  );
  const submitButton = document.getElementById(
    isEdit ? "edit-request-btn" : "submit-request-btn",
  );
  const birthDate = document.getElementById("birth-date");
  const age = document.getElementById("age");
  if (!form || !submitButton) return;
  if (!isEdit && birthDate && age)
    birthDate.addEventListener("input", () => {
      age.value = birthDate.value
        ? Math.floor(
            (new Date() - new Date(birthDate.value)) /
              (1000 * 60 * 60 * 24 * 365.25),
          )
        : "";
    });
  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      showBtnLoading(submitButton);
      try {
        const encrypted = await encryptData(new FormData(form));
        const response = await fetch(
          isEdit
            ? "/account/api/user-profile-edit"
            : "/account/api/user-profile-submit",
          {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
          },
        );
        const result = await response.json();
        showBtnResult(submitButton, response.ok);
        alert(
          response.ok
            ? result.message || "Profile submitted successfully!"
            : "Failed to save profile. Please try again later!",
        );
        if (response.ok)
          setTimeout(() => {
            window.location.href = "/account/user-profile";
          }, 3000);
      } catch (error) {
        console.error("Error submitting profile:", error);
        alert("An error occurred while submitting the profile.");
      }
    },
    { once: true },
  );
  initializePreview("profile-picture-input", "profile-picture-preview");
  initializePreview("government-id-input", "government-id-preview");
  const lockButton = document.getElementById("lock-info");
  const tooltip = document.getElementById("lock-tooltip");
  if (lockButton && tooltip)
    lockButton.addEventListener("click", () =>
      tooltip.classList.toggle("hidden"),
    );
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
  profileDisplay.innerHTML = renderForm(
    profile,
    Boolean(data.userProfileDetails),
  );
  initializeFormEvents(Boolean(data.userProfileDetails));
}

renderDetails();

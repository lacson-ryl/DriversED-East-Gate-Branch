import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { openFileViewer, applyDownloadBtn } from "../utils/file-helper.js";
import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

const modal = document.getElementById("myModal");
const modalDetails = document.getElementById("modal-details");
const titleDetails = document.getElementById("title-details");
const previewModal = document.getElementById("preview-modal");
const largePreviewImage = document.getElementById("large-preview-image");
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );

function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

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
      preview.closest(".payment-new-preview-frame")?.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

async function renderPaymentForm() {
  const response = await fetch("/account/api/user-payments/details-list");
  if (!response.ok) throw new Error("Unable to load payment details.");
  const encrypted = await response.json();
  const data = await decryptData(encrypted.encrypted);
  const methods = data.paymentMethods || [];
  const courses = data.paymentCourses || [];
  console.log("courses", courses);
  const methodSelect = document.getElementById("payment-method");
  const courseSelect = document.getElementById("course-select");
  methods.forEach((method) => {
    const option = new Option(method.method_name, method.method_name);
    option.id = method.method_id;
    option.dataset.file = method.method_file || "";
    methodSelect.append(option);
  });
  courses
    .filter((course) => !course.isPaid)
    .forEach((course) =>
      courseSelect.append(
        new Option(
          `ID:${course.course_id} - ${course.course_name} - ${course.course_price}`,
          course.course_id,
        ),
      ),
    );
  setupImagePreview("screenshot-receipt", "payment-picture-preview");
  methodSelect.addEventListener("change", () => {
    const option = methodSelect.selectedOptions[0];
    const preview = document.getElementById("payment-method-preview");
    const frame = document.getElementById("method-preview-frame");
    if (!option?.dataset.file) {
      frame.classList.add("hidden");
      return;
    }
    preview.src = option.dataset.file;
    frame.classList.remove("hidden");
    applyDownloadBtn(
      document.getElementById("download-image"),
      option.dataset.file,
      "image/jpeg",
      option.value,
    );
  });
  document
    .getElementById("payment-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = document.getElementById("submit-payment-btn");
      showBtnLoading(button);
      showLoadingMessage(modalDetails, "Processing your payment request...");
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      try {
        const response = await fetch("/account/api/payment/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedWithEncAesKey: await encryptData(
              new FormData(event.target),
            ),
          }),
        });
        const result = await response.json();
        showBtnResult(button, response.ok);
        titleDetails.textContent = response.ok
          ? "Payment submitted"
          : "Payment error";
        showOperationResult(
          modalDetails,
          response.ok,
          response.ok
            ? "Payment added successfully!"
            : result.error || "Unable to submit payment.",
        );
        if (response.ok) {
          event.target.reset();
          document
            .getElementById("payment-picture-preview")
            .closest(".payment-new-preview-frame")
            ?.classList.add("hidden");
          await renderPaymentList();
        }
        setTimeout(() => {
          modal.classList.add("hidden");
          modal.classList.remove("flex");
        }, 2500);
      } catch (error) {
        showBtnResult(button, false);
        modalDetails.textContent = "Unable to submit payment.";
      }
    });
}

function statusBadge(status) {
  const normalized =
    status === "Verified"
      ? "verified"
      : status === "Deny"
        ? "denied"
        : "pending";
  return `<span class="payment-new-status payment-new-status--${normalized}">${escapeHtml(status)}</span>`;
}
function renderPaymentRows(data) {
  return data
    .map(
      (payment) =>
        `<tr class="border-b border-slate-100 text-sm text-slate-600 hover:bg-slate-50"><td class="p-3 font-semibold">${payment.user_payment_id}</td><td class="p-3">${escapeHtml(payment.user_id)} - ${escapeHtml(payment.user_name)}</td><td class="p-3">${escapeHtml(payment.account_name)} - ${escapeHtml(payment.amount)}</td><td class="p-3">${escapeHtml(payment.payment_method)}</td><td class="p-3 text-center">${payment.screenshot_receipt ? `<button class="view-btn rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700" data-id="${payment.user_payment_id}" data-file-type="image/jpeg">View</button>` : `<button class="receipt-upload-btn rounded-lg bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700" data-id="${payment.user_payment_id}">Upload</button>`}</td><td class="p-3">${statusBadge(payment.status)}</td><td class="p-3 text-xs">${escapeHtml(payment.date_created)}</td></tr>`,
    )
    .join("");
}
function renderPaymentListMobile(data) {
  return data
    .map(
      (p) =>
        `<article class="border-b border-slate-100 p-4"><div class="flex justify-between"><strong>#${p.user_payment_id}</strong>${statusBadge(p.status)}</div><p class="mt-2 text-sm font-semibold text-slate-700">${escapeHtml(p.account_name)} - ${escapeHtml(p.amount)}</p><p class="text-xs text-slate-500">${escapeHtml(p.payment_method)} · ${escapeHtml(p.date_created)}</p><div class="mt-3">${p.screenshot_receipt ? `<button class="view-btn text-xs font-bold text-blue-700" data-id="${p.user_payment_id}" data-file-type="image/jpeg">View receipt</button>` : `<button class="receipt-upload-btn text-xs font-bold text-yellow-700" data-id="${p.user_payment_id}">Upload receipt</button>`}</div></article>`,
    )
    .join("");
}

async function renderPaymentList() {
  const target = document.getElementById("user-payments-table");
  try {
    const response = await fetch("/account/api/user-payments/list");
    if (!response.ok) throw new Error("Unable to load payment history.");
    const data = await response.json();
    document.getElementById("table-announcement").textContent = data.length
      ? "Your recent payment activity."
      : "No payments found.";
    target.innerHTML = data.length
      ? `<div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[760px] text-left"><thead><tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400"><th class="p-3">ID</th><th class="p-3">User</th><th class="p-3">Account / Amount</th><th class="p-3">Method</th><th class="p-3">Receipt</th><th class="p-3">Status</th><th class="p-3">Date</th></tr></thead><tbody>${renderPaymentRows(data)}</tbody></table></div><div class="md:hidden">${renderPaymentListMobile(data)}</div>`
      : '<p class="p-4 text-sm text-slate-500">No payments found.</p>';
    bindPaymentActions(data);
  } catch (error) {
    console.error("Unable to render payment history:", error);
    target.innerHTML =
      '<p class="p-4 text-sm text-red-600">Unable to load payment history.</p>';
  }
}

function showLargePreview(source) {
  if (!source || !previewModal || !largePreviewImage) return;
  largePreviewImage.src = source;
  previewModal.classList.remove("hidden");
  previewModal.classList.add("flex");
}

document
  .getElementById("view-receipt-preview")
  ?.addEventListener("click", () =>
    showLargePreview(document.getElementById("payment-picture-preview")?.src),
  );
document
  .getElementById("view-method-preview")
  ?.addEventListener("click", () =>
    showLargePreview(document.getElementById("payment-method-preview")?.src),
  );
document
  .getElementById("close-preview-modal")
  ?.addEventListener("click", () => {
    previewModal.classList.add("hidden");
    previewModal.classList.remove("flex");
  });

function bindPaymentActions(data) {
  document.querySelectorAll(".view-btn").forEach((button) =>
    button.addEventListener("click", () => {
      const payment = data.find(
        (item) => item.user_payment_id == button.dataset.id,
      );
      openFileViewer({
        fileData: payment.screenshot_receipt,
        fileType: button.dataset.fileType,
        title: `Payment ID #${button.dataset.id}`,
      });
    }),
  );
  document.querySelectorAll(".receipt-upload-btn").forEach((button) =>
    button.addEventListener("click", () => {
      const payment = data.find(
        (item) => item.user_payment_id == button.dataset.id,
      );
      modalDetails.innerHTML = `<form id="payment-receipt-upload-form"><p class="mb-3 font-semibold">Upload receipt for ${escapeHtml(payment.account_name)}</p><input id="receipt-upload-input" name="screenshot-receipt" type="file" accept="image/*" required class="w-full text-sm"><button id="receipt-submit-button" class="mt-4 rounded-lg bg-[#1976D2] px-4 py-2 text-sm font-bold text-white">Submit</button></form>`;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document
        .getElementById("payment-receipt-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const submit = document.getElementById("receipt-submit-button");
          showBtnLoading(submit);
          const response = await fetch(
            `/account/api/payments/receipt/${button.dataset.id}`,
            { method: "POST", body: new FormData(event.target) },
          );
          showBtnResult(submit, response.ok);
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          await renderPaymentList();
        });
    }),
  );
}

document.querySelector(".close")?.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
});
renderPaymentForm();
renderPaymentList();

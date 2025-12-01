import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { openFileViewer, applyDownloadBtn } from "../utils/file-helper.js";
import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

//initialize modal elements;
const modal = document.getElementById("myModal");
const spanX = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");
const titleDetails = document.getElementById("title-details");

async function renderUserPaymentsForm() {
  const response = await fetch("/account/api/user-payments/details-list");
  const paymentMethodSelect = document.getElementById("payment-method");
  const courseSelect = document.getElementById("course-select");

  const encrypted = await response.json();
  const data = await decryptData(encrypted.encrypted);
  const paymentMethods = data.paymentMethods || null;
  const paymentCourses = data.paymentCourses || null;

  if (
    !response.ok ||
    !paymentMethods ||
    paymentMethods.length === 0 ||
    paymentCourses.length === 0 ||
    !paymentCourses
  ) {
    if (paymentMethods.length === 0 || !paymentMethods) {
      const methodOption = document.createElement("option");
      methodOption.value = "No payment methods available";
      methodOption.id = 0;
      methodOption.innerText = "No payment methods available";
      paymentMethodSelect.appendChild(methodOption);
    }
    if (paymentCourses.length === 0 || !paymentCourses) {
      const courseOption = document.createElement("option");
      courseOption.value = "No courses available";
      courseOption.innerText = "No courses available";
      courseSelect.appendChild(courseOption);
    }
  }

  paymentMethods.forEach((method) => {
    const methodOption = document.createElement("option");
    methodOption.value = method.method_name;
    methodOption.id = method.method_id;
    methodOption.setAttribute("data-file", method.method_file || "");
    methodOption.innerText = method.method_name;
    paymentMethodSelect.appendChild(methodOption);
  });

  paymentCourses.forEach((course) => {
    if (course.isPaid) {
      return;
    }
    const courseOption = document.createElement("option");
    courseOption.value = course.course_id;
    courseOption.innerText = `${course.course_name} - ${course.course_price}`;
    courseSelect.appendChild(courseOption);
  });

  setupImagePreview("screenshot-receipt", "payment-picture-preview");

  // Add event listeners
  const paymentForm = document.getElementById("payment-form");
  paymentForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      showLoadingMessage(modalDetails, "Processing your Payment request...");
      modal.style.display = "flex";

      const formData = new FormData(event.target);
      const encrypting = await encryptData(formData);

      try {
        const response = await fetch("/account/api/payment/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
        });
        if (!response.ok) {
          titleDetails.innerText = "Error Payment";
          showOperationResult(
            modalDetails,
            false,
            "Sorry! Can't submit payment right now. Please try again later."
          );
        } else {
          titleDetails.innerText = "Success Payment";
          showOperationResult(
            modalDetails,
            true,
            "Payment Added Successfully!"
          );
          paymentForm.reset();
          renderUserPaymentsList(); // Refresh the payment list
        }
        setTimeout(() => {
          modal.style.display = "none";
        }, 3000);
      } catch (error) {
        console.error("Error submitting payment:", error);
        titleDetails.innerText = "Error Payment";
        modalDetails.innerText =
          "Sorry! Can't submit payment right now. Please try again later.";
        modal.style.display = "flex";
      }
    },
    { once: true }
  );

  paymentMethodSelect.addEventListener("change", function (event) {
    const downloadBtn = document.getElementById("download-image");
    const selectedOption = this.options[this.selectedIndex];
    const file = selectedOption.getAttribute("data-file");
    const name = selectedOption.value;
    if (file) {
      // If file is a base64 string or URL, set it directly
      const payMethodPrev = document.getElementById("payment-method-preview");
      payMethodPrev.src = file;
      payMethodPrev.style.display = "flex";
      applyDownloadBtn(downloadBtn, file, "image/jpeg", name);

      if (window.innerWidth < 768) {
        setTimeout(() => {
          payMethodPrev.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          payMethodPrev.classList.add("animate-pulse");
          setTimeout(
            () => payMethodPrev.classList.remove("animate-pulse"),
            2000
          );
        }, 500);
      }
    } else {
      document.getElementById("payment-method-preview").src = "";
    }
  });
}

function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

renderUserPaymentsForm();

async function renderUserPaymentsList() {
  const tableAnnouncement = document.getElementById("table-announcement");
  const userPaymentTable = document.getElementById("user-payments-table");

  // fetch user payments from the server
  const response = await fetch("/account/api/user-payments/list");
  if (!response.ok) {
    tableAnnouncement.innerText = "Sorry! can't fetch data right now";
    return;
  }

  const data = await response.json();

  if (data.length === 0) {
    tableAnnouncement.innerText = "No payments found";
    userPaymentTable.innerHTML = `
      <table id="applicants-table" class="w-full border-collapse">
        <thead class="">
          <tr class="text-center">
          </tr>
        </thead>
        <tbody class="">
          <tr class="text-center">
            <td colspan="7" class="border border-gray-300 px-4 py-2">No payments found</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    tableAnnouncement.innerText = "Payment Logs";
    const desktopTable = data
      .map(
        (arr) =>
          `
          <tr class="text-center group hover:outline outline-1 outline-black">
            <td class="border border-gray-300 px-4 py-2">
              ${arr.user_payment_id}
            </td>
            <td class="border border-gray-300 px-4 py-2">
              ${arr.user_id} - ${arr.user_name}
            </td>
            <td class="border border-gray-300 px-4 py-2">
              ${arr.account_name} - ${arr.amount}
            </td>
            <td class="text-center border border-gray-300 px-4 py-2">
              ${arr.payment_method}
            </td>
            <td class="border border-gray-300 px-4 py-2">
              <div class="flex flex-row items-center justify-center">
                ${
                  arr.screenshot_receipt
                    ? `
                <button href="javascript:void(0);" class="bg-blue-700 rounded-md px-2 view-btn" 
                data-id="${arr.user_payment_id}" data-file-type="image/jpeg">
                  <img src="/account/f-assets/solid/icons_for_buttons/photograph.svg" class="w-6 h-6 reverse-color" />
                </>
                `
                    : `<button data-id="${arr.user_payment_id}"
                  class="receipt-upload-btn bg-yellow-600 rounded-md px-2 hover:underline">
                  <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                </button>`
                }
              </div>
            </td>
            <td class="text-center border border-gray-300 px-4 py-2">
              <div class=" hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                arr.user_payment_id
              }">
                ${
                  arr.status == "Verified"
                    ? '<div class="text-green-700 hover:font-semibold rounded-md hover ">Verified</div>'
                    : arr.status == "Deny"
                    ? '<div class="text-red-700 hover:font-semibold rounded-md">Denied</div>'
                    : '<div class="text-gray-700 hover:font-semibold rounded-md">Verifying</div>'
                }</div>
            </td>
            <td class="text-center text-sm border border-gray-300 px-4 py-2">
              ${arr.date_created}
            </td>
          </tr>
            `
      )
      .join("");

    const mobileTable = data
      .map(
        (arr) => `
    <tr class="border-b">
      <td colspan="5" class="p-3">
        <div class="flex flex-col gap-4 text-sm">
          
          <!-- Header Row -->
          <div class="grid grid-cols-3 gap-2">
            <div>
              <p class="text-gray-500">ID</p>
              <p class="font-semibold">${arr.user_payment_id}</p>
            </div>
            <div>
              <p class="text-gray-500">Trainee</p>
              <p class="font-semibold">${arr.user_id} – ${arr.user_name}</p>
            </div>
            <div>
              <p class="text-gray-500">Method</p>
              <p class="font-semibold">${arr.payment_method}</p>
            </div>
          </div>

          <!-- Payment Info Row -->
          <div class="grid grid-cols-3 gap-2">
            <div>
              <p class="text-gray-500">Account Name</p>
              <p>${arr.account_name}</p>
            </div>
            <div>
              <p class="text-gray-500">Amount</p>
              <p class="font-medium">${arr.amount}</p>
            </div>
            <div>
              <p class="text-gray-500">Date</p>
              <p>${arr.date_created}</p>
            </div>
          </div>

          <!-- Receipt & Status Row -->
          <div class="flex justify-between items-center">
            <div>
              ${
                arr.screenshot_receipt
                  ? `<a href="javascript:void(0);" class="text-blue-600 hover:underline view-btn" 
                        data-id="${arr.user_payment_id}" 
                        data-file='${arr.screenshot_receipt.data}' 
                        data-file-type="image/jpeg">
                      <img src="/account/f-assets/solid/icons_for_buttons/photograph.svg" class="w-5 h-5 inline-block" />
                      <span>View Receipt</span>
                    </a>`
                  : `<button data-id="${arr.user_payment_id}" 
                        class="receipt-upload-btn text-yellow-600 hover:underline">
                      <img src="/account/f-assets/solid/icons_for_buttons/upload.svg" class="w-5 h-5 inline-block" />
                      <span>Upload</span>
                    </button>`
              }
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <div class="px-2 py-1 rounded-md text-xs font-medium ${
                arr.status === "Verified"
                  ? "bg-green-100 text-green-700"
                  : arr.status === "Deny"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }">
                ${arr.status}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `
      )
      .join("");

    const tableData = window.innerWidth > 768 ? desktopTable : mobileTable;
    userPaymentTable.innerHTML = `
      <table id="applicants-table" class="w-full border-collapse">
        <thead class="">
          <tr class="text-center hidden md:table-row">
            <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
            <th class="border border-gray-300 px-4 py-2">User ID - Name</th>
            <th class="border border-gray-300 px-4 py-2">Account Name- Amount</th>
            <th class="border border-gray-300 px-4 py-2">Pay Method </th>
            <th class="border border-gray-300 px-4 py-2 w-24">Receipt</th>
            <th class="border border-gray-300 px-4 py-2 w-24">Status</th>
            <th class="border border-gray-300 px-4 py-2 w-28">Date</th>
          </tr>
        </thead>
        <tbody class="">
          ${tableData}
        </tbody>
      </table>
    `;
  }
  allButtons(data);
}

function filterPaymentList(data, id) {
  return data.filter((item) => item.user_payment_id == id);
}
function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.innerHTML = `
    <p class="notification-${type}">${message}</p>
  `;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

function allButtons(data) {
  //Payment upload
  document.querySelectorAll(".receipt-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterPaymentList(data, rowId);
      const result = filteredList[0];

      modalDetails.innerHTML = "";
      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }
      modalDetails.innerHTML = `
          <form id="payment-receipt-upload-form" class="min-w-96">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-4">Upload Photo Receipt of payment: <hr class="border-white"> ${result.account_name}</h3>
                <input type="file" id="screenshot-receipt" name="screenshot-receipt" 
                class="w-full rounded-md text-lg px-1 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-base file:font-semibold file:text-blue-700 hover:file:bg-blue-100 ..."
                accept="image/*" />
            </div>
            <button id="receipt-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
            <div id="error-indicator"></div>
          </form>
        `;
      modal.style.display = "flex";
      const uploadForm = document.getElementById("payment-receipt-upload-form");
      const receiptSubmitbtn = document.getElementById("receipt-submit-button");

      uploadForm.addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();
          const formData = new FormData(uploadForm);

          showBtnLoading(receiptSubmitbtn);

          try {
            const response = await fetch(
              `/account/api/payments/receipt/${rowId}`,
              {
                method: "POST",
                body: formData,
              }
            );
            const responseData = await response.json();
            const notification = document.getElementById("notification");
            if (response.ok) {
              notification.innerHTML = `
                <p class="text-green-700">${responseData.message}</p>
              `;
              notification.style.display = "block"; // Show success notification
              showBtnResult(receiptSubmitbtn, true);
              renderUserPaymentsList();
            } else {
              notification.innerHTML = `
                <p class="text-red-700">${responseData.error}</p>
              `;
              notification.style.display = "block";
              showBtnResult(receiptSubmitbtn, false);
            }

            setTimeout(() => {
              notification.style.display = "none";
            }, 3000);
            modal.style.display = "none";
          } catch (error) {
            console.error("Error uploading Template", error);
            showNotification(
              "An error occurred while uploading Template.",
              "error"
            ); // Show error notification
          }
        },
        { once: true }
      );
    });
  });

  // View receipt
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const payId = this.getAttribute("data-id");
      const picture = filterPaymentList(data, payId);
      const fileData = picture[0].screenshot_receipt;
      const fileType = this.getAttribute("data-file-type");

      openFileViewer({ fileData, fileType, title: `Payment ID #${payId}` });
    });
  });
}

// Call the function to render the payment list
renderUserPaymentsList();
// Close modal when the close button is clicked
spanX.onclick = function () {
  modal.style.display = "none";
};

// Close modal when clicking outside of the modal content
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

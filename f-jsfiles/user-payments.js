//initialize modal elements;
const modal = document.getElementById("myModal");
const spanX = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");
const titleDetails = document.getElementById("title-details");

async function renderUserPaymentsForm() {
  const response = await fetch("/api/user-payments/details-list");
  const paymentMethodSelect = document.getElementById("payment-method");
  const courseSelect = document.getElementById("course-select");

  const data = await response.json();
  const paymentMethods = data.paymentMethods;
  const paymentCourses = data.paymentCourses;

  if (
    !response.ok ||
    !paymentMethods ||
    paymentMethods.length === 0 ||
    paymentCourses.length === 0 ||
    !paymentCourses
  ) {
    modalDetails.innerHTML = `
    <h2 class="text-lg font-semibold">Error</h2>
    <p class="mt-4">Sorry! Can't fetch Payment form details right now. Please try again later.</p>
    <p>Try contacting the admin through the report page</p> 
    `;
    modal.style.display = "flex";
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

  // Add event listeners
  document
    .getElementById("payment-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const accountName = document.getElementById("account-name").value;
      const amount = document.getElementById("amount").value;
      const paymentMethod = document.getElementById("payment-method").value;
      const screenshotReceipt =
        document.getElementById("screenshot-receipt").files[0];
      const courseSelect = document.getElementById("course-select").value;

      const formData = new FormData();
      formData.append("accountName", accountName);
      formData.append("amount", amount);
      formData.append("paymentMethod", paymentMethod);
      formData.append("screenshotReceipt", screenshotReceipt);
      formData.append("courseSelect", courseSelect);

      try {
        const response = await fetch("/api/payment/add", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          titleDetails.innerText = "Error Payment";
          modalDetails.innerText =
            "Sorry! Can't submit payment right now. Please try again later.";
          modal.style.display = "flex";
          return;
        } else {
          titleDetails.innerText = "Success Payment";
          modalDetails.innerText = "Payment Added Successfully!";
          modal.style.display = "flex";
          renderUserPaymentsList(); // Refresh the payment list
          return;
        }
      } catch (error) {
        console.error("Error submitting payment:", error);
        titleDetails.innerText = "Error Payment";
        modalDetails.innerText =
          "Sorry! Can't submit payment right now. Please try again later.";
        modal.style.display = "flex";
      }
    });

  paymentMethodSelect.addEventListener("change", function (event) {
    const selectedOption = this.options[this.selectedIndex];
    const file = selectedOption.getAttribute("data-file");
    if (file) {
      // If file is a base64 string or URL, set it directly
      document.getElementById("payment-method-preview").src = file;
      document.getElementById("payment-method-preview").style.display = "flex";
    } else {
      document.getElementById("payment-method-preview").src = "";
    }
  });
}
renderUserPaymentsForm();

async function renderUserPaymentsList() {
  const tableAnnouncement = document.getElementById("table-announcement");
  const userPaymentTable = document.getElementById("user-payments-table");

  /*
  // fetch user payments from the server
  const response = await fetch("/api/user-payments/list");
  if (!response.ok) {
    tableAnnouncement.innerText = "Sorry! can't fetch data right now";
    return;
  }
  */

  //const data = await response.json();
  const data = [
    {
      user_payment_id: 101,
      user_id: 7,
      user_name: "Reynan Lacson",
      account_name: "Railley Lacson",
      amount: "₱2,500.00",
      payment_method: "GCash",
      screenshot_receipt: {
        data: "sampleImageBase64DataHere", // You can replace this with actual data URI if you want preview
      },
      status: "Verified", // Options: "Verified", "Deny", "Verifying"
      date_created: "2025-07-04 14:35",
    },
    {
      user_payment_id: 102,
      user_id: 7,
      user_name: "Reynan Lacson",
      account_name: "Rainiel LAcson",
      amount: "₱1,200.00",
      payment_method: "Bank Transfer",
      screenshot_receipt: null,
      status: "Verifying",
      date_created: "2025-07-04 14:42",
    },
  ];

  if (data.length === 0) {
    tableAnnouncement.innerText = "No payments found";
    userPaymentTable.innerHTML = `
      <table id="applicants-table" class="w-full border-collapse">
        <thead class="">
          <tr class="text-center">
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
                <a href="javascript:void(0);" class="text-blue-700 hover:underline view-btn" data-id="${
                  arr.user_payment_id
                }" data-file='${JSON.stringify(
                        arr.screenshot_receipt.data
                      )}' data-file-type="image/jpeg">
                  <img src="/f-css/solid/icons_for_buttons/photograph.svg" class="w-6 h-6 reverse-color" />
                </a>
                `
                    : `<button data-id="${arr.user_payment_id}"
                  class="receipt-upload-btn text-yellow-600 rounded-md px-2 hover:underline">
                  <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
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
                        data-file='${JSON.stringify(
                          arr.screenshot_receipt.data
                        )}' 
                        data-file-type="image/jpeg">
                      <img src="/f-css/solid/icons_for_buttons/photograph.svg" class="w-5 h-5 inline-block" />
                      <span>View Receipt</span>
                    </a>`
                  : `<button data-id="${arr.user_payment_id}" 
                        class="receipt-upload-btn text-yellow-600 hover:underline">
                      <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-5 h-5 inline-block" />
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
  allButtons();
}

function allButtons() {
  // View receipt
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const fileData = JSON.parse(this.getAttribute("data-file"));
      const fileType = this.getAttribute("data-file-type");

      const byteArray = new Uint8Array(fileData);
      const blob = new Blob([byteArray], { type: fileType });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank", "width=800,height=600");
      newWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body {
                background-color: black;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              img {
                max-width: 100%;
                max-height: 100%;
              }
            </style>
          </head>
          <body>
            <img src="${url}" alt="payment-receipt" />
          </body>
        </html>
      `);
      newWindow.document.close();

      // Revoke the object URL after the new window has loaded the content
      newWindow.onload = function () {
        URL.revokeObjectURL(url);
      };
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

import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { openFileViewer } from "../utils/file-helper.js";
import {
  showLoadingMessage,
  showOperationResult,
  showBtnLoading,
  showBtnResult,
} from "../utils/modal-feedback.js";

async function renderPaymentList() {
  const response = await fetch("/account/api/payments");

  if (!response.ok) {
    console.error("Failed to fetch data from the server");
    return;
  }

  const data = await response.json();

  const paymentTable = document.getElementById("payments-table");

  paymentTable.innerHTML = `
        <table id="applicants-table"
            class=" w-full text-cwenter text-sm justify-items-start table-fixed border-collapse border-2 border-gray-300">
            <thead class="">
                <tr>
                    <th class="border border-gray-300 px-4 py-2 w-12">ID</th>
                    <th class="border border-gray-300 px-4 py-2">User ID - Name</th>
                    <th class="border border-gray-300 px-4 py-2">Account Name- Amount</th>
                    <th class="border border-gray-300 px-4 py-2 w-32">Pay Method </th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Receipt</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Status</th>
                    <th class="border border-gray-300 px-4 py-2 w-24">Action</th>
                </tr>
            </thead>
            <tbody class="">
                ${data
                  .map(
                    (arr) =>
                      `
                    <tr class="text-left hover:outline outline-1 outline-black">
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
                              <a href="javascript:void(0);" class="text-blue-700 hover:underline view-btn" data-id="${arr.user_payment_id}" 
                              data-file='${arr.screenshot_receipt.data}' data-file-type="image/jpeg">
                                  <img src="/f-css/solid/icons_for_buttons/photograph.svg" class="w-6 h-6 reverse-color" />
                                  </a>
  
                              <button data-id="${arr.user_payment_id}" class="receipt-upload-btn text-yellow-600 rounded-md px-2 hover:underline">
                              <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                              </button>
                               `
                                : `<button data-id="${arr.user_payment_id}" class="receipt-upload-btn text-yellow-600 rounded-md px-2 hover:underline">
                                <img src="/f-css/solid/icons_for_buttons/upload.svg" class="w-6 h-6 reverse-color" />
                                </button>`
                            }
                          </div>
                        </td>
                        <td class="text-center border border-gray-300 px-4 py-2">
                          <button class="request-status-btn hover:outline outline-2 outline-gray-500 rounded-md px-1" data-id="${
                            arr.user_payment_id
                          }">
                          ${
                            arr.status == "Verified"
                              ? '<div class="text-green-700 hover:font-semibold rounded-md hover ">Verified</div>'
                              : arr.status == "Deny"
                              ? '<div class="text-red-700 hover:font-semibold rounded-md">Denied</div>'
                              : '<div class="text-gray-700 hover:font-semibold rounded-md">Verifying</div>'
                          }</button>
                        </td>
                        <td class="border flex flex-row items-center justify-center border-gray-300 px-4 py-2 space-x-2">
                            <button data-id=" ${arr.user_payment_id}  "
                                class="payment-delete-btn bg-rose-500 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white rounded-md p-px">
                                  <img src="/f-css/solid/icons_for_buttons/trash.svg" class="w-6 h-6 reverse-colorII" />
                            </button>
                        </td>
  
                    </tr>
                    `
                  )
                  .join("")}
            </tbody>
        </table>
  
        <div id="myModal" class="fixed inset-0 z-50 items-center justify-center hidden bg-gray-900 bg-opacity-50">
            <div class="relative bg-white rounded-lg shadow-lg min-w-screen-md max-w-screen-md p-6">
                <span
                    class="close absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ">&times;</span>
                <h2 class="text-xl font-semibold">Payment Details</h2>
                <p id="modal-details" class="mt-4">the details</p>
            </div>
        </div>
    `;
  //call the button functions.
  allButtons(data);
}

renderPaymentList();

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
  // Initialize modal and its components
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];
  const modalDetails = document.getElementById("modal-details");

  const modalform = `
    <form id="add-payment-form" class="w-96">
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Name</h3>
        <input type="text" id="account-name" name="accountName" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Name" />
      </div>
      <div class="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div class="input-container w-1/2">
          <h3 class="text-xl font-semibold mb-3">ID</h3>
          <input type="number" id="user-id" name="id" value="0" disable 
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="ID" />
          <p class="info-message text-sm font-normal">This is for the payment paid by client in store that dont have acount, use Search to attach the payment if the client have a account.</p>
        </div>
        <div class="w-1/2">
          <h3 class="text-xl font-semibold mb-3">Amount</h3>
          <input type="number" id="amount" name="amount" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Amount" />
        </div>
      </div>
      <div class="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div class="input-container w-1/3">
          <h3 class="text-xl font-semibold mb-3">CourseId</h3>
          <input type="number" id="course-select" name="courseSelect" value="0"
            class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="ID" />
          <p class="info-message text-sm font-normal">This is for the payment paid by client in store that dont have acount, use Search to attach the payment if the client have a account.</p>
        </div>
        <div class="w-2/3">
          <h3 class="text-xl font-semibold mb-3">Payment Method</h3>
          <select id="payment-method" name="paymentMethod"
            class="w-full outline outline-1 outline-gray-300 border hover:border-blue-500 focus:border-yellow-500 rounded-md text-lg px-1">
            <option value="Cash">Cash</option>
            <option value="E-wallet">E-wallet</option>
            <option value="Card">Card</option>
            <option value="Online Bank">Online Bank</option>
          </select>
        </div>
      </div>
      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-3">Receipt Screenshot</h3>
        <input type="file" id="screenshot-receipt" name="screenshotReceipt" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" accept="image/*" />
      </div>
      <button id="payment-submit-button" type="submit" class="bg-blue-800 text-white rounded-md px-2">Submit</button>
    </form>
      `;

  // Add Payment Logs
  // Event listener for the add payment button
  document
    .getElementById("add-payment-button")
    .addEventListener("click", (event) => {
      event.preventDefault();

      modalDetails.innerHTML = modalform;
      modal.style.display = "flex";
      const paymentSumbitBtn = document.getElementById("payment-submit-button");

      // Event listener for the form submission
      document
        .getElementById("add-payment-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(event.target);
          const encrypting = await encryptData(formData);
          showBtnLoading(paymentSumbitBtn);

          try {
            const response = await fetch("/account/api/payment/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
            });
            if (response.ok) {
              showBtnResult(paymentSumbitBtn, true);
              alert("Payment Added Successfully!");
              renderPaymentList(); // Refresh the payment list
            } else {
              showBtnResult(paymentSumbitBtn, false);
              alert("Can't add Payment right now!");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Internal Server error", error);
            alert("Internal Server error");
          }
        });
    });

  //Payment upload
  document.querySelectorAll(".receipt-upload-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");
      const filteredList = filterPaymentList(data, rowId);
      const result = filteredList[0];

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
          </form>
        `;
      modal.style.display = "flex";

      const receiptSubmitBtn = document.getElementById("receipt-submit-button");

      document
        .getElementById("payment-receipt-upload-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = document.getElementById("screenshot-receipt").files[0];
          const formData = new FormData();
          formData.append("screenshot-receipt", file);
          showBtnLoading(receiptSubmitBtn);

          try {
            const response = await fetch(`/account/api/payments/receipt/${rowId}`, {
              method: "POST",
              body: formData,
            });
            const responseData = await response.json();
            const notification = document.getElementById("notification");
            if (response.ok) {
              showBtnResult(receiptSubmitBtn, true);
              notification.innerHTML = `
              <p class="text-green-700">${responseData.message}</p>
              `;
              notification.style.display = "block"; // Show success notification
              renderPaymentList();
            } else {
              showBtnResult(receiptSubmitBtn, false);
              notification.innerHTML = `
                <p class="text-red-700">${responseData.error}</p>
              `;
              notification.style.display = "block";
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
        });
    });
  });

  // View for payment receipt
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const dataId = this.getAttribute("data-id");
      const fileData = this.getAttribute("data-file");
      const fileType = this.getAttribute("data-file-type");

      openFileViewer({ fileData, fileType, title: `Payment ID #${dataId}` });
    });
  });

  //Status change for payment verification
  document.querySelectorAll(".request-status-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const rowId = this.getAttribute("data-id");

      if (!rowId) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }
      const filteredList = filterPaymentList(data, rowId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
        <p>Are you sure you want to Change the Status of ID #${rowId}?</p>
        <p>Account Name: ${result.account_name} </p>
        <div class="justify-self-end space-x-4 mt-5">
          <button id="status-yes" value="Verified" class="bg-blue-700 hover:bg-gradient-to-t from-sky-400 to-sky-800 text-white text-lg rounded-md px-2">Verify</button>
          <button id="status-no" value="Denied" class="bg-rose-700 hover:bg-gradient-to-t from-rose-400 to-rose-800 text-white text-lg rounded-md px-2">Deny</button>
        </div>
      `;
      modal.style.display = "flex";

      const statusYes = document.getElementById("status-yes");
      statusYes.addEventListener("click", async function () {
        try {
          const status = this.value;
          const paymentId = rowId;
          showBtnLoading(statusYes);
          const response = await fetch(`/account/api/payments`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, status }),
          });
          if (response.ok) {
            showBtnResult(statusYes, true);
            alert(`Successfully Changed status for ID no. ${rowId}`);
            renderPaymentList();
          } else {
            showBtnResult(statusYes, false);
            alert(`Can't Change status ID no. ${rowId}`);
          }
          modal.style.display = "none";
        } catch (error) {
          console.error("Error deleting payment data", error);
          alert("An error occurred while deleting the payment.");
          modal.style.display = "none";
        }
      });

      document.getElementById("status-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });

  // Delete Payment
  document.querySelectorAll(".payment-delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const rowId = this.getAttribute("data-id");
      if (!rowId) {
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }

      const filteredList = filterPaymentList(data, rowId);
      const result = filteredList[0];

      modalDetails.innerHTML = `
      <p id="delete-token-indicator" class="text-sm animate-pulse text-gray-500">fetching delete token...</p>
      <p>Are you sure you want to delete Payment ID #${rowId}?</p>
      <p>Account Name: ${result.account_name}</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-blue-700 text-white rounded-md px-2" disabled>Yes</button>
        <button id="delete-no" class="bg-rose-700 text-white rounded-md px-2">No</button>
      </div>
    `;
      modal.style.display = "flex";

      const tokenIndicator = document.getElementById("delete-token-indicator");
      const response = await fetch("/account/api/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rowId,
          path: `/account/api/payments/delete/${rowId}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        tokenIndicator.innerText =
          data.error || "Failed to fetch delete token.";
        tokenIndicator.classList.add("text-red-600");
      } else {
        tokenIndicator.innerText = "token available";
        tokenIndicator.classList.add("text-green-600");

        const deleteYes = document.getElementById("delete-yes");
        deleteYes.disabled = false;
        deleteYes.addEventListener(
          "click",
          async () => {
            try {
              const response = await fetch(`/account/api/payments/delete/${rowId}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "x-delete-token": data.deleteToken,
                },
              });
              const result = await response.json();
              if (response.ok && result.success) {
                tokenIndicator.innerText = `Successfully Deleted Payment ID #${rowId}`;
                renderPaymentList();
              } else {
                tokenIndicator.innerText = `Can't Delete Payment ID #${rowId}`;
                tokenIndicator.classList.add("text-red-600");
              }
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            } catch (error) {
              console.error("Error deleting payment data", error);
              tokenIndicator.innerText = "An error occurred while deleting.";
              tokenIndicator.classList.add("text-red-600");
              setTimeout(() => {
                modal.style.display = "none";
              }, 3000);
            }
          },
          { once: true }
        );
      }

      tokenIndicator.classList.remove("animate-pulse");
      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

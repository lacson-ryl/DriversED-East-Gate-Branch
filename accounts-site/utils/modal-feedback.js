// modalFeedback.js

export function showLoadingMessage(
  modal,
  message = "Processing, please wait..."
) {
  modal.innerHTML = "";
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-4">
      <div class="ease-linear rounded-full border-4 border-t-4 border-t-blue-500 border-gray-200 h-12 w-12 animate-spin-slow"></div>
      <p class="text-gray-600 text-sm">${message}</p>
    </div>
  `;
}

export function showOperationResult(modal, success, message) {
  modal.innerHTML = "";
  modal.innerHTML = `
    <div class="text-center space-y-4">
      <p class="${success ? "text-green-600" : "text-red-600"} font-semibold">
        ${message}
      </p>
      <button class="bg-blue-700 text-white px-4 py-2 rounded-md" onclick="document.getElementById('myModal').style.display='none'">
        Close
      </button>
    </div>
  `;
}

export function showBtnLoading(button) {
  button.innerText = "Processing...";
  button.classList.add("animate-pulse");
  button.disabled = true;
}

export function showBtnResult(button, success) {
  button.innerText = success ? "Success" : "Failed";
  button.classList.add(success ? "text-green-600" : "text-red-600");
  button.classList.remove("animate-pulse");
  button.disabled = false;
}

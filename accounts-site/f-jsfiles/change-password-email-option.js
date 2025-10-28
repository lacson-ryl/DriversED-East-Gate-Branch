const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");
const changeableCard = document.getElementById("changeable-card");

function checkGoogleVerificationStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");

  if (success === "true") {
    // Render the password change form
    renderChangePasswordForm();
  } else {
    const error = urlParams.get("error");
    if (error) {
      alert(`Error: ${error}`);
    }
  }
}

checkGoogleVerificationStatus();

function renderChangePasswordEmailOption() {
  const inputSearchCard = document.getElementById("input-search-card");
  const changePassOrEmailOptionCard = document.getElementById(
    "change-password-option-card"
  );
  const searchResultCard = document.getElementById("search-result-card");
  const captchaSiteKey = document.getElementById("captchaSiteKey").value;

  document
    .getElementById("change-email-btn")
    .addEventListener("click", (event) => {
      event.preventDefault();
      inputSearchCard.innerHTML = `
        <label for="email" class="block text-gray-700 font-semibold mb-2">Search PRN for change email</label>
        <form id="user-search-form-email" class="flex flex-col gap-4">
            <input type="number" id="prn" name="prn" 
            class="py-2 px-3 outline outline-2 outline-gray-500 rounded-md"
                placeholder="exclude any symbols and spaces" required />
            <div id="recaptcha-container-email"></div>
            <button class="bg-blue-800 rounded-md hover:outline outline-2 outline-offset-2 outline-blue-800">
            <p id="changeable-text-in-btn" class="text-white rounded-md font-medium">Submit</p>
            </button>
        </form>
    `;
      inputSearchCard.style.display = "flex";

      // Render the reCAPTCHA widget dynamically
      grecaptcha.render("recaptcha-container-email", {
        sitekey: captchaSiteKey,
      });
    });

  document
    .getElementById("change-password-btn")
    .addEventListener("click", (event) => {
      event.preventDefault();
      inputSearchCard.innerHTML = `
        <label for="email" class="block text-gray-700 font-semibold mb-2">Search Email for change password</label>
        <form id="user-search-form-password" class="flex flex-col gap-4">
            <input type="text" id="email" name="email" 
            class="py-2 px-3 outline outline-2 outline-gray-500 rounded-md"
                placeholder="abcdfgh@email.com" required />
            <div id="recaptcha-container-password"></div>
            <button class="bg-blue-800 rounded-md hover:outline outline-2 outline-offset-2 outline-blue-800">
            <p id="changeable-text-in-btn" class="text-white rounded-md font-medium">Submit</p>
            </button>
        </form>
    `;
      inputSearchCard.style.display = "flex";

      // Render the reCAPTCHA widget dynamically
      grecaptcha.render("recaptcha-container-password", {
        sitekey: captchaSiteKey,
      });
    });

  // Handle form submissions
  document.addEventListener("submit", async (event) => {
    event.preventDefault();
    const clickedIndicator = document.getElementById("changeable-text-in-btn");
    clickedIndicator.innerText = "Loading...";
    clickedIndicator.classList.add(
      "disabled",
      "cursor-not-allowed",
      "animate-pulse"
    );
    const form = event.target;
    const formData = new FormData(form);

    // Get the reCAPTCHA token
    const recaptchaResponse = form.querySelector(".g-recaptcha-response").value;
    formData.append("recaptchaToken", recaptchaResponse);

    const data = Object.fromEntries(formData.entries());
    const type = form.id === "user-search-form-password" ? "password" : "email";

    try {
      const response = await fetch(
        `/account/api/change-password-email-option/email-search/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        modalDetails.innerText = "Sorry, can't find user using your Email.";
        modal.style.display = "flex";
        clickedIndicator.innerText = "Submit";
        clickedIndicator.classList.remove(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        return;
      }

      const profile = await response.json();
      console.log(profile);
      renderSearchResult(profile, type);
      clickedIndicator.classList.remove("animate-pulse", "bg-blue-800");
      clickedIndicator.innerText = "Success";
      clickedIndicator.classList.add("bg-green-600");
    } catch (error) {
      console.error("Error during form submission:", error);
      alert("Internal Server Error. Please try again later.");
    }
  });

  function renderSearchResult(profile, type) {
    // Clear previous content
    searchResultCard.innerHTML = "";

    let profilePic = "";
    if (profile.profile_picture !== null) {
      const binary = new Uint8Array(profile.profile_picture.data || []);
      const base64String = btoa(
        binary.reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      profilePic = `data:image/png;base64,${base64String}`;
    } else {
      profilePic = "/account/f-assets/solid/black/user.svg";
    }

    // Render the profile card based on the type
    if (type === "password" || type === "email") {
      searchResultCard.innerHTML = `
                <div id="editable-card-for-change-${type}" class="bg-white p-10 rounded-lg items-center shadow-md max-w-md">
                    <h1 class="text-2xl font-bold mb-5 text-yellow-600 text-center">Is this you?</h1>
                    <div class="w-full flex space-x-3 mt-5">
                        <div class="content-center">
                            <div id="profile-pic" class="">
                                <img src="${profilePic}"
                                    class="outline outline-2 outline-gray-500 max-w-20 max-h-24 rounded-full shadow-md shadow-current" />
                            </div>
                        </div>
                        <div class="gap-x-4 text-lg">
                            <h1>${profile.name}</h1>
                            <h2>${profile.email}</h2>
                            <p>${profile.date_created}</p>
                        </div>
                    </div>
                    <div class="mt-6 place-self-center space-x-5">
                        <button id="confirm-btn"
                            class="outline rounded-full bg-blue-500 text-white px-3 py-2 hover:outline-offset-2 hover:outline-2 hover:outline-blue-500">Yes,
                            that's me!</button>
                        <button id="reject-btn"
                            class="outline outline-1 rounded-full bg-red-500 text-white px-3 py-2 hover:outline-offset-2 hover:outline-2 hover:outline-red-500">No,
                            It's not me.</button>
                    </div>
                </div>
            `;
      buttonsWithinTheProfileCard();
      return;
    } else {
      return (searchResultCard.innerHTML = `
                <div id="editable-card" class="bg-white p-10 rounded-lg shadow-md max-w-md">
                    <h1 class="text-2xl font-bold mb-5 text-yellow-600 text-center">Sorry! We can't find you in our database.</h1>
                </div>
            `);
    }

    function buttonsWithinTheProfileCard() {
      // Add event listener for the confirm button
      const confirmBtn = document.getElementById("confirm-btn");
      const rejectBtn = document.getElementById("reject-btn");

      confirmBtn.addEventListener("click", async () => {
        modalDetails.innerText = `generating the options for you`;
        modal.style.display = "flex";
        // Redirect to the appropriate page after the request is successful
        setTimeout(() => {
          modal.style.display = "none";
          renderChangePasswordEmailForms(profile, type);
        }, 4000);
      });

      // Add event listener for the reject button
      rejectBtn.addEventListener("click", () => {
        searchResultCard.innerHTML = `
            <div id="editable-card" class="bg-white py-5 px-9 rounded-lg shadow-md max-w-md">
                <h1 class="text-base font-semibold text-black text-left w-72">Please try again searching for your email.
                If you can't find it, try requesting it from the admin with your credentials (ID or proof of identity).</h1>
            </div>
         `;
      });
    }
  }
}

renderChangePasswordEmailOption();

function renderChangePasswordEmailForms(profile, type) {
  let profilePic = "";
  if (profile.profile_picture !== null) {
    const binary = new Uint8Array(profile.profile_picture.data || []);
    const base64String = btoa(
      binary.reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    profilePic = `data:image/png;base64,${base64String}`;
  } else {
    profilePic = "/account/f-assets/solid/black/user.svg";
  }

  if (type === "password") {
    // Render options for password change
    changeableCard.innerHTML = `
      <div class="flex flex-row bg-white p-10 rounded-lg shadow-md text-left gap-4">
          <div id="editable-options-form-card" class="max-w-72 gap-4">
              <h1 class="text-xl font-bold mb-5 text-yellow-600 text-center">Choose one</h1>
              <button id="google-verification-btn"
                  class="bg-red-600 hover:bg-red-700 mb-1 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Login with Google</button>
              <p class="text-left indent-3">Make sure the chosen email is identical to the profile</p>
              <button id="get-code"
                  class="mt-4 mb-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Verification Code</button>
              <p class="text-left indent-3">We'll send a verification code to the email in the profile</p>
          </div>
      </div>
      <div id="search-result-card">
          <div id="editable-card"
              class="bg-white py-10 pr-10 rounded-lg rounded-l-none shadow-md max-w-md">
              <div class="w-full flex items-center space-x-4 mt-5">
                  <div class="">
                      <div id="profile-pic" class="">
                          <img src="${profilePic}"
                              class="outline outline-2 outline-gray-500 max-w-20 max-h-24 rounded-full shadow-md shadow-current p-1 pb-2" />
                      </div>
                  </div>
                  <div class="gap-x-4 text-lg">
                      <h1>${profile.name}</h1>
                      <h2>${profile.email}</h2>
                      <p>${profile.date_created}</p>
                  </div>
              </div>
          </div>
      </div>
    `;

    const googleVerificationBtn = document.getElementById(
      "google-verification-btn"
    );
    if (googleVerificationBtn) {
      googleVerificationBtn.addEventListener("click", (event) => {
        event.preventDefault();
        // Redirect the browser to the Google OAuth endpoint
        window.location.href = "/auth/google/change-password";
      });
    }

    const getCodeBtn = document.getElementById("get-code");
    if (getCodeBtn) {
      console.log("Attaching event listener to Get Code Button...");
      getCodeBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        modalDetails.innerText = `Sending the verification code to your email`;
        modal.style.display = "flex";
        const response = await fetch(
          "/account/api/change-password-email-option/send-code",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: profile.id,
              email: profile.email,
              type: type,
            }),
          }
        );
        if (!response.ok) {
          modalDetails.innerText = "Sorry, can't send the verification code.";
          modal.style.display = "flex";
          setTimeout(() => {
            modal.style.display = "none";
          }, 4000);
          return;
        }
        modalDetails.innerText = `Verification code sent to your email`;

        setTimeout(() => {
          modal.style.display = "none";
        }, 4000);

        renderChangePasswordFormWithOTP();
      });
    }
  } else if (type === "email") {
    // Render form for email change
    changeableCard.innerHTML = `
      <div class="bg-white p-10 rounded-lg shadow-md max-w-md">
        <h1 class="text-2xl font-bold mb-3 text-red-600 text-center">Change Email</h1>
        <p id="message-box" class="hidden mb-5 text-base"></p>
        <form id="change-email-form" class="flex flex-col gap-4">
            <label for="new-email" class="block text-gray-700 font-semibold">New Email</label>
            <input type="email" id="new-email" name="new-email" placeholder="Enter new email"
                class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2"
                required />
            <div id="button-container" class="flex flex-col gap-4">
                <button id="submit-button" type="submit"
                    class="bg-blue-500 text-yellow-200 font-semibold rounded-md px-3 py-2 hover:bg-blue-600">Send Verification Code</button>
            </div>
        </form>
      </div>
    `;

    const form = document.getElementById("change-email-form");
    const messageBox = document.getElementById("message-box");
    const buttonContainer = document.getElementById("button-container");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newEmail = document.getElementById("new-email").value;

      // Disable the submit button while processing
      const submitButton = document.getElementById("submit-button");
      submitButton.innerText = "Sending...";
      submitButton.disabled = true;

      try {
        const response = await fetch(
          "/account/api/change-password-email-option/send-code",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: profile.id,
              email: newEmail,
              type: "email",
            }),
          }
        );

        if (response.ok) {
          messageBox.innerText = "Verification code sent to your email!";
          messageBox.classList.remove("hidden");
          messageBox.classList.add("text-green-500");

          // Replace the submit button with "Send Code Again" and show "Proceed" button
          buttonContainer.innerHTML = `
            <button id="send-code-again-button"
                class="bg-yellow-500 text-white font-semibold rounded-md px-3 py-2 hover:bg-yellow-600">Send Code Again</button>
            <button id="proceed-button"
                class="bg-green-500 text-white font-semibold rounded-md px-3 py-2 hover:bg-green-600">Proceed</button>
          `;

          // Add event listener for "Send Code Again" button
          const sendCodeAgainButton = document.getElementById(
            "send-code-again-button"
          );
          sendCodeAgainButton.addEventListener("click", async (event) => {
            event.preventDefault();
            sendCodeAgainButton.innerText = "Sending...";
            sendCodeAgainButton.disabled = true;

            try {
              const resendResponse = await fetch(
                "/account/api/change-password-email-option/send-code",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: profile.id,
                    email: newEmail,
                    type: "email",
                  }),
                }
              );

              if (resendResponse.ok) {
                messageBox.innerText = "Verification code sent again!";
                messageBox.classList.remove("hidden");
                messageBox.classList.add("text-green-500");
              } else {
                const errorData = await resendResponse.json();
                messageBox.innerText = `Error: ${errorData.error}`;
                messageBox.classList.remove("hidden");
                messageBox.classList.add("text-red-500");
              }
            } catch (error) {
              console.error("Error resending verification code:", error);
              alert("An error occurred. Please try again.");
            } finally {
              sendCodeAgainButton.innerText = "Send Code Again";
              sendCodeAgainButton.disabled = false;
            }
          });

          // Add event listener for "Proceed" button
          const proceedButton = document.getElementById("proceed-button");
          proceedButton.addEventListener("click", () => {
            renderChangeEmailFormWithOTP();
          });
        } else {
          const errorData = await response.json();
          messageBox.innerText = `Error: ${errorData.error}`;
          messageBox.classList.remove("hidden");
          messageBox.classList.add("text-red-500");
        }
      } catch (error) {
        console.error("Error sending verification code:", error);
        alert("An error occurred. Please try again.");
      } finally {
        submitButton.innerText = "Send Verification Code";
        submitButton.disabled = false;
      }
    });
  }
}

function renderChangePasswordForm() {
  const formCard = document.getElementById("change-password-option-card");
  formCard.innerHTML = `
      <div class="bg-white rounded-lg shadow-md max-w-md">
        <h1 class="text-2xl font-bold mb-3 text-red-600 text-center">Change Password</h1>
        <p id="message-box" class="hidden mb-5 text-base"></p>
            <form id="change-password-form" class="flex flex-col gap-4">
                <label for="new-password" class="block text-gray-700 font-semibold">New Password</label>
                <input type="password" id="new-password" name="new-password"  placeholder="Enter New Password"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2"
                    required />
                <label for="new-password-check" class="block mt-2 text-gray-700 font-semibold">Re enter your Password</label>
                <input type="password" id="new-password-check" name="new-password-check"  placeholder="Enter Password again"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2" required />
                <button id="change-password-form-button"  type="submit"
                    class="bg-blue-500 text-yellow-200 font-semibold rounded-md px-3 py-2 hover:bg-blue-600">Update
                    Password</button>
            </form>
      </div>
    `;

  const form = document.getElementById("change-password-form");
  const messageBox = document.getElementById("message-box");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const changePasswordFormButton = document.getElementById(
      "change-password-form-button"
    );
    changePasswordFormButton.innerText = "Updating...";
    changePasswordFormButton.classList.add(
      "cursor-not-allowed",
      "animate-pulse"
    );
    const newPassword = document.getElementById("new-password").value;
    const newPasswordCheck =
      document.getElementById("new-password-check").value;

    if (newPassword !== newPasswordCheck) {
      messageBox.innerText = "Passwords do not match!";
      messageBox.classList.remove("hidden");
      messageBox.classList.add("text-red-500");

      setTimeout(() => {
        messageBox.classList.add("hidden");
        messageBox.classList.remove("text-red-500");
        messageBox.innerText = "";
      }, 4000);
      return;
    }

    try {
      const response = await fetch("/account/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        messageBox.innerText = "Password updated successfully!";
        messageBox.classList.remove("hidden");
        messageBox.classList.add("text-green-500");

        setTimeout(() => {
          window.location.href = "/account/user-login"; // Redirect to login page
        }, 4000);
        return;
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("An error occurred. Please try again.");
    }
  });
}

function renderChangePasswordFormWithOTP() {
  changeableCard.innerHTML = `
      <div class="bg-white p-10 rounded-lg shadow-md max-w-md">
        <h1 class="text-2xl font-bold mb-3 text-red-600 text-center">Change Password</h1>
        <p id="message-box" class="hidden mb-5 text-base"></p>
            <form id="change-password-form" class="flex flex-col gap-4">
                <label for="new-password" class="block text-gray-700 font-semibold">New Password</label>
                <input type="password" id="new-password" name="new-password" placeholder="Enter password"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2"
                    required />
                <label for="new-password-check" class="block mt-2 text-gray-700 font-semibold">Re enter your Password</label>
                <input type="password" id="new-password-check" name="new-password-check" placeholder="Enter password again"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2" required />
                <label for="otp-number" class="block mt-2 text-gray-700 font-semibold">OTP</label>
                <input type="number" id="otp-number" name="otp-number" placeholder="Enter OTP"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2" required />
                <button type="submit"
                    class="bg-blue-500 text-yellow-200 font-semibold rounded-md px-3 py-2 hover:bg-blue-600">Update
                    Password</button>
            </form>
      </div>
    `;

  const form = document.getElementById("change-password-form");
  const messageBox = document.getElementById("message-box");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPassword = document.getElementById("new-password").value;
    const newPasswordCheck =
      document.getElementById("new-password-check").value;
    const otp = document.getElementById("otp-number").value;

    if (newPassword !== newPasswordCheck) {
      messageBox.innerText = "Passwords do not match!";
      messageBox.classList.remove("hidden");
      messageBox.classList.add("text-red-500");

      setTimeout(() => {
        messageBox.classList.add("hidden");
        messageBox.classList.remove("text-red-500");
        messageBox.innerText = "";
      }, 4000);
      return;
    }

    try {
      const response = await fetch("/account/api/change-password-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, otp }),
      });

      if (response.ok) {
        messageBox.innerText = "Password updated successfully!";
        messageBox.classList.remove("hidden");
        messageBox.classList.add("text-green-500");

        setTimeout(() => {
          window.location.href = "/account/user-login"; // Redirect to login page
        }, 4000);
        return;
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("An error occurred. Please try again.");
    }
  });
}

function renderChangeEmailFormWithOTP() {
  changeableCard.innerHTML = `
      <div class="bg-white p-10 rounded-lg shadow-md max-w-md">
        <h1 class="text-2xl font-bold mb-3 text-red-600 text-center">Change Email</h1>
        <p id="message-box" class="hidden mb-5 text-base"></p>
            <form id="change-email-form" class="flex flex-col gap-4">
                <label for="old-email" class="block mt-2 text-gray-700 font-semibold">Enter Old Email</label>
                <input type="email" id="old-email" name="old-email" placeholder="Enter email again"
                  class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2" required />
                <label for="new-email" class="block text-gray-700 font-semibold">New Email</label>
                <input type="email" id="new-email" name="new-email" placeholder="Enter email"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2"
                    required />
                <label for="otp-number" class="block mt-2 text-gray-700 font-semibold">OTP</label>
                <input type="number" id="otp-number" name="otp-number" placeholder="Enter OTP"
                    class="outline outline-2 outline-gray-500 focus:outline-blue-500 focus:outline-4 hover:outline-blue-500 hover:outline-4 rounded-md px-3 py-2" required />
                <button type="submit"
                    class="bg-blue-500 text-yellow-200 font-semibold rounded-md px-3 py-2 hover:bg-blue-600">Update
                    Email</button>
            </form>
      </div>
    `;

  const form = document.getElementById("change-email-form");
  const messageBox = document.getElementById("message-box");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const oldEmail = document.getElementById("old-email").value;
    const newEmail = document.getElementById("new-email").value;
    const otp = document.getElementById("otp-number").value;

    try {
      const response = await fetch("/account/api/change-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldEmail, newEmail, otp }),
      });

      if (response.ok) {
        messageBox.innerText = "Email updated successfully!";
        messageBox.classList.remove("hidden");
        messageBox.classList.add("text-green-500");

        setTimeout(() => {
          window.location.href = "/account/user-login"; // Redirect to login page
        }, 4000);
        return;
      } else {
        const errorData = await response.json();
        messageBox.innerText = `Error: ${errorData.error}`;
        messageBox.classList.remove("hidden");
        messageBox.classList.add("text-red-500");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("An error occurred. Please try again.");
    }
  });
}

// Close modal
span.onclick = function () {
  modal.style.display = "none";
};

// Close modal when clicking outside of it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

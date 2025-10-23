import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";
import { showBtnLoading, showBtnResult } from "../utils/modal-feedback.js";

async function renderDetails() {
  const response = await fetch(`/account/api/user-profile`);
  const encrypted = await response.json();
  const data = await decryptData(encrypted.encrypted);
  const profileDisplay = document.getElementById("profile-display");

  if (!data.userProfileDetails) {
    profileDisplay.innerHTML = `
<div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
        <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
        <form id="profile-form" enctype="multipart/form-data" class="w-full">
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="w-full md:w-1/3">
                    <label>First Name</label>
                    <input id="first-name" name="firstName" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="w-full md:w-1/3">
                    <label>Middle Name</label>
                    <input id="middle-name" name="middleName" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="w-full md:w-1/3">
                    <label>Last Name</label>
                    <input id="last-name" name="lastName" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="">
                    <label>Phone Number</label>
                    <input id="phone-number" name="phoneNumber" type="number"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="">
                    <label>Email</label>
                    <input id="email" name="email" type="email"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="w-full md:w-1/5">
                    <label>Age</label>
                    <p id="age" 
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-500 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                    set in birthdate
                    </p>
                </div>
                <div class="w-full md:w-2/5">
                    <label>Birth Date <span class="text-xs font-light">dd/mm/yyyy</span></label>
                    <input id="birth-date" name="birthDate" type="date" 
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="w-full md:w-2/5">
                    <label>Nationality</label>
                    <input id="nationality" name="nationality" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="flex flex-col">
                    <label>Gender</label>
                    <select id="gender" name="gender"
                        class="shadow-md bg-white border rounded md:min-w-32 w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="LGBTQ">LGBTQ</option>
                    </select>
                </div>
                <div>
                    <label>Civil Status</label>
                    <input id="civil-status" name="civilStatus" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
            <div class="mb-4">
                <label>Address</label>
                <textarea id="address" name="address" type="textbox"
                    class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"></textarea>
            </div>
            <div class="mb-4">
                <label>LTO Client ID</label>
                <input id="lto-client-id" name="ltoClientId" type="text"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"></textarea>
            </div>

            <div class="flex flex-col md:flex-row gap-2 mb-4">
              <div class="w-1/3">
                <img id="government-id-preview"
                  class="w-48 h-32 inline-block rounded-md border-2 content-center border-gray-300 object-fill"
                  src="../account/f-assets/solid/black/identification.svg" alt="Government ID Preview">
              </div>
              <div class="flex flex-col w-2/3 gap-5">
                  <input id="id-type" name="identification_card" style="min-height: 2.5rem;" type="text"
                  placeholder="Ex.  National ID"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                  <input type="file" id="government-id-input" name="identification_card_picture" accept="image/*"
                  class="text-sm text-gray-600">
                  <div class="flex flex-col md:flex-row items-center gap-3">
                      <label for="id-prn" class="">PRN</label>
                      <input id="lto-client-id" name="ltoClientId" placeholder="exclude the spaces and dashes"
                        style="min-height: 2.5rem;" type="number"
                          class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                  </div>
              </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-4 items-center mb-4">
                <img id="profile-picture-preview"
                    class="w-48 h-32 rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                    src="" alt="Profile Picture Preview">
                <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*"
                    class="text-sm text-gray-600">
            </div>

            <button id="submit-request-btn"
                class="bg-sky-900 hover:bg-red-600 m-auto text-white font-bold mt-5 py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                type="submit" value="submit-request">
                Submit
            </button>

        </form>

    </div>
`;
    document
      .getElementById("birth-date")
      .addEventListener("input", function () {
        const ageElem = document.getElementById("age");
        if (this.value) {
          ageElem.innerText = Math.floor(
            (new Date() - new Date(this.value)) / (1000 * 60 * 60 * 24 * 365.25)
          );
        } else {
          ageElem.innerText = "";
        }
      });

    const profileSubmitBtn = document.getElementById("submit-request-btn");

    const form = document.getElementById("profile-form");
    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const encrypted = await encryptData(formData);

        showBtnLoading(profileSubmitBtn);

        try {
          const response = await fetch("/account/api/user-profile-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
          });
          if (response.ok) {
            showBtnResult(profileSubmitBtn, true);
            alert("Profile submitted successfully!");
            setTimeout(() => {
              window.location.href = "/account/user-profile";
            }, 3000);
          } else {
            showBtnResult(profileSubmitBtn, false);
            alert("Failed to submit profile. Please try again later!");
          }
        } catch (error) {
          console.error("Error submitting profile:", error);
          alert("An error occurred while submitting the profile.");
        }
      },
      { once: true }
    );
  } else {
    const profile = data.userProfileDetails;

    profileDisplay.innerHTML = `
    <div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
    <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
    <form id="edit-profile-form" enctype="multipart/form-data" class="w-full">
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="w-full md:w-1/3">
                <label>First Name</label>
                <input id="first-name" name="firstName" type="text" value="${
                  profile.first_name ? profile.first_name : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="w-full md:w-1/3">
                <label>Middle Name</label>
                <input id="middle-name" name="middleName" style="min-height: 2.5rem;"
                    value="${profile.middle_name}"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="w-full md:w-1/3">
                <label>Last Name</label>
                <input id="last-name" name="lastName" type="text"  value="${
                  profile.last_name ? profile.last_name : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
        </div>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="">
                <label>Phone Number</label>
                <input id="phone-number" name="phoneNumber" type="number" value="${
                  profile.phone_number ? profile.phone_number : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="">
                <label>Email</label>
                <input id="email" name="email" type="email" value="${
                  profile.email ? profile.email : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
        </div>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="w-full md:w-1/2">
              <label>Age</label>
              <p id="age" name="age" style="min-height: 2.5rem;" type="Number"
                  class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                  ${profile.age}
              </p>
            </div>
            <div class="w-full md:w-1/3">
                <label>Birth Date <span class="text-xs font-light">dd/mm/yyyy</span></label>
                <input id="birth-date" name="birthDate" type="date" value="${
                  profile.birth_date ? profile.birth_date : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="w-full md:w-1/3">
                <label>Nationality</label>
                <input id="nationality" name="nationality" type="text" value="${
                  profile.nationality ? profile.nationality : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
        </div>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
          <div class="w-full md:w-1/2">
            <label>Gender</label>
            <select id="gender" name="gender"
              class="shadow-md bg-white border rounded md:min-w-32 w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
              <option value="Male" ${
                profile.gender === "Male" ? "selected" : ""
              }>Male</option>
              <option value="Female" ${
                profile.gender === "Female" ? "selected" : ""
              }>Female</option>
              <option value="LGBTQ" ${
                profile.gender === "LGBTQ" ? "selected" : ""
              }>LGBTQ</option>
            </select>
          </div>
          <div class="w-full md:w-1/2">
              <label>Civil Status</label>
              <input id="civil-status" name="civilStatus" style="min-height: 2.5rem;" type="text"
                    value="${profile.civil_status}"
                  class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
          </div>
        </div>
        <div class="mb-4">
            <label>Address</label>
            <textarea id="address" name="address" type="textbox"
                class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">${
                  profile.address ? profile.address : ""
                }</textarea>
        </div>
        
        <div class="mb-5">
            <label>LTO Client ID</label>
            <input id="lto-client-id" name="ltoClientId" style="min-height: 2.5rem;" type="text"
                value="${profile.lto_client_id}"
            class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
        </div>
        
        <div class="flex flex-col md:flex-row gap-2 mb-4">
            <div class="w-1/3">
              <img id="government-id-preview"
                  class="w-48 h-32 rounded-md border-2 content-center border-gray-300 object-fill"
                  src="${
                    profile.indentification_card_picture ||
                    "../account/f-assets/solid/black/identification.svg"
                  }" alt="Government ID Preview">
            </div>
            <div class="flex flex-col w-2/3 gap-5">
                <input id="id-type" name="identification_card" style="min-height: 2.5rem;" type="text"
                  value="${
                    profile.indentification_card || ""
                  }" placeholder="Ex.  National ID"
                  class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                <input type="file" id="government-id-input" name="identification_card_picture" accept="image/*"
                class="text-sm text-gray-600">
                <div class="flex flex-col gap-4 items-center md:flex-row">
                    <label for="id-prn" class="mb-2">PRN</label>
                    <input id="lto-client-id" name="ltoClientId" style="min-height: 2.5rem;" type="number"
                        value="${
                          profile.prn || ""
                        }" placeholder="exclude the spaces and dashes"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-center mb-4">
            <img id="profile-picture-preview"
                class="w-36 h-32 rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                src="${
                  profile.profile_picture ? profile.profile_picture : ""
                }" alt="Profile Picture Preview">
            <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*"
                class="text-sm text-gray-600">
        </div>

        <button id="edit-request-btn"
            class="bg-sky-900 hover:bg-red-600 m-auto text-white font-bold mt-5 py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
            type="submit">
            Save
        </button>

    </form>

</div>

    `;
    const editProfileBtn = document.getElementById("edit-request-btn");
    const form = document.getElementById("edit-profile-form");
    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const encrypted = await encryptData(formData);

        showBtnLoading(editProfileBtn);

        try {
          const response = await fetch("/account/api/user-profile-edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
          });
          const data = await response.json();
          if (response.ok) {
            showBtnResult(editProfileBtn, true);
            alert(data.message);
            setTimeout(() => {
              window.location.href = "/account/user-profile";
            }, 3000);
          } else {
            showBtnResult(editProfileBtn, false);
            alert("Failed to edit profile. Please try again later!");
          }
        } catch (error) {
          console.error("Error submitting profile:", error);
          alert("An error occurred while submitting the profile.", data.error);
        }
      },
      { once: true }
    );
  }
  document
    .getElementById("profile-picture-input")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById("profile-picture-preview").src =
            e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("government-id-input")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById("government-id-preview").src =
            e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
}

renderDetails();

import { encryptData, decryptData } from "../utils/f-webCryptoKeys.js";

async function renderDetails() {
  const response = await fetch(`/api/user-profile`);
  const encrypted = await response.json();
  const data = decryptData(encrypted.encrypted);
  const profileDisplay = document.getElementById("profile-display");
  console.log(data);

  if (!data.userProfileDetails) {
    profileDisplay.innerHTML = `
<div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
        <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
        <form id="profile-form" enctype="multipart/form-data" class="w-full">
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="w-full md:w-1/3">
                    <label>First Name</label>
                    <input id="first-name" name="first-name" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="w-full md:w-1/3">
                    <label>Middle Name</label>
                    <input id="middle-name" name="middle-name" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="w-full md:w-1/3">
                    <label>Last Name</label>
                    <input id="last-name" name="last-name" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
            </div>
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="">
                    <label>Phone Number</label>
                    <input id="phone-number" name="phone-number" type="number"
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
                    <label>Birth Date</label>
                    <input id="birth-date" name="birth-date" type="date" 
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
                    <input id="civil-status" name="civil-status" type="text"
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
                <input id="lto-client-id" name="lto-client-id" type="text"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"></textarea>
            </div>
            <div class="flex flex-col mb-4">
                <label for="training-purpose" class="mb-2">Training Purpose</label>
                <select id="training-purpose" name="training-purpose"
                    class="shadow-md bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                    <option value="New Driver's License (Non-Pro)">New Driver's License (Non-Pro)</option>
                    <option value="New Driver's License (Pro)">New Driver's License (Pro)</option>
                    <option value="Driver's License Renewal">Driver's License Renewal</option>
                    <option value="Defensive Driving Course">Defensive Driving Course</option>
                    <option value="Advanced Driving Course">Advanced Driving Course</option>
                    <option value="Commercial Driver's License (CDL)">Commercial Driver's License (CDL)</option>
                    <option value="Motorcycle License">Motorcycle License</option>
                    <option value="Forklift Operator Certification">Forklift Operator Certification</option>
                    <option value="Heavy Vehicle Operation">Heavy Vehicle Operation</option>
                    <option value="Emergency Vehicle Operation">Emergency Vehicle Operation</option>
                </select>
            </div>
            
            <div>
                <img id="profile-picture-preview"
                    class="w-36 h-32 rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                    src="defaultavatar.png" alt="Profile Picture Preview">
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

    document
      .getElementById("profile-form")
      .addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const form = document.getElementById("profile-form");
        const formData = new FormData(form);
        const encrypted = await encryptData(formData);
        try {
          const response = await fetch("/api/user-profile-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
          });
          if (response.ok) {
            alert("Profile submitted successfully!");
          } else {
            alert("Failed to submit profile.");
          }
        } catch (error) {
          console.error("Error submitting profile:", error);
          alert("An error occurred while submitting the profile.");
        }
      });
  } else {
    const profile = data.userProfileDetails;

    profileDisplay.innerHTML = `
    <div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
    <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
    <form id="edit-profile-form" enctype="multipart/form-data" class="w-full">
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="w-full md:w-1/3">
                <label>First Name</label>
                <input id="first-name" name="first-name" type="text" value="${
                  profile.first_name ? profile.first_name : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="w-full md:w-1/3">
                <label>Middle Name</label>
                <input id="middle-name" name="middle-name" style="min-height: 2.5rem;"
                    value="${profile.middle_name}"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="w-full md:w-1/3">
                <label>Last Name</label>
                <input id="last-name" name="last-name" type="text"  value="${
                  profile.last_name ? profile.last_name : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
        </div>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="">
                <label>Phone Number</label>
                <input id="phone-number" name="phone-number" type="number" value="${
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
                <label>Birth Date</label>
                <input id="birth-date" name="birth-date" type="date" value="${
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
              <input id="civil-status" name="civil-status" style="min-height: 2.5rem;" type="text"
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
        
        <div class=" mb-4">
            <label>LTO Client ID</label>
            <input id="lto-client-id" name="lto-client-id" style="min-height: 2.5rem;"
                value="${profile.lto_client_id}"
            class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
        </div>
        <div class="flex flex-col mb-4">
            <label for="training-purpose" class="mb-2 text-gray-700">Training Purpose</label>
            <select id="training-purpose" name="training-purpose"
                class="shadow-md bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                <option value="New Driver's License (Non-Pro)" ${
                  profile.training_purpose === "New Driver's License (Non-Pro)"
                    ? "selected"
                    : ""
                }>New Driver's License (Non-Pro)</option>
                <option value="New Driver's License (Pro)" ${
                  profile.training_purpose === "New Driver's License (Pro)"
                    ? "selected"
                    : ""
                }>New Driver's License (Pro)</option>
                <option value="Driver's License Renewal" ${
                  profile.training_purpose === "Driver's License Renewal"
                    ? "selected"
                    : ""
                }>Driver's License Renewal</option>
                <option value="Defensive Driving Course" ${
                  profile.training_purpose === "Defensive Driving Course"
                    ? "selected"
                    : ""
                }>Defensive Driving Course</option>
                <option value="Advanced Driving Course" ${
                  profile.training_purpose === "Advanced Driving Course"
                    ? "selected"
                    : ""
                }>Advanced Driving Course</option>
                <option value="Commercial Driver's License (CDL)" ${
                  profile.training_purpose ===
                  "Commercial Driver's License (CDL)"
                    ? "selected"
                    : ""
                }>Commercial Driver's License (CDL)</option>
                <option value="Motorcycle License" ${
                  profile.training_purpose === "Motorcycle License"
                    ? "selected"
                    : ""
                }>Motorcycle License</option>
                <option value="Forklift Operator Certification" ${
                  profile.training_purpose === "Forklift Operator Certification"
                    ? "selected"
                    : ""
                }>Forklift Operator Certification</option>
                <option value="Heavy Vehicle Operation" ${
                  profile.training_purpose === "Heavy Vehicle Operation"
                    ? "selected"
                    : ""
                }>Heavy Vehicle Operation</option>
                <option value="Emergency Vehicle Operation" ${
                  profile.training_purpose === "Emergency Vehicle Operation"
                    ? "selected"
                    : ""
                }>Emergency Vehicle Operation</option>
            </select>

        </div>

        <div>
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
            type="submit" value="edit-request">
            Save
        </button>

    </form>

</div>

    `;
    document
      .getElementById("edit-profile-form")
      .addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const form = document.getElementById("edit-profile-form");
        const formData = new FormData(form);
        const encrypted = await encryptData(formData);
        try {
          const response = await fetch("/api/user-profile-edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypted }),
          });
          const data = await response.json();
          if (response.ok) {
            alert(data.message);
            window.location.href = "/user-profile";
          } else {
            alert("Failed to submit profile.");
          }
        } catch (error) {
          console.error("Error submitting profile:", error);
          alert("An error occurred while submitting the profile.", data.error);
        }
      });
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
}

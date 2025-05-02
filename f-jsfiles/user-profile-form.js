function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null; // Return null if the cookie is not found
}

async function renderDetails() {
  const id = getCookie("userId");
  const response = await fetch(`/api/user-profile/${id}`);
  const data = await response.json();
  const profileDisplay = document.getElementById("profile-display");
  console.log(data);

  if (!data.userProfileDetails) {
    profileDisplay.innerHTML = `
<div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
        <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
        <form id="profile-form" enctype="multipart/form-data" class="w-full">
            <div class="flex flex-col md:flex-row mb-4 gap-3">
                <div class="">
                    <label>First Name</label>
                    <input id="first-name" name="first-name" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="">
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
                <div>
                    <label>Birth Date</label>
                    <input id="birth-date" name="birth-date" type="date"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div>
                    <label>Nationality</label>
                    <input id="nationality" name="nationality" type="text"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                </div>
                <div class="flex flex-col">
                    <label>Gender</label>
                    <select id="gender" name="gender"
                        class="shadow-md bg-white border rounded md:min-w-32 w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="LGBTQ">LGBTQ</option>
                    </select>
                </div>
            </div>
            <div class="mb-4">
                <label>Address</label>
                <textarea id="address" name="address" type="textbox"
                    class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900"></textarea>
            </div>
            <div class="flex flex-col mb-4">
                <label for="training-purpose" class="mb-2 text-gray-700">Training Purpose</label>
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
            <input type="hidden" id="userIDProfile" name="userID" value="${getCookie(
              "userId"
            )}" />

            <button id="submit-request-btn"
                class="bg-sky-900 hover:bg-red-600 m-auto text-white font-bold mt-5 py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                type="submit" value="submit-request">
                Submit
            </button>

        </form>

    </div>
`;
    document
      .getElementById("profile-form")
      .addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const form = document.getElementById("profile-form");
        const formData = new FormData(form);
        try {
          const response = await fetch("/api/use-profile-submit", {
            method: "POST",
            body: formData,
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
    const binary = new Uint8Array(profile.profile_picture.data);
    const base64String = btoa(
      binary.reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    profileDisplay.innerHTML = `
    <div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
    <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">User Profile</h1>
    <form id="edit-profile-form" class="w-full">
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div class="">
                <label>First Name</label>
                <input id="first-name" name="first-name" type="text" value="${
                  profile.first_name ? profile.first_name : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="">
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
            <div>
                <label>Birth Date</label>
                <input id="birth-date" name="birth-date" type="date" value="${
                  profile.birth_date ? profile.birth_date : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div>
                <label>Nationality</label>
                <input id="nationality" name="nationality" type="text" value="${
                  profile.nationality ? profile.nationality : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div class="flex flex-col">
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
        </div>
        <div class="mb-4">
            <label>Address</label>
            <textarea id="address" name="address" type="textbox"
                class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">${
                  profile.address ? profile.address : ""
                }</textarea>
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


        <h3 class="block text-xl text-center font-medium mb-3">TDC</h3>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div>
                <label>Date started</label>
                <input id="tdc-date-started" name="tdc-date-started" type="date" value="${
                  profile.tdc_date_started ? profile.tdc_date_started : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div>
                <label>Date Completed</label>
                <input id="tdc-date-completed" name="tdc-date-completed" type="date" value="${
                  profile.tdc_date_completed ? profile.tdc_date_completed : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div>
                <label>Total Hours</label>
                <div class="flex flex-row text-center justify-items-center gap-4"> 
                    <input id="tdc-total-hours" name="tdc-total-hours" type="number" value="${
                      profile.tdc_total_hours ? profile.tdc_total_hours : ""
                    }"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                    <span class="">/</span><span>15</span>
                </div>
            </div>
        </div>

        <h3 class="block text-xl text-center font-medium mb-3">PDC</h3>
        <div class="flex flex-col md:flex-row mb-4 gap-3">
            <div>
                <label>Date Started</label>
                <input id="pdc-date-started" name="pdc-date-started" type="date" value="${
                  profile.pdc_date_started ? profile.pdc_date_started : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div>
                <label>Date Completed</label>
                <input id="pdc-date-completed" name="pdc-date-completed" type="date" value="${
                  profile.pdc_date_completed ? profile.pdc_date_completed : ""
                }"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
            </div>
            <div>
                <label>Total Hours</label>
                <div class="flex flex-row text-center gap-4">
                    <input id="pdc-total-hours" name="pdc-total-hours" type="number" value="${
                      profile.pdc_total_hours ? profile.pdc_total_hours : ""
                    }"
                        class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900" />
                    <span class="">/</span><span>8</span>
                </div>
            </div>
        </div>
        <div>
            <img id="profile-picture-preview"
                class="w-36 h-32 rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                src="data:image/jpeg;base64,${
                  base64String ? base64String : ""
                }" alt="Profile Picture Preview">
            <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*"
                class="text-sm text-gray-600">
            </div>
        <input type="hidden" id="userIDProfile" name="userID" value="${getCookie(
          "userId"
        )}" />

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

        // Fetch the values from the form
        const firstName = document.getElementById("first-name").value;
        const lastName = document.getElementById("last-name").value;
        const phoneNumber = document.getElementById("phone-number").value;
        const email = document.getElementById("email").value;
        const birthDate = document.getElementById("birth-date").value;
        const nationality = document.getElementById("nationality").value;
        const gender = document.getElementById("gender").value;
        const address = document.getElementById("address").value;
        const trainingPurpose =
          document.getElementById("training-purpose").value;
        const tdcDateStarted =
          document.getElementById("tdc-date-started").value;
        const tdcDateCompleted =
          document.getElementById("tdc-date-completed").value;
        const tdcTotalHours = document.getElementById("tdc-total-hours").value;
        const pdcDateStarted =
          document.getElementById("pdc-date-started").value;
        const pdcDateCompleted =
          document.getElementById("pdc-date-completed").value;
        const pdcTotalHours = document.getElementById("pdc-total-hours").value;
        const profilePicture = document.getElementById("profile-picture-input")
          .files[0];
        const userID = document.getElementById("userIDProfile").value;

        // Prepare data for JSON body
        const profileData = {
          "first-name": firstName,
          "last-name": lastName,
          "phone-number": phoneNumber,
          email,
          "birth-date": birthDate,
          nationality,
          gender,
          address,
          "training-purpose": trainingPurpose,
          "tdc-date-started": tdcDateStarted,
          "tdc-date-completed": tdcDateCompleted,
          "tdc-total-hours": tdcTotalHours,
          "pdc-date-started": pdcDateStarted,
          "pdc-date-completed": pdcDateCompleted,
          "pdc-total-hours": pdcTotalHours,
          profile_picture: profilePicture,
          userID,
        };
        console.log(profileData);
        try {
          const response = await fetch("/api/user-profile-edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData),
          });
          if (response.ok) {
            alert("Profile submitted successfully!");
            window.location.href = "/user-profile";
          } else {
            alert("Failed to submit profile.");
          }
        } catch (error) {
          console.error("Error submitting profile:", error);
          alert("An error occurred while submitting the profile.");
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

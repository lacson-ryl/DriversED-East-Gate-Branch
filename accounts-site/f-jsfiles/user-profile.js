import { decryptData } from "../utils/f-webCryptoKeys.js";

function profileDetialsBlank(courseList) {
  return `
<div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
    <div class=" text-center">
        <img id="profile-picture-preview"
            class="w-36 h-32 inline-block rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
            src="" alt="Profile Picture Preview">
        <h1 class="text-2xl text-center mb-5 font-bold text-blue-900">
        <div class="relative inline-block bounce-once">
            <!-- Sleek lock icon -->
            <button id="lock-info" class="p-1">
                <svg class="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 00-6 0v2c0 1.657 1.343 3 3 3zM5 11h14v10H5V11z"/>
                </svg>
            </button>

            <!-- Tooltip -->
            <div id="lock-tooltip" 
                class="absolute bottom-full mb-2 hidden bg-gray-800 text-white text-xs rounded px-2 py-1">
                Your information is secure and private.
            </div>
        </div> 
        User Profile</h1>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/3">
            <label>First Name</label>
            <p id="first-name" name="first-name" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Middle Name</label>
            <p id="middle-name" name="middle-name" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Last Name</label>
            <p id="last-name" name="last-name" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/2">
            <label>Phone Number</label>
            <p id="phone-number" name="phone-number" style="min-height: 2.5rem;" type="number"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
        <div class="w-full md:w-1/2">
            <label>Email</label>
            <p id="email" name="email" type="email" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/3">
            <label>Age</label>
            <p id="age" name="age" style="min-height: 2.5rem;" type="Number"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Birth Date</label>
            <p id="birth-date" name="birth-date" style="min-height: 2.5rem;" type="date"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Nationality</label>
            <p id="nationality" name="nationality" style="min-height: 2.5rem;" type="text"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>

    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        
        <div class="w-full md:w-1/2">
            <label>Gender</label>
            <p id="gender" name="gender" style="min-height: 2.5rem;"
                class="shadow-md bg-white border rounded md:min-w-32 w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

            </p>
        </div>
        <div class="w-full md:w-1/2">
            <label>Civil Status</label>
            <p id="civil-status" name="civil-status" style="min-height: 2.5rem;" type="text"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
            </p>
        </div>
    </div>
    <div class="mb-4">
        <label>Address</label>
        <p id="address" name="address" type="textbox"
            class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

        </p>
    </div>
    <div class="mb-4">
        <label>LTO Client ID</label>
        <p id="lto-client-id" name="lto-client-id" style="min-height: 2.5rem;"
            class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">

        </p>
    </div>
    <div class="flex flex-col mb-4">
        <label for="id-prn" class="mb-2">Government Id</label>
        <div class="flex flex-row md:flex-col gap-5">
            <img id="government-id-preview"
                class="w-48 h-32 inline-block rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                src="../account/f-assets/solid/black/identification.svg" alt="Government ID Preview">
            <p class="shadow-md bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                please upload a id for account verification in case you lost your password.
            </p>
        </div>
    </div>

    <div class="mb-5">
    ${renderUserCourseTaken(courseList)}
    </div>

    <a id="edit-profile-btn" href="/account/user-profile-form"
        class="bg-sky-900 hover:bg-red-600 m-auto text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
         value="edit-profile-request">
        Edit
    </a>

</div>

</div>
`;
}

async function renderDetails() {
  const response = await fetch("/account/api/user-profile");
  const encrypted = await response.json();
  const data = await decryptData(encrypted.encrypted);
  const profileDisplay = document.getElementById("profile-display");
  const userCourseInfoList = data.userCourseInfoList;

  if (!data.userProfileDetails) {
    profileDisplay.innerHTML = profileDetialsBlank(userCourseInfoList);
  } else {
    const profile = data.userProfileDetails;

    profileDisplay.innerHTML = `
    <div class="bg-slate-200 p-10 rounded-lg shadow-md w-full max-w-screen-md mx-4 my-2">
    <div class=" text-center">
        <img id="profile-picture-preview"
            class="w-36 h-32 inline-block rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
             src="${
               profile.profile_picture ? profile.profile_picture : ""
             }" alt="Profile Picture Preview">
        <h1 class="text-2xl text-center mb-5 font-bold text-blue-900"><div class="relative inline-block bounce-once">
            <!-- Sleek lock icon -->
            <button id="lock-info" class="p-1">
                <svg class="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 00-6 0v2c0 1.657 1.343 3 3 3zM5 11h14v10H5V11z"/>
                </svg>
            </button>

            <!-- Tooltip -->
            <div id="lock-tooltip" 
                class="absolute bottom-full mb-2 hidden bg-gray-800 text-white text-xs rounded px-2 py-1">
                Your information is secure and private.
            </div>
        </div>
        User Profile</h1>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/3">
            <label>First Name</label>
            <p id="first-name" name="firstName" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
              ${profile.first_name}
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Middle Name</label>
            <p id="middle-name" name="middleName" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
              ${profile.middle_name}
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Last Name</label>
            <p id="last-name" name="lastName" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.last_name}
            </p>
        </div>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/2">
            <label>Phone Number</label>
            <p id="phone-number" name="phoneNumber" style="min-height: 2.5rem;" type="number"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.phone_number}
            </p>
        </div>
        <div class="w-full md:w-1/2">
            <label>Email</label>
            <p id="email" name="email" type="email" style="min-height: 2.5rem;"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.email}
            </p>
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
            <p id="birth-date" name="birthDate" style="min-height: 2.5rem;" type="date"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.birth_date}
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Nationality</label>
            <p id="nationality" name="nationality" style="min-height: 2.5rem;" type="text"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.nationality}
            </p>
        </div>
    </div>
    <div class="flex flex-col md:flex-row mb-4 gap-3">
        <div class="w-full md:w-1/2">
            <label>Gender</label>
            <p id="gender" name="gender" style="min-height: 2.5rem;"
                class="shadow-md bg-white border rounded md:min-w-32 w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.gender}
            </p>
        </div>
        <div class="w-full md:w-1/2">
            <label>Civil Status</label>
            <p id="civil-status" name="civilStatus" style="min-height: 2.5rem;" type="text"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-black leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.civil_status}
            </p>
        </div>
    </div>
    <div class="mb-4">
        <label>Address</label>
        <p id="address" name="address" type="textbox"
            class="shadow-md bg-white appearance-none border rounded w-full min-h-20 py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.address}
        </p>
    </div>
    <div class="mb-4">
        <label>LTO Client ID</label>
        <p id="lto-client-id" name="ltoClientId" style="min-height: 2.5rem;"
            class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${profile.lto_client_id || "----------------"}
        </p>
    </div>
    <div class="flex flex-col mb-4">
        <label for="id-prn" class="mb-2">${
          profile.identification_card || "Government Id"
        }</label>
        <div class="flex flex-row md:flex-col gap-5">
            <img id="government-id-preview"
                class="w-48 h-32 inline-block rounded-md border-2 content-center border-gray-300 mb-4 object-fill"
                src="${
                  profile.identification_card_picture ||
                  "../account/f-assets/solid/black/identification.svg"
                }" alt="Government ID Preview">
            <div class="shadow-md bg-white border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900 
            ${profile.identification_card ? "hidden" : ""}">
                please upload a id for account verification in case you lost your password.
            </div>
        </div>
    </div>

    <div class="gap-4 mb-5">${renderUserCourseTaken(userCourseInfoList)}</div>

    <a id="edit-profile-btn" href="/account/user-profile-form"
        class="bg-sky-900 hover:bg-red-600 m-auto text-white font-bold py-2 px-4 mt-9 rounded-lg focus:outline-none focus:shadow-outline"
         value="edit-profile-request">
        Edit
    </a>

</div>

</div>
    `;
  }

  // Mobile tap behavior
  const lockBtn = document.getElementById("lock-info");
  const tooltip = document.getElementById("lock-tooltip");

  lockBtn.addEventListener("click", () => {
    tooltip.classList.toggle("hidden");
    setTimeout(() => {
      tooltip.classList.add("hidden");
    }, 4000); // Hide after 3 seconds
  });
}

renderDetails();

function renderUserCourseTaken(courseList) {
  if (!courseList) {
    return "";
  }
  return courseList
    .map(
      (course) => `
    <h3 class="block text-xl text-center font-medium mt-3 mb-2">${
      course.program_name
    }</h3>
    <div class="flex flex-col md:flex-row mb-2 gap-3">
        <div class="w-full md:w-1/3">
            <label>Date started</label>
            <p id="tdc-date-started" name="tdc-date-started" style=" min-height: 2.5rem;" type="date"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${course.date_started}
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Date Completed</label>
            <p id="tdc-date-completed" name="tdc-date-completed" style=" min-height: 2.5rem;" type="date"
                class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                ${!course.date_completed ? "" : course.date_completed}
            </p>
        </div>
        <div class="w-full md:w-1/3">
            <label>Total Hours</label>
            <div class="flex flex-row items-center gap-4">
                <p id="tdc-total-hours" name="tdc-total-hours" style=" min-height: 2.5rem;"
                    class="shadow-md bg-white appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight hover:border-blue-900 focus:outline-none focus:border-blue-900">
                    ${course.total_hours}
                </p>
                <span class="font-semibold text-2xl">/</span>
                <span class="font-semibold text-lg">${
                  course.program_duration
                }</span>
            </div>
        </div>
    </div>
    `,
    )
    .join("");
}

import { encryptData, decryptData } from "../f-webCryptoKeys.js";

//initialize modal elements;
const modal = document.getElementById("myModal");
const spanX = document.getElementsByClassName("close")[0];
const modalDetails = document.getElementById("modal-details");
const modalTitle = document.getElementById("title-details");

document
  .getElementById("search-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const encrypting = await encryptData(formData);
    const response = await fetch("/api/user-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error);
    }
    const decrypted = await decryptData(data.encryptedProfile);

    const userInfoCards = document.getElementById("user-infos");
    userInfoCards.innerHTML = decrypted
      .map((profile) => {
        let profilePic = "";
        if (profile.profile_picture !== null) {
          profilePic = profile.profile_picture;
        } else {
          profilePic = "/f-css/solid/black/user.svg";
        }

        return `
            <div class="bg-white p-5 rounded-lg shadow-md max-w-xs w-full mx-auto flex flex-col items-center space-y-4">
                <img src="${profilePic}" alt="Profile Picture"
                class="outline outline-2 outline-gray-500 w-20 h-20 rounded-full object-cover mx-auto" />
                <div class="text-center w-full">
                <h1 class="font-semibold text-lg truncate">${profile.name}</h1>
                <h2 class="text-gray-600 text-sm truncate">${profile.email}</h2>
                <p class="text-gray-400 text-xs">${profile.date_created}</p>
                </div>
                <button data-id="${profile.id}"
                class="load-user-btn mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white rounded-lg px-2 py-2 transition-colors duration-150">
                Load User
                </button>
            </div>
        `;
      })
      .join("");

    // Add event listener for the confirm button
    document.querySelectorAll(".load-user-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const userId = button.getAttribute("data-id");

        modalDetails.innerText = `generating the user info for you`;
        modal.style.display = "flex";
        userInfoCards.style.display = "none";
        setTimeout(() => {
          modal.style.display = "none";
          renderUserInfo(userId);
        }, 4000);
      });
    });
  });

async function renderUserInfo(userId) {
  const response = await fetch(`/api/user-search/${userId}`);
  const data = await response.json();

  if (!response.ok) {
    alert(data.error);
    return;
  }

  // Decrypt the payload (await if decryptData is async)
  const { profile, courseList, courseAttendance } = await decryptData(
    data.encryptedProfile
  );
  // Destructure the expected data
  const user = profile[0];
  const courses = courseList;
  const attendance = courseAttendance;

  // Profile picture
  let profilePic = user.profile_picture
    ? user.profile_picture
    : "/f-css/solid/black/user.svg";

  // Format birth date
  const birthDate = user.birth_date
    ? new Date(user.birth_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // User Info Card
  let html = `
    <div class="bg-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row gap-6 mb-8">
      <div class="flex-shrink-0 flex flex-col items-center">
        <img src="${profilePic}" class="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 shadow-md" alt="Profile Picture" />
        <div class="mt-2 text-xs text-gray-500">PRN: ${user.prn || "-"}</div>
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-blue-900 mb-2">${user.user_name}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700">
          <div><span class="font-semibold">Email:</span> ${
            user.user_email
          }</div>
          <div><span class="font-semibold">Phone:</span> ${
            user.phone_number || "-"
          }</div>
          <div><span class="font-semibold">Birth Date:</span> ${birthDate}</div>
          <div><span class="font-semibold">Gender:</span> ${
            user.gender || "-"
          }</div>
          <div><span class="font-semibold">Nationality:</span> ${
            user.nationality || "-"
          }</div>
          <div><span class="font-semibold">Civil Status:</span> ${
            user.civil_status || "-"
          }</div>
          <div><span class="font-semibold">Address:</span> ${
            user.address || "-"
          }</div>
          <div><span class="font-semibold">LTO Client ID:</span> ${
            user.lto_client_id || "-"
          }</div>
          <div><span class="font-semibold">Training Purpose:</span> ${
            user.training_purpose || "-"
          }</div>
          <div><span class="font-semibold">Account Role:</span> ${
            user.user_role
          }</div>
          <div class="${
            user.isVerify == "1" ? "text-green-500" : "text-red-500"
          }"><span class="font-semibold">Verified:</span> 
          ${user.isVerify == "1" ? "Yes" : "No"}</div>
          <div><span class="font-semibold">Date Created:</span> ${
            user.date_created
          }</div>
        </div>
      </div>
    </div>
  `;

  // Courses Section
  html += `<div class="mb-8">
    <h3 class="text-xl font-bold text-blue-800 mb-4">Enrolled Courses</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;

  courses.forEach((course) => {
    const computedProgress =
      course.program_duration === 0
        ? 0
        : Math.round((course.total_hours / course.program_duration) * 100);

    const progress = computedProgress >= 100 ? 100 : computedProgress;

    // Attendance for this course
    const courseAttendance = attendance.filter(
      (a) => a.user_course_id === course.course_id
    );

    html += `
      <div class="bg-gray-50 rounded-lg shadow p-4 flex flex-col gap-2 relative">
      <span class="delete-course-btn absolute top-0 right-2 text-3xl font-semibold text-gray-700 hover:text-red-500 hover:font-bold cursor-pointer "
        data-user-id="${course.user_id}"
        data-instructor-name="${course.instructor_name}"
        data-date-started="${course.date_started}"
        data-course-id="${course.course_id}"
      >&times;</span>
        <div class="flex justify-between items-center">
          <div>
            <div class="text-lg font-semibold text-gray-800">${
              course.program_name
            }</div>
            <div class="text-sm text-gray-600">Instructor: ${
              course.instructor_name
            }</div>
            <div class="text-xs text-gray-500">Start: ${
              course.date_started || "--"
            }</div>
            <div class="text-xs text-gray-500">End: ${
              course.date_completed || "--"
            }</div>
          </div>
          <div>
             ${
               course.isPaid
                 ? ` <span class="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800">
                Paid</span>`
                 : `<button class="course-pay-button text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800"
                  data-user-id="${course.user_id}"
                  data-course-id="${course.course_id}">
                Add payment</button>
                `
             }
          </div>
        </div>
        <div class="mt-2">
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div class="bg-yellow-400 h-4 rounded-full text-xs text-white flex items-center justify-center" style="width: ${progress}%;">
              ${progress}%
            </div>
          </div>
          <div class="text-xs text-gray-700 mt-1">${course.total_hours} / 
          ${course.program_duration} Hours</div>
        </div>
        <div class="mt-2 text-sm">
          <span class="font-semibold">Grade:</span> ${course.grade ?? "N/A"}
          <span class="ml-2 font-semibold">Status:</span> 
          ${course.grading_status}
        </div>
        <div class="mt-2">
          <div class="flex flex-row justify-between">
            <button class="toggle-attendance-btn text-blue-600 underline text-xs" 
            data-course="${course.course_id}">
              Show Attendance
            </button>
            <button class="add-continuation-date text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800"
              data-user-id="${course.user_id}" 
              data-course-id="${course.course_id}">
              Add payment
            </button>
          </div>
          <div class="attendance-list mt-2 hidden" 
          id="attendance-${course.course_id}">
            ${
              courseAttendance.length
                ? courseAttendance
                    .map(
                      (a) =>
                        `<div class="flex justify-between text-sm bg-white rounded px-2 py-1 mb-1 border">
                          <span>${a.date} (${a.slot})</span>
                          <span class="text-gray-500">${
                            a.hours ? a.hours : 0
                          } hours</span>
                          <button
                          data-user-id="${user.user_id}"
                          data-id="${a.attendance_id}" 
                          data-date="${a.date}" 
                          data-name="${user.user_name}"
                          class="attendance-status-btn font-semibold hover:text-yellow-400 hover:underline underline-offset-1 ">
                          ${
                            a.status == "Present"
                              ? '<div class="text-green-900 hover:font-bold font-semibold rounded-md ">Present</div>'
                              : a.status == "Absent"
                              ? '<div class="text-red-800 hover:font-bold font-semibold rounded-md">Absent</div>'
                              : '<div class="text-gray-700 hover:font-bold font-semibold rounded-md">Pending</div>'
                          }
                          </button>
                        </div>`
                    )
                    .join("")
                : `<div class="text-xs text-gray-400">No attendance records.</div>`
            }
          </div>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;

  // Render to container
  const selectedUserContainer = document.getElementById(
    "selected-user-info-container"
  );
  selectedUserContainer.innerHTML = html;
  selectedUserContainer.style.display = "block";

  // Add toggle attendance event listeners
  document.querySelectorAll(".toggle-attendance-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = btn.getAttribute("data-course");
      const attDiv = document.getElementById(`attendance-${courseId}`);
      if (attDiv) {
        attDiv.classList.toggle("hidden");
      }
      btn.textContent = attDiv.classList.contains("hidden")
        ? "Show Attendance"
        : "Hide Attendance";
    });
  });

  document.querySelectorAll(".course-pay-button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const userId = btn.getAttribute("data-user-id");
      const courseId = btn.getAttribute("data-course-id");
      const userCourse = courses.filter((arr) => arr.course_id == courseId);

      const modalform = `
        <form id="add-payment-form" class="w-96">
          <div class="mb-4">
            <h3 class="text-xl font-semibold mb-3">Name</h3>
            <input type="text" id="account-name" name="accountName" value="${user.user_name}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Name" />
          </div>
          <div class="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div class="input-container w-1/3">
              <h3 class="text-xl font-semibold mb-3">ID</h3>
              <input type="number" id="user-id" name="id" value="${user.user_id}" 
                class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="ID" />
            </div>
            <div class="w-2/3">
              <h3 class="text-xl font-semibold mb-3">Amount</h3>
              <input type="number" id="amount" name="amount" value="${userCourse[0].program_fee}" class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="Enter Amount" />
            </div>
          </div>
          <div class="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div class="input-container w-1/3">
              <h3 class="text-xl font-semibold mb-3">CourseId</h3>
              <input type="number" id="course-select" name="courseSelect" value="${userCourse[0].course_id}" 
                class="w-full outline outline-1 outline-gray-300 rounded-md text-lg px-1" placeholder="ID" />
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

      modalDetails.innerHTML = "";
      modalDetails.innerHTML = modalform;
      modal.style.display = "flex";

      // Event listener for the form submission
      document
        .getElementById("add-payment-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(event.target);
          const encrypting = await encryptData(formData);

          try {
            const response = await fetch("/api/payment/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encryptedWithEncAesKey: encrypting }),
            });
            if (response.ok) {
              alert("Payment Added Successfully!");
              renderUserInfo(userId);
            } else {
              alert("Can't add Payment right now!");
            }
            modal.style.display = "none";
          } catch (error) {
            console.error("Internal Server error", error);
            alert("Internal Server error");
          }
        });
    });
  });

  document.querySelectorAll(".add-continuation-date").forEach((btn) => {
    btn.addEventListener("click", function () {
      const userId = btn.getAttribute("data-user-id");
      const courseId = btn.getAttribute("data-course-id");
      const userCourse = courses.filter((arr) => arr.course_id == courseId);
      const userAttendance = attendance.filter(
        (arr) => arr.user_course_id == courseId
      );

      const modalForm = `
        <form id="add-continuation-form" class="mt-4">
            <div class="mb-4">
                <label for="instructor" class="block text-base font-medium text-gray-700">Instructor</label>
                <select id="instructor-modal" name="instructor" required>
                    <option value="${userAttendance[0].instructor_id}">
                    ${userCourse[0].instructor_name}</option>
                </select>
            </div>
            <div class="mb-4">
                <label for="course" class="block text-base font-medium text-gray-700">Course <span class="text-xs">(remaing
                        hours)</span></label>
                <select id="course" name="courseOption" required>
                    <option value="${courseId}">
                    #${userCourse.course_id} - 
                    ${userCourse.program_name} 
                    (${
                      userCourse.program_duration - userCourse.total_hours
                    })</option>
                </select>
            </div>
            <div class="mb-4">
                <label for="continuationDate" class="block text-sm font-medium text-gray-700">Continuation
                    Date</label>
                <input type="date" id="continuationDate" name="continuationDate" required
                    class="date-input mt-1 block w-full outline outline-1 outline-gray-500 hover:outline-yellow-500 focus:outline-yellow-500 px-1">
            </div>
            <div class="flex flex-row gap-4 mb-4">
                <label for="dateAMPM" class="block text-base font-medium text-gray-700">Slot</label>
                <select id="dateAMPM" name="dateAMPM" required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 mt-4">Submit</button>

        </form>
      `;
      modalDetails.innerHTML = "";
      modalDetails.innerHTML = modalForm;
      modal.style.display = "flex";

      // Event listener for the form submission
      addContinuationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        formData.append("clientId", userId);

        try {
          const response = await fetch(
            "/api/user-application/add-continuation",
            {
              method: "POST",
              body: formData,
            }
          );
          const data = await response.json();

          if (!response.ok) alert(data.error);

          alert(data.message);
          renderUserInfo(userId);
        } catch (error) {
          alert("Sorry! Can’t connect to the server right now.");
          console.error(error); // Log the error to the console for debugging
        }
      });
    });
  });

  document.querySelectorAll(".delete-course-btn").forEach((btn) => {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      const userId = btn.getAttribute("data-user-id");
      const instructorName = btn.getAttribute("data-instructor-name");
      const dateStarted = btn.getAttribute("data-date-started");
      const courseId = btn.getAttribute("data-course-id");
      const toEncrypt = {
        clientId: userId,
        instructorName: instructorName,
        dateStarted: dateStarted,
        courseId: courseId,
      };

      modalTitle.innerText = "Save Changes";
      modalDetails.innerHTML = `
      <p>Delete course of ID #${courseId}?</p>
      <p class="mt-3">${user.user_name} - ${dateStarted}</p>
      <div class="justify-self-end space-x-4 mt-5">
        <button id="delete-yes" class="bg-green-700 hover:bg-gradient-to-t from-green-400 to-green-800 text-white text-lg rounded-md px-2">YES</button>
        <button id="delete-no" class="bg-red-700 hover:bg-gradient-to-t from-red-400 to-red-800 text-white text-lg rounded-md px-2">NO</button>
      </div>
    `;
      modal.style.display = "flex";

      document
        .getElementById("delete-yes")
        .addEventListener("click", async (event) => {
          event.preventDefault();
          const encrypt = await encryptData(toEncrypt);
          // Call your API to find and delete the application
          const response = await fetch("/api/delete-application-by-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedWithEncAesKey: encrypt }),
          });
          const result = await response.json();
          if (result.success) {
            modalDetails.innerText = "Application deleted!";
            setInterval(() => {
              modal.style.display = "none";
              renderUserInfo(userId);
            }, 5000);
          } else {
            console.error(result.error);
            modalDetails.innerText =
              result.error || "Failed to delete application.";
          }
        });
      document.getElementById("delete-no").addEventListener("click", () => {
        modal.style.display = "none";
      });
    });
  });

  document.querySelectorAll(".attendance-status-btn").forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const userId = button.getAttribute("data-user-id");
      const id = button.getAttribute("data-id");
      const name = button.getAttribute("data-name");
      const date = button.getAttribute("data-date");

      if (!id) {
        console.error("ID not found");
        modalDetails.innerHTML = "<p>ID not found.</p>";
        modal.style.display = "flex";
        return;
      }
      modalTitle.innerText = "Save Changes";
      modalDetails.innerHTML = `
          <p>Change status of ID #${id}?</p>
          <p class="mt-3">${name} - ${date}</p>
          <div class="space-x-4 mt-5">
            <label for="hours-attended" class="text-lg font-semibold">Hours Attended:</label>
            <input type="number" id="hours-attended" name="hours-attended" 
            class="border border-gray-500 rounded-md px-2 py-1" placeholder="Enter hours attended">
          </div>
          <span class="text-sm text-gray-600">leave blank if absent</span>
          <div class="justify-self-end space-x-4 mt-5">
            <button id="status-present" class="bg-green-700 hover:bg-gradient-to-t from-green-400 to-green-800 text-white text-lg rounded-md px-2">Present</button>
            <button id="status-absent" class="bg-red-700 hover:bg-gradient-to-t from-red-400 to-red-800 text-white text-lg rounded-md px-2">Absent</button>
          </div>
        `;
      modal.style.display = "flex";
      const presentBtn = document.getElementById("status-present");
      presentBtn.addEventListener("click", async () => {
        presentBtn.innerText = "Loading...";
        presentBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        const hoursAttended = document.getElementById("hours-attended").value;
        await changeStatus(userId, id, "Present", hoursAttended);
      });

      const absentBtn = document.getElementById("status-absent");
      absentBtn.addEventListener("click", async () => {
        absentBtn.innerText = "Loading...";
        absentBtn.classList.add(
          "disabled",
          "cursor-not-allowed",
          "animate-pulse"
        );
        await changeStatus(userId, id, "Absent");
      });
    });

    async function changeStatus(userId, id, status, hoursAttended) {
      try {
        const response = await fetch(`/api/attendance/status/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, hoursAttended }), // Send the status in the request body
        });
        if (response.ok) {
          modalDetails.innerHTML = "<p>Successfully change status</p>";
          setTimeout(() => {
            modal.style.display = "none";
          }, 3000);
          renderUserInfo(userId);
        } else {
          alert(`Can't change status of ID no. ${id}`);
        }
        modal.style.display = "none";
      } catch (error) {
        console.error("Error changing status.", error);
        modalDetails.innerHTML =
          "<p>An error occurred while changing status.</p>";
        modal.style.display = "flex";
      }
    }
  });
}

// When the user clicks on <span> (x), close the modal
spanX.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

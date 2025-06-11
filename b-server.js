import express, { json } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import puppeteer from "puppeteer";
import session from "express-session";
import validator from "validator";
import axios from "axios";
import rateLimit from "express-rate-limit";

import {
  adminPassport,
  changePasswordPassport,
  userPassport,
} from "./b-passport.js";
dotenv.config();

const PORT = process.env.port;
const secretKey = process.env.secret_key;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Serve static files from the root directory
const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static("f-jsfiles"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/f-css", express.static("f-css"));
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Update '*' to specific domain for better security
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
const corsOptions = {
  origin: process.env.HOST,
  credentials: true,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

// Middleware to set session name dynamically
app.use((req, res, next) => {
  if (
    req.originalUrl.startsWith("/user-login") ||
    req.originalUrl.startsWith("/auth/google/user")
  ) {
    req.sessionName = "userSession";
  } else if (
    req.originalUrl.startsWith("/adminlogin") ||
    req.originalUrl.startsWith("/auth/google/admin")
  ) {
    req.sessionName = "adminSession";
  } else if (req.originalUrl.startsWith("/auth/google/change-password")) {
    req.sessionName = "changePasswordSession";
  } else {
    req.sessionName = "defaultSession";
  }
  next();
});

// Apply the session middleware with dynamic session name
app.use((req, res, next) => {
  const sessionMiddleware = session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    name: req.sessionName || "defaultSession", // Dynamically set session name
    cookie: { maxAge: 3600000, httpOnly: true },
  });

  sessionMiddleware(req, res, next);
});

app.use(adminPassport.initialize());
app.use(adminPassport.session());

// Admin Google Authentication
app.get(
  "/auth/google/admin",
  adminPassport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/admin/callback",
  (req, res, next) => {
    adminPassport.authenticate("google", (err, user, info) => {
      if (err) {
        console.error("Error in authentication:", err);
        return res.redirect("/adminlogin?error=Internal Server Error");
      }
      if (!user) {
        const error = info ? info.message : "Authentication failed.";
        console.log("Redirecting to login with error:", error);
        return res.redirect(`/adminlogin?error=${encodeURIComponent(error)}`);
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login Error:", loginErr);
          return res.redirect("/adminlogin?error=Login failed.");
        }
        // Successful authentication
        next();
      });
    })(req, res, next);
  },
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.account_id, role: req.user.account_role },
      secretKey,
      { expiresIn: "1h" }
    );
    res.cookie("jwtToken", token, { maxAge: 3600000, httpOnly: true });
    res.redirect("/admin-dashboard");
  }
);

app.use(userPassport.initialize());
app.use(userPassport.session());

// User Google Authentication
app.get(
  "/auth/google/user",
  userPassport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/user/callback",
  userPassport.authenticate("google", { failureRedirect: "/user-login" }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.user_id, role: req.user.user_role },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie("jwtToken", token, { maxAge: 3600000, httpOnly: true });
    res.redirect("/user-dashboard");
  }
);

app.use(changePasswordPassport.initialize());
app.use(changePasswordPassport.session());

//Change PAssword Google Authentication
app.get(
  "/auth/google/change-password",
  changePasswordPassport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/change-password/callback",
  authenticateTokenForChangingCredentials,
  (req, res, next) => {
    changePasswordPassport.authenticate("google", (err, user, info) => {
      if (err) {
        console.error("Error in authentication:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!user) {
        const error = info ? info.message : "Authentication failed.";
        console.log("Redirecting with error:", error);
        return res.status(401).json({ error });
      }
      const profile = user[0];
      if (profile.email !== req.tokenData.email) {
        const error = "Email mismatch.";
        console.log("Redirecting with error:", error);
        return res.status(401).send(error);
      }

      // Successful authentication
      const token = jwt.sign(
        {
          email: profile.email,
          userId: profile.user_id,
          role: profile.user_role,
        },
        secretKey,
        { expiresIn: "20m" } // Token expires in 20 minutes
      );
      console.log("token", token);

      // Set the JWT as a cookie
      res.cookie("changePasswordToken", token, {
        httpOnly: true, // Prevent client-side access
        maxAge: 20 * 60 * 1000, // 20 minutes
      });

      res.redirect("/change-password-email-option?success=true");
    })(req, res, next);
  }
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter); // Apply to all routes

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// import database queries
import {
  findAccountForChangingPassOrEmail,
  findAccountByPRN,
  updateUserCredential,
  saveChangePasswordRequest,
  verifyOtp,
  newUserCount,
  getDayplusTP,
  getInstructorScheduleForToday,
  getAllPaymentMethods,
  addPaymentMethod,
  editPaymentMethod,
  uploadPaymentMethodFile,
  deletePaymentMethod,
  getApplicants,
  getApplicant,
  deleteApplication,
  getPDC,
  addProgram,
  getAllPrograms,
  editOneProgram,
  uploadProgramCover,
  getAssignedPrograms,
  assignPrograms,
  unassignPrograms,
  getProgramsWithInstructors,
  deleteProgram,
  getAllCert,
  editOneCertificate,
  addCertificate,
  uploadCertificateTemplate,
  deleteCertificate,
  checkEmail,
  saveUser,
  getUserAccountById,
  uploadProfile,
  getProfilewithUserId,
  updateUserProfile,
  getAllReports,
  getUserReport,
  getOneReport,
  editUserReport,
  getUserDetailReport,
  addUserReport,
  adminCheckEmail,
  addUserRequest,
  getUserRequest,
  getUserDetailRequest,
  checkInstructorAvailability,
  updateAvailability,
  updateOnsiteAvailability,
  applyTDC,
  getAllPdcTdcTakers,
  changeAttendanceStatus,
  getAttendanceByInstructorId,
  getUserAttendanceSchedule,
  getInstructorDetailsForApplicants,
  getInstructors,
  addInstructor,
  getInstructorwithId,
  getInstructorWithAccountId,
  updateInstructorInfo,
  assignAccountToInstructor,
  getInstructorPayroll,
  getCurrentPayroll,
  getWeeklyPayroll,
  getMonthlyPayroll,
  deleteInstructor,
  getAllRequests,
  getOneRequest,
  editUserRequest,
  getCompletedCourseList,
  editTraineeCompletedCourseInfo,
  uploadTraineeCompletionCertificate,
  getTraineeCourseList,
  getTraineeCourseInfo,
  deleteTraineeCourseInfo,
  getAllVehicle,
  updateVehicleStatus,
  editOneVehicle,
  addVehicle,
  storeLtoDocument,
  uploadVehiclePhoto,
  deleteVehicle,
  getPaymentsLogs,
  addPayments,
  uploadPhotoReceipt,
  changePaymentStatus,
  deletePaymentInfo,
  getUserPaymentsLogs,
  saveAdminAccount,
  getNotifications,
} from "./b-database.js";

import {
  authenticateToken,
  authorizeRole,
  authenticateTokenForChangingCredentials,
  generateTemporaryPassword,
} from "./b-authenticate.js";

import { sendEmail } from "./b-email-config.js";
import { get } from "http";

app.get("/user-registration-form", (req, res) => {
  res.render("user-registration-form");
});

app.get("/user-profile-form", (req, res) => {
  res.render("user-profile-form");
});

app.post(
  "/api/user-profile-submit",
  authenticateToken,
  upload.single("profile_picture"),
  async (req, res) => {
    try {
      const {
        "first-name": firstName,
        "middle-name": middleName,
        "last-name": lastName,
        "phone-number": phoneNumber,
        email,
        nationality,
        gender,
        "civil-status": civilStatus,
        address,
        "birth-date": birthDate,
        "lto-client-id": ltoClientId,
        "training-purpose": trainingPurpose,
      } = req.body;
      const { userId } = req.user;
      console.log("userId", userId);
      console.log("req.body", req.body);

      const profilePicture = req.file ? req.file.buffer : null;

      await uploadProfile(
        firstName,
        middleName,
        lastName,
        phoneNumber,
        email,
        birthDate,
        nationality,
        gender,
        civilStatus,
        address,
        ltoClientId,
        trainingPurpose,
        profilePicture,
        userId
      );
      return res.status(200).json({ message: "Profile Submitted" });
    } catch (error) {
      console.error("Internal Server Error", error);
      return res.status(500).json({ error: "Internal Server Error!" });
    }
  }
);

app.put(
  "/api/user-profile-edit",
  authenticateToken,
  upload.single("profile_picture"),
  async (req, res) => {
    try {
      const {
        "first-name": firstName,
        "middle-name": middleName,
        "last-name": lastName,
        "phone-number": phoneNumber,
        email,
        nationality,
        gender,
        "civil-status": civilStatus,
        address,
        "birth-date": birthDate,
        "lto-client-id": ltoClientId,
        "training-purpose": trainingPurpose,
      } = req.body;
      const { userId } = req.user;
      console.log("userId", userId);
      console.log("req.body", req.body);

      const profilePicture = req.file ? req.file.buffer : null;
      // Fetch existing user profile from the database
      const existingProfile = await getProfilewithUserId(userId);

      // Log the existing profile
      //console.log("Existing Profile:", existingProfile);

      // Create an object with only the changed fields
      const updatedProfile = {};

      if (firstName && firstName !== existingProfile.first_name)
        updatedProfile.first_name = firstName;
      if (middleName && middleName !== existingProfile.middle_name)
        updatedProfile.middle_name = middleName;
      if (lastName && lastName !== existingProfile.last_name)
        updatedProfile.last_name = lastName;
      if (phoneNumber && phoneNumber !== existingProfile.phone_number)
        updatedProfile.phone_number = phoneNumber;
      if (email && email !== existingProfile.email)
        updatedProfile.email = email;
      if (birthDate && birthDate !== existingProfile.birth_date)
        updatedProfile.birth_date = birthDate;
      if (nationality && nationality !== existingProfile.nationality)
        updatedProfile.nationality = nationality;
      if (gender && gender !== existingProfile.gender)
        updatedProfile.gender = gender;
      if (address && address !== existingProfile.address)
        updatedProfile.address = address;
      if (
        trainingPurpose &&
        trainingPurpose !== existingProfile.training_purpose
      )
        updatedProfile.training_purpose = trainingPurpose;
      if (civilStatus && civilStatus !== existingProfile.civil_status)
        updatedProfile.civil_status = civilStatus;
      if (ltoClientId && ltoClientId !== existingProfile.lto_client_id)
        updatedProfile.lto_client_id = ltoClientId;
      if (profilePicture) updatedProfile.profile_picture = profilePicture;

      await updateUserProfile(userId, updatedProfile);

      return res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error Updating Profile:", error);
      return res.status(400).json({ error: "Error Updating Profile!" });
    }
  }
);

app.get("/user-profile", authenticateToken, async (req, res) => {
  res.render("user-profile");
});

app.get("/api/user-profile", authenticateToken, async (req, res) => {
  try {
    const id = req.user.userId;
    const userProfileDetails = await getProfilewithUserId(id);
    console.log("userProfileDetails1", userProfileDetails);
    const profilePicture = `data:image/png;base64,${userProfileDetails.profile_picture.toString(
      "base64"
    )}`;
    userProfileDetails.profile_picture = profilePicture;

    const courseList = await getTraineeCourseList(id);
    const userCourseInfoList = courseList.map((course) => ({
      program_name: course.program_name,
      date_started: course.date_started,
      date_completed: course.data_completed,
      total_hours: course.total_hours,
      program_duration: course.program_duration,
    }));

    return res.status(200).json({
      message: "Fetch Complete!",
      userProfileDetails,
      userCourseInfoList,
    });
  } catch (error) {
    return res.status(500).json({ error: "Cant fetch data right now!" });
  }
});

app.post("/api/user-registration", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide all fields." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Check if email already exists in the database
    try {
      const existingUser = await checkEmail(email);
      console.log("existingUser", existingUser);

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return res.status(500).json({ error: "Error checking email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user to the database
    const newUser = { name, email, password: hashedPassword };
    const userId = await saveUser(newUser);
    const token = userId;

    await sendEmail("new-account", email, {
      name: name,
      email: email,
      generatedPassword: password,
      dateCreated: new Date().toLocaleDateString(),
    });

    // Send a successful response with the token
    return res
      .status(201)
      .json({ message: "User registered successfully", token });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/user-login", async (req, res) => {
  try {
    res.render("user-login");
  } catch (error) {
    console.error("Internal Server Error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/user-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide all fields." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    const user = await checkEmail(email);
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.user_password);
      if (passwordMatch) {
        const token = jwt.sign(
          { userId: user.user_id, role: user.user_role },
          secretKey,
          {
            expiresIn: "1h",
          }
        );

        // Set the JWT token in a cookie
        res.cookie("jwtToken", token, {
          maxAge: 3600000,
          httpOnly: true,
        });
        res.cookie("userId", user.user_id, { maxAge: 3600000 });

        console.log("Token set in cookie:", token); // Add logging for token

        return res.status(200).json({
          message: "User login successful",
          token: token,
        });
      } else {
        return res
          .status(401)
          .json({ error: "Entered password is not correct" });
      }
    } else {
      return res
        .status(401)
        .json({ error: "Entered email is not in the database" });
    }
  } catch (error) {
    console.error("Internal Server Error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/user-dashboard",
  authenticateToken,
  authorizeRole("user"),
  (req, res) => {
    try {
      res.render("user-dashboard");
    } catch (error) {
      console.error("Internal Server Error", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/user-dashboard/client-courses",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const traineesCourseList = await getTraineeCourseList(userId);
      const traineesCourseSchedule = await getUserAttendanceSchedule(userId);
      res.status(200).json({ traineesCourseList, traineesCourseSchedule });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/user-dashboard/program-list", async (req, res) => {
  try {
    const programs = await getProgramsWithInstructors();

    // Group programs by program_id
    const programList = programs.reduce((acc, row) => {
      const program = acc.find((p) => p.program_id === row.program_id);
      if (program) {
        // Add instructor to the existing program
        program.instructors.push({
          instructor_id: row.instructor_id,
          instructor_name: row.instructor_name,
        });
      } else {
        // Add a new program
        acc.push({
          program_id: row.program_id,
          program_name: row.program_name,
          program_description: row.program_description,
          program_duration: row.program_duration,
          program_fee: row.program_fee,
          program_cover: row.program_cover,
          program_cover_file_type: row.program_cover_file_type,
          availability: row.availability,
          instructors: row.instructor_id
            ? [
                {
                  instructor_id: row.instructor_id,
                  instructor_name: row.instructor_name,
                },
              ]
            : [],
        });
      }
      return acc;
    }, []);
    res.status(200).json({ programList });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/api/user-application/applyTDC",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        instructor,
        startDate,
        startDateAMPM,
        continuation,
        continuationAMPM,
        transmissionType,
        program_id,
      } = req.body;
      console.log("transmissionType,", transmissionType);
      const { userId, role } = req.user;
      await applyTDC(
        instructor,
        startDate,
        startDateAMPM,
        continuation,
        continuationAMPM,
        userId,
        role,
        transmissionType,
        program_id
      );

      if (userId !== 0) {
        const profile = await getUserAccountById(userId);
        let appliedDates = `${startDate} - ${continuation}`;
        await sendEmail("apply-enroll", profile.user_email, {
          name: profile.user_name,
          appliedDates: appliedDates,
        });
      }
      return res.status(200).json({ message: "Submit Success!" });
    } catch (error) {
      console.error("Error applying TDC:", error);
      return res.status(401).json({ error: error.message });
    }
  }
);

app.post(
  "/api/user-application/setTdcDate",
  authenticateToken,
  async (req, res) => {
    try {
      const { tdcInstructor, tdcDate, maxSlots } = req.body;
      const parsedMaxSlots = parseInt(maxSlots, 10);

      if (!Number.isInteger(parsedMaxSlots) || maxSlots <= 0) {
        return res.status(400).json({ error: "Invalid maxSlots value" });
      }
      // Update availability for the TDC date
      await updateAvailability(
        tdcInstructor,
        tdcDate,
        undefined,
        undefined,
        maxSlots
      );

      return res.status(200).json({ message: "TDC Date Set Successfully!" });
    } catch (error) {
      console.error("Error setting TDC date:", error);
      return res.status(500).json({ error: "Error setting TDC date" });
    }
  }
);

// Get Instructor Availability Endpoint
app.get("/api/instructors/:id/availability", async (req, res) => {
  try {
    const instructorId = req.params.id;
    const rows = await checkInstructorAvailability(instructorId);

    const availability = {};
    rows.forEach((row) => {
      availability[row.date] = {
        am: row.am_available,
        pm: row.pm_available,
        onsite: row.onsite_slots,
      };
    });

    res.json(availability);
  } catch (error) {
    console.error("Error fetching instructor availability:", error);
    return res
      .status(500)
      .json({ error: "Error fetching instructor availability" });
  }
});

/*
// Update Instructor Availability Endpoint
app.post(
  "/api/instructors/:id/availability",
  authenticateToken,
  async (req, res) => {
    try {
      const instructorId = req.params.id;
      const { startDate, startDateAMPM, continuation, continuationAMPM } =
        req.body;

      // Update availability for the starting date
      await updateAvailability(
        instructorId,
        startDate,
        startDateAMPM === "AM" ? true : undefined,
        startDateAMPM === "PM" ? true : undefined,
        undefined
      );

      // Update availability for the continuation date
      await updateAvailability(
        instructorId,
        continuation,
        continuationAMPM === "AM" ? true : undefined,
        continuationAMPM === "PM" ? true : undefined,
        undefined
      );

      res.json({ message: "Availability updated for both dates" });
    } catch (error) {
      console.error("Error updating availability:", error);
      return res.status(500).json({ error: "Error updating availability" });
    }
  }
);
*/

app.get(
  "/user-programs",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      res.render("user-programs");
    } catch (error) {
      console.error("Internal Server Error", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/applications-list",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const applicantlist = await getApplicant(userId);
      res.status(200).json(applicantlist);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/user-search", authenticateToken, async (req, res) => {
  try {
    res.render("user-search");
  } catch (error) {
    console.error("Internal Server Error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/user-requests",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      res.render("user-requests");
    } catch (error) {
      console.error("Internal Server Error", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/api/submit-request", authenticateToken, async (req, res) => {
  try {
    const { titleRequest, detailsRequest, userID } = req.body;
    if (!titleRequest || !detailsRequest) {
      res.status(400).json({ error: "Please Provide all fields!" });
      return;
    } else {
      const requestId = await addUserRequest(
        titleRequest,
        detailsRequest,
        userID
      );
      res
        .status(201)
        .json({ message: "Request added successfully", requestId });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/api/user-requests/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await getUserRequest(id);
    res.json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get(
  "/api/user-requests/:userId/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const userID = req.params.userId;
      const requestId = req.params.requestId;
      const data = await getUserDetailRequest(userID, requestId);
      res.json(data);
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/user-reports",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      res.render("user-reports");
    } catch (error) {
      console.error("Internal Server Error", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/api/submit-report", authenticateToken, async (req, res) => {
  try {
    const { titleReport, detailsReport, userID } = req.body;
    if (!titleReport || !detailsReport) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    } else {
      const reportId = await addUserReport(titleReport, detailsReport, userID);
      res.status(201).json({ message: "Report added successfully", reportId });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/api/user-reports/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await getUserReport(id);
    res.json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/user-reports/:userId/:reportId", async (req, res) => {
  try {
    const userID = req.params.userId;
    const reportId = req.params.reportId;
    const data = await getUserDetailReport(userID, reportId);
    res.json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/user-payments", authenticateToken, (req, res) => {
  res.render("user-payment");
});

app.get(
  "/api/user-payments/list",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const id = req.user.userId;
      const paymentList = await getUserPaymentsLogs(id);
      res.status(200).json(paymentList);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/user-payments/details-list",
  authenticateToken,
  async (req, res) => {
    try {
      const id = req.user.userId;
      const courseList = await getTraineeCourseList(id);
      const methodList = await getAllPaymentMethods();
      const paymentCourses = courseList.map((payment) => ({
        course_id: payment.course_id,
        course_name: payment.program_name,
        course_price: payment.program_fee,
        isPaid: payment.isPaid,
      }));
      const paymentMethods = methodList.map((method) => ({
        ...method,
        method_file: method.method_file
          ? `data:${
              method.method_file_type
            };base64,${method.method_file.toString("base64")}`
          : "",
      }));

      res.status(200).json({ paymentMethods, paymentCourses });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/admin-registration", async (req, res) => {
  try {
    res.render("admin-registration-form");
  } catch (error) {
    res.send("Failed to render registration form for admin");
  }
});

app.post("/api/admin-registration", async (req, res) => {
  try {
    const { admin_name, user_email, user_password } = req.body;
    if (!admin_name || !user_email || !user_password) {
      return res.status(400).json({ error: "Please provide all fields." });
    }
    if (!validator.isEmail(user_email)) {
      return res.status(401).json({ error: "Invalid email format." });
    }

    // Check if email already exists in the database
    try {
      const existingUser = await adminCheckEmail(user_email);
      if (existingUser) {
        return res.status(402).json({ error: "Email already exists" });
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return res.status(500).json({ error: "Error checking email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(user_password, 10);

    // Save the new user to the database
    const newUser = {
      admin_name,
      user_email,
      user_password: hashedPassword,
      account_role: "admin",
      isVerify: "false",
    };
    const userId = await saveAdminAccount(newUser);

    // Generate a JWT token
    const token = jwt.sign({ userId }, secretKey, { expiresIn: "1h" });

    await sendEmail("new-account", email, {
      name: admin_name,
      email: user_email,
      generatedPassword: user_password,
      dateCreated: new Date().toLocaleDateString(),
    });

    // Send a successful response with the token
    return res
      .status(201)
      .json({ message: "Admin registered successfully", token });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/adminlogin", (req, res) => {
  try {
    const error = req.query.error;
    res.render("adminlogin", { error });
  } catch (error) {
    console.error("Internal Server Error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/adminlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please Provide all fields" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const admin = await adminCheckEmail(email);
    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.user_password);
      if (passwordMatch) {
        const token = jwt.sign(
          { userId: admin.account_id, role: admin.account_role },
          secretKey,
          {
            expiresIn: "1h",
          }
        );

        res.cookie("jwtToken", token, {
          maxAge: 3600000,
          httpOnly: true,
        });
        console.log("Token set in cookie:", token); // Add logging for token

        return res
          .status(200)
          .json({ message: "Admin login Successful", token: token });
      } else {
        return res
          .status(401)
          .json({ error: "Entered password is not correct" });
      }
    } else {
      return res
        .status(401)
        .json({ error: "Entered email is not in the database" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get(
  "/admin-dashboard",
  authenticateToken,
  authorizeRole(["admin", "instructor"]),
  async (req, res) => {
    try {
      const role = req.user.role;
      return role === "admin"
        ? res.render("admin-dashboard")
        : role === "instructor"
        ? res.render("instructor-dashboard")
        : res.send("invalid role type");
    } catch (error) {
      console.error("Error in /admin-dashboard endpoint:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/admin-dashboard-time/:month/:year", async (req, res) => {
  try {
    const month = req.params.month;
    const year = parseInt(req.params.year, 10);
    const data = await getDayplusTP(month, year);
    res.status(200).json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get(
  "/api/admin-dashboard/dashboard-details",
  authenticateToken,
  async (req, res) => {
    try {
      const methodList = await getAllPaymentMethods();
      const scheduleList = await getInstructorScheduleForToday();
      res.status(200).json({ methodList, scheduleList });
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.post(
  "/api/payment-methods/add",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("methodFile"),
  async (req, res) => {
    try {
      const { methodName, availability } = req.body;
      const methodFile = req.file ? req.file.buffer : null;
      const methodFileType = req.file ? req.file.mimetype : null;

      await addPaymentMethod(
        methodName,
        availability,
        methodFile,
        methodFileType
      );
      res.status(200).json({ message: "Payment Method Added Successfully!" });
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Edit Payment Method
app.put(
  "/api/payment-method/edit",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { methodId, methodName, availability } = req.body;
      await editPaymentMethod(methodId, methodName, availability);
      res.status(200).json({ message: "Payment Method changed successfully!" });
    } catch (error) {
      console.error("Error editing payment method:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Upload Payment Method File
app.post(
  "/api/payment-methods/upload/:methodId",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("method-file"),
  async (req, res) => {
    try {
      const methodId = req.params.methodId;
      const methodFile = req.file ? req.file.buffer : null;
      const methodFileType = req.file ? req.file.mimetype : null;

      await uploadPaymentMethodFile(methodId, methodFile, methodFileType);
      res.status(200).json({ message: "File uploaded successfully!" });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete Payment Method
app.delete(
  "/api/payment-methods/:methodId",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const methodId = req.params.methodId;
      await deletePaymentMethod(methodId);
      res
        .status(200)
        .json({ message: `Successfully Deleted Method ID no. ${methodId}` });
    } catch (error) {
      console.error("Error deleting method:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/instructor/attendance-list",
  authenticateToken,
  authorizeRole("instructor"),
  async (req, res) => {
    try {
      // const id = req.params.instructorId;
      const { userId } = req.user;
      const instructor = await getInstructorWithAccountId(userId);
      const instructorId = instructor.instructor_id;
      const data = await getAttendanceByInstructorId(instructorId);
      res.status(200).json(data);
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/api/instructor-dashboard/trainee-info/:courseID",
  async (req, res) => {
    try {
      const id = req.params.courseID;
      const data = await getTraineeCourseInfo(id);
      res.status(200).json(data);
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/attendance",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    res.render("attendance-pdc-tdc");
  }
);

app.get(
  "/api/attendance/:type",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const type = req.params.type;
      const attendanceList = await getAllPdcTdcTakers(type);
      return res.status(200).json(attendanceList);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put(
  "/api/attendance/status/:id",
  authenticateToken,
  authorizeRole(["admin", "instructor"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { status, hoursAttended } = req.body;
      console.log("status, hoursAttended", status, hoursAttended);
      const changeStatus = await changeAttendanceStatus(
        id,
        status,
        hoursAttended
      );
      return res.status(200).json(changeStatus);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/applicants",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("applicants");
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/applicants-list",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("applicants-list");
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/api/applicants/list",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const applicantlist = await getApplicants();
      res.status(200).json(applicantlist);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.delete("/api/applicant/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await deleteApplication(id);
    return res.status(200).json({ deleted });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/manage-people",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("manage-people");
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/manage-people/list", authenticateToken, async (req, res) => {
  try {
    const instructorList = await getInstructors();
    return res.status(200).json({ instructorList });
  } catch (error) {
    console.error("Error fetching Instructors Data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post(
  "/api/manage-people/instructor-add",
  authenticateToken,
  upload.none(),
  async (req, res) => {
    try {
      const {
        "instructor-name": name,
        "rate-per-hour": rate,
        "instructor-type": type,
        "tdc-onsite": onsite,
        "is-manual": manual,
        "is-automatic": automatic,
        "accreditaion-number": accreditationNumber,
        "date-started": dateStarted,
      } = req.body;
      await addInstructor(
        name,
        rate,
        type,
        onsite,
        manual,
        automatic,
        accreditationNumber,
        dateStarted
      );
      return res.status(200);
    } catch (error) {
      console.error("Error fetching Instructors Data:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.post(
  "/api/manage-people/assign-account/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { userName, userEmail, accountRole } = req.body;

      if (!validator.isEmail(userEmail)) {
        return res.status(400).json({ error: "Invalid email format." });
      }

      // Check if email already exists in the database
      const emailCheck = await adminCheckEmail(userEmail);
      if (emailCheck) {
        return res
          .status(401)
          .json({ error: "Email already assigned to an account" });
      }

      const temporaryPass = generateTemporaryPassword(8);
      const hashedPassword = await bcrypt.hash(temporaryPass, 10);

      // Save the new user to the database
      const newUser = {
        name: userName,
        email: userEmail,
        password: hashedPassword,
        account_role: accountRole,
        isVerify: "false",
      };

      const accountId = await saveAdminAccount(newUser);

      await assignAccountToInstructor(id, accountId);

      await sendEmail("new-account", userEmail, {
        name: userName,
        email: userEmail,
        generatedPassword: temporaryPass,
        dateCreated: new Date().toLocaleDateString(),
      });

      return res.status(201).json({ message: "Account assigned successfully" });
    } catch (error) {
      console.error("Error fetching Instructors Data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/api/manage-people/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const instructor = await getInstructorwithId(id);
    return res.status(200).json({ instructor });
  } catch (error) {
    console.error("Error fetching Instructors Data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.put(
  "/api/manage-people/:id",
  authenticateToken,
  upload.none(),
  async (req, res) => {
    try {
      const userID = req.params.id;
      const {
        "instructor-name": name,
        "rate-per-hour": rate,
        "instructor-type": type,
        "tdc-onsite": onsite,
        "is-manual": manual,
        "is-automatic": automatic,
        "accreditaion-number": accreditationNumber,
        "date-started": dateStarted,
      } = req.body;

      // Fetch existing user profile from the database
      const existingInstructor = await getInstructorwithId(userID);

      // Log the existing profile
      console.log("Existing Profile:", existingInstructor);

      // Create an object with only the changed fields
      const updatedProfile = {};

      if (name && name !== existingInstructor.instructor_name)
        updatedProfile.instructor_name = name;
      if (rate && rate !== existingInstructor.rate_per_hour)
        updatedProfile.rate_per_hour = rate;
      if (type && type !== existingInstructor.instructor_type)
        updatedProfile.instructor_type = type;
      if (onsite && onsite !== existingInstructor.isTdcOnsite)
        updatedProfile.isTdcOnsite = onsite;
      if (manual && manual !== existingInstructor.isManual)
        updatedProfile.isManual = manual;
      if (automatic && automatic !== existingInstructor.isAutomatic)
        updatedProfile.isAutomatic = automatic;
      if (
        accreditationNumber &&
        accreditationNumber !== existingInstructor.accreditationNumber
      )
        updatedProfile.accreditationNumber = accreditationNumber;
      if (dateStarted && dateStarted !== existingInstructor.date_started)
        updatedProfile.date_started = dateStarted;
      await updateInstructorInfo(userID, updatedProfile);

      return res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error Updating Profile:", error);
      return res.status(400).json({ error: "Error Updating Profile!" });
    }
  }
);

app.get(
  "/api/manage-people/payroll/:ID",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.ID;
      const instructorPayroll = await getInstructorPayroll(id);
      return res.status(200).json(instructorPayroll);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/manage-people/current-payroll/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const weeklyHistoryData = await getCurrentPayroll(id);
      const currentWeekPayrollData = await getWeeklyPayroll(id);

      // Convert objects to arrays if needed
      const weeklyHistoryArray = Object.values(weeklyHistoryData);
      const currentWeekPayrollArray = [currentWeekPayrollData]; // Wrap single object in an array

      return res.status(200).json({
        weeklyHistoryData: weeklyHistoryArray,
        currentWeekPayrollData: currentWeekPayrollArray,
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/instructor-payments/monthly",
  authenticateToken,
  authorizeRole("instructor"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const id = await getInstructorWithAccountId(userId);
      const instructorPayroll = await getInstructorPayroll(id.instructor_id);
      return res.status(200).json(instructorPayroll);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/instructor-payments/weekly",
  authenticateToken,
  authorizeRole("instructor"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const id = await getInstructorWithAccountId(userId);

      const weeklyHistoryData = await getCurrentPayroll(id.instructor_id);
      const currentWeekPayrollData = await getWeeklyPayroll(id.instructor_id);

      // Convert objects to arrays if needed
      const weeklyHistoryArray = Object.values(weeklyHistoryData);
      const currentWeekPayrollArray = [currentWeekPayrollData]; // Wrap single object in an array

      return res.status(200).json({
        weeklyHistoryData: weeklyHistoryArray,
        currentWeekPayrollData: currentWeekPayrollArray,
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete("/api/manage-people/:rowID", authenticateToken, async (req, res) => {
  try {
    const id = req.params.rowID;
    const deleted = await deleteInstructor(id);
    return res.json(deleted);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/programs",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("programs");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/api/programs/list",
  authenticateToken,
  authorizeRole(["admin", "user"]),
  async (req, res) => {
    try {
      const programList = await getAllPrograms();
      return res.status(200).json({ programList });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/api/program/add", authenticateToken, async (req, res) => {
  try {
    const {
      programName,
      status,
      programDuration,
      programFee,
      programDescription,
    } = req.body;
    if (!programName || !status) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    } else {
      const reportId = await addProgram(
        programName,
        status,
        programDuration,
        programFee,
        programDescription
      );
      res.status(201).json({ message: "Program added successfully", reportId });
    }
    res.status;
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.put("/api/programs/:id", authenticateToken, async (req, res) => {
  try {
    const { id, name, availability, duration, fee, description } = req.body;
    const cloneId = req.params.id;
    await editOneProgram(
      id,
      name,
      availability,
      duration,
      fee,
      description,
      cloneId
    );
    return res.status(200).json({ message: "Program edited successfully" });
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/api/programs/program-cover/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("program-cover"),
  async (req, res) => {
    const id = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Call the database function to store the file
      await uploadProgramCover(id, file.buffer, file.mimetype);
      res.status(200).json({ message: "Photo uploaded successfully!" });
    } catch (error) {
      console.error("Error storing vehicle photo:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/api/programs/name-list", authenticateToken, async (req, res) => {
  try {
    const instructorList = await getInstructors();
    const instructorsNameList = instructorList.map((instructor) => ({
      instructor_id: instructor.instructor_id,
      instructor_name: instructor.instructor_name,
    }));
    return res.status(200).json({ instructorsNameList });
  } catch (error) {
    console.error("Error fetching Instructors Data:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Assigning programs to instructors
app.post("/api/assign-programs", async (req, res) => {
  const { instructor_id, program_ids } = req.body;

  if (
    !instructor_id ||
    !Array.isArray(program_ids) ||
    program_ids.length === 0
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    await assignPrograms(instructor_id, program_ids);
    res.status(200).json({ message: "Programs assigned successfully" });
  } catch (error) {
    console.error("Error assigning programs:", error);
    res.status(500).json({ error: "Failed to assign programs" });
  }
});

app.get(
  "/api/programs/assigned-list",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const assignedPrograms = await getAssignedPrograms();
      return res.status(200).json(assignedPrograms);
    } catch (error) {
      console.error("Error fetching assigned programs:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//Unassigning programs from instructos
app.post("/api/unassign-programs", async (req, res) => {
  const { instructor_id, program_ids } = req.body;

  if (
    !instructor_id ||
    !Array.isArray(program_ids) ||
    program_ids.length === 0
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    await unassignPrograms(instructor_id, program_ids);
    res.status(200).json({ message: "Programs unassigned successfully" });
  } catch (error) {
    console.error("Error unassigning programs:", error);
    res.status(500).json({ error: "Failed to unassign programs" });
  }
});

app.delete("/api/programs/:rowID", authenticateToken, async (req, res) => {
  try {
    const id = req.params.rowID;
    const deleted = await deleteProgram(id);
    return res.status(200).json(deleted);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/requests",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("requests");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/requests/list", authenticateToken, async (req, res) => {
  try {
    const requestlist = await getAllRequests();
    return res.status(200).json({ requestlist });
  } catch (error) {
    console.error("Error fetching request details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/request/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const request = await getOneRequest(id);
      res.json(request);
    } catch (error) {
      console.error("Error fetching request details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put(
  "/api/request/change-status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { status, reason, rowId } = req.body;
      console.log(status, reason, rowId);
      const request = await editUserRequest(status, reason, rowId);
      return res.status(200).json(request);
    } catch (error) {
      console.error("Error changing request details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/certificates",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("certificates");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/certificates", authenticateToken, async (req, res) => {
  try {
    const certList = await getAllCert();
    return res.json({ certList });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/certificate/add", authenticateToken, async (req, res) => {
  try {
    const { certificateID, certificateName } = req.body;
    if ((!certificateID, !certificateName)) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    } else {
      const certificatetId = await addCertificate(
        certificateID,
        certificateName
      );
      res
        .status(201)
        .json({ message: "Certificate added successfully", certificatetId });
    }
    res.status;
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.post(
  "/api/certificates/template/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("template-file"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const file = req.file;
      const certificate = await uploadCertificateTemplate(
        id,
        file.buffer,
        file.mimetype
      );
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching report details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put("/api/certificates/:id", authenticateToken, async (req, res) => {
  try {
    const { id, name } = req.body;
    const certificate = await editOneCertificate(id, name);
    return res.status(200).json(certificate);
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/certificates/:rowID", authenticateToken, async (req, res) => {
  try {
    const id = req.params.rowID;
    const deleted = await deleteCertificate(id);
    return res.json(deleted);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/reports",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("reports");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/report/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const report = await getOneReport(id);
    res.json(report);
  } catch (error) {
    console.error("Error fetching report details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/reports/list", authenticateToken, async (req, res) => {
  try {
    const reportlist = await getAllReports();
    return res.status(200).json({ reportlist });
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put(
  "/api/report/change-status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { status, reason, rowId } = req.body;
      console.log(status, reason, rowId);
      const report = await editUserReport(status, reason, rowId);
      return res.status(200).json(report);
    } catch (error) {
      console.error("Error changing report details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/payments",
  authenticateToken,
  authorizeRole(["admin", "instructor"]),
  async (req, res) => {
    try {
      const role = req.user.role;
      if (role === "admin") {
        return res.render("payments");
      } else {
        return res.render("instructor-payments");
      }
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/api/payments",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const paymentList = await getPaymentsLogs();
      res.status(200).json(paymentList);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/payment/add",
  authenticateToken,
  authorizeRole(["admin", "user"]),
  upload.single("screenshotReceipt"),
  async (req, res) => {
    try {
      const { accountName, id, amount, paymentMethod, courseSelect } = req.body;
      if (!accountName || !amount || !paymentMethod || !courseSelect) {
        return res.status(400).json({ error: "Please Provide all fields!" });
      }
      const userId = req.user.role === "admin" ? id : req.user.userId;
      let compressedReceipt = null;

      if (req.file) {
        compressedReceipt = await sharp(req.file.buffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      await addPayments(
        userId,
        accountName,
        amount,
        paymentMethod,
        compressedReceipt,
        courseSelect
      );
      res.status(200).json({ message: "Payment added successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/payments/receipt/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("screenshot-receipt"),
  async (req, res) => {
    try {
      const id = req.params.id;
      let compressedReceipt = null;

      if (req.file) {
        compressedReceipt = await sharp(req.file.buffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      await uploadPhotoReceipt(id, compressedReceipt);
      res.status(200).json({ message: "Photo Receipt uploaded successfully!" });
    } catch (error) {
      console.error("Error fetching report details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put(
  "/api/payments",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { paymentId, status } = req.body;
      await changePaymentStatus(paymentId, status);
      res.status(200).json({ message: "Payment Status changed successfully!" });
    } catch (error) {
      console.error("Error fetching report details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/api/payments/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      await deletePaymentInfo(id);
      return res
        .status(200)
        .json({ message: "Trainee course info Deleted successfully!" });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/instructors", async (req, res) => {
  try {
    const instructors = await getInstructorDetailsForApplicants();
    const assignedPrograms = await getAssignedPrograms();
    const paymentMethodList = await getAllPaymentMethods();
    const assignedProgramToInstructor = assignedPrograms.map((program) => ({
      instructor_id: program.instructor_id,
      program_id: program.program_id,
      program_name: program.program_name,
    }));
    return res
      .status(200)
      .json({ instructors, assignedProgramToInstructor, paymentMethodList });
  } catch (error) {
    return res.status(400).json({ error: "Failed to connect to the server!" });
  }
});

app.get(
  "/completed-course",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("finished-trainees-course");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/api/completed-course",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const completedCourseList = await getCompletedCourseList();
      return res.status(200).json(completedCourseList);
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.put(
  "/api/completed-course/edit-hours/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const totalHours = req.body.totalHours;
      await editTraineeCompletedCourseInfo(id, totalHours);
      return res.status(200).send("Trainee course hours updated successfully!");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.post(
  "/api/completed-course/certificate-upload/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("certificate-completion-file"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const file = req.file;
      await uploadTraineeCompletionCertificate(id, file.buffer, file.mimetype);
      return res
        .status(200)
        .json({ message: "Completion Certificate uploaded successfully!" });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.delete(
  "/api/completed-course/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, dateStarted, continuation } = req.body;
      await deleteTraineeCourseInfo(userId, dateStarted, continuation);
      return res
        .status(200)
        .json({ message: "Trainee course info Deleted successfully!" });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/vehicles",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("list-of-vehicles");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/api/vehicles", authenticateToken, async (req, res) => {
  try {
    const vehicleList = await getAllVehicle();
    return res.json({ vehicleList });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/vehicle/add", authenticateToken, async (req, res) => {
  try {
    const { plateNumber, vehicleModel, year, vehicleType } = req.body;
    if ((!plateNumber, !vehicleModel, !year, !vehicleType)) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    } else {
      const vehicletId = await addVehicle(
        plateNumber,
        vehicleModel,
        year,
        vehicleType
      );
      res
        .status(201)
        .json({ message: "Vehicle added successfully", plateNumber });
    }
    res.status;
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.put(
  "/api/vehicles/:rowID/:status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const id = req.params.rowID;
    const status = req.params.status;
    try {
      await updateVehicleStatus(id, status);
      return res
        .status(200)
        .json({ message: "Vehicle status updated successfully!" });
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/vehicles/lto/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("lto-file"),
  async (req, res) => {
    const vehicleId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Call the database function to store the file
      await storeLtoDocument(vehicleId, file.buffer, file.mimetype);
      res.status(200).json({ message: "LTO uploaded successfully!" });
    } catch (error) {
      console.error("Error storing LTO document:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/vehicles/vehicle-photo/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("vehicle-file"),
  async (req, res) => {
    const vehicleId = req.params.id;
    let compressedPhoto = null;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    compressedPhoto = await sharp(req.file.buffer)
      .jpeg({ quality: 85 })
      .toBuffer();

    try {
      // Call the database function to store the file
      await uploadVehiclePhoto(vehicleId, compressedPhoto, req.file.mimetype);
      res.status(200).json({ message: "Photo uploaded successfully!" });
    } catch (error) {
      console.error("Error storing vehicle photo:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put("/api/vehicles/:id", authenticateToken, async (req, res) => {
  try {
    const vehicleID = req.params.id;
    const { plateNumber, vehicleModel, year, vehicleType } = req.body;
    const vehicle = await editOneVehicle(
      plateNumber,
      vehicleModel,
      year,
      vehicleType,
      vehicleID
    );
    return res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/vehicles/:rowID", authenticateToken, async (req, res) => {
  try {
    const id = req.params.rowID;
    const deleted = await deleteVehicle(id);
    return res.json(deleted);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/api/notifications",
  authenticateToken,
  authorizeRole(["user", "admin", "instructor"]),
  async (req, res) => {
    try {
      const { userId, role } = req.user;

      const notifData = await getNotifications(userId, role);
      res.status(200).json(notifData);
    } catch (error) {
      console.error("failed to fetch notifications", error);
      res.status(500).json({ message: "failed to fetch notifications" });
    }
  }
);

app.get(
  "/instructor-payment",
  authenticateToken,
  authorizeRole("instructor"),
  async (req, res) => {
    try {
      res.render("instructor-payments");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/change-password-email-option", async (req, res) => {
  try {
    const captchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    res.render("change-password-email-option", {
      captchaSiteKey,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint for email or PRN search
app.post(
  "/api/change-password-email-option/email-search/:type",
  async (req, res) => {
    const { prn, email, recaptchaToken } = req.body;
    const { type } = req.params;

    // Validate input
    if (
      (!prn && type === "email") ||
      (!email && type === "password") ||
      !recaptchaToken
    ) {
      return res.status(400).json({
        error: `${
          type === "email" ? "PRN" : "Email"
        } and reCAPTCHA token are required.`,
      });
    }

    try {
      // Verify reCAPTCHA token with Google
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: recaptchaToken,
          },
        }
      );

      const { success, challenge_ts } = recaptchaResponse.data;

      if (!success) {
        return res
          .status(400)
          .json({ error: "reCAPTCHA verification failed." });
      }

      // Query the database for the user by PRN or email
      let user;
      if (type === "email") {
        user = await findAccountByPRN(prn); // Replace with your database query for PRN
      } else if (type === "password") {
        user = await findAccountForChangingPassOrEmail(email);
      }

      if (!user) {
        return res.status(404).json({
          error: `User not found using ${type === "email" ? "PRN" : "Email"}.`,
        });
      }

      // Format the date_created field
      if (user.date_created) {
        const date = new Date(user.date_created);
        user.date_created = date.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }

      // Generate a JWT with the necessary data
      const token = jwt.sign(
        {
          email: user.email,
          type: type,
          recaptchaVerified: success,
          timestamp: challenge_ts,
        },
        secretKey,
        { expiresIn: "20m" }
      );

      // Set the JWT as a cookie
      res.cookie("changePasswordEmailToken", token, {
        httpOnly: true, // Prevent client-side access
        maxAge: 20 * 60 * 1000,
      });

      // Return user data (excluding sensitive information)
      res.status(200).json(user);
    } catch (error) {
      console.error("Error handling email or PRN search:", error);
      res.status(500).json({ error: "Internal Server Error." });
    }
  }
);

app.post(
  "/api/change-password",
  authenticateTokenForChangingCredentials,
  async (req, res) => {
    const token = req.cookies.changePasswordToken;
    const { newPassword } = req.body;
    const { email } = req.tokenData;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Token not found." });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, secretKey);

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const profile = await findAccountForChangingPassOrEmail(email);

      // Update the password in the database
      await updateUserCredential(
        profile.id,
        profile.account_role,
        hashedPassword,
        "password"
      );
      await sendEmail("password-changed", email, {
        name: profile.name,
        email: profile.email,
        password: newPassword,
        dateModified: new Date().toLocaleDateString(),
      });

      // Clear the token cookie
      res.clearCookie("changePasswordToken");
      res.clearCookie("changePasswordEmailToken");

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/change-password-otp",
  authenticateTokenForChangingCredentials,
  async (req, res) => {
    const { newPassword, otp } = req.body;
    const { email } = req.tokenData;

    const profile = await findAccountForChangingPassOrEmail(email);

    const isOTPValid = await verifyOtp(profile.id, otp, "password");
    if (!isOTPValid) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    const isPassValid = validator.isStrongPassword(newPassword, {
      minLength: 8,
      minUppercase: 2,
      minNumbers: 2,
      minSymbols: 0,
    });
    if (!isPassValid) {
      return res.status(402).json({ error: "Password not strong enough" });
    }

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the database
      await updateUserCredential(
        profile.id,
        profile.account_role,
        hashedPassword,
        "password"
      );

      await sendEmail("password-changed", email, {
        name: profile.name,
        email: profile.email,
        password: newPassword,
        dateModified: new Date().toLocaleDateString(),
      });
      // Clear the token cookie
      res.clearCookie("changePasswordToken");
      res.clearCookie("changePasswordEmailToken");

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/change-email-otp",
  authenticateTokenForChangingCredentials,
  async (req, res) => {
    const { oldEmail, newEmail, otp } = req.body;

    if (!validator.isEmail(newEmail)) {
      return res.status(400).json({ error: "New email's format is invalid ." });
    }

    const profile = await findAccountForChangingPassOrEmail(oldEmail);

    const isOTPValid = await verifyOtp(profile.id, otp, "email");
    if (!isOTPValid) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    try {
      // Update the password in the database
      await updateUserCredential(
        profile.id,
        profile.account_role,
        newEmail,
        "email"
      );

      await sendEmail("password-changed", newEmail, {
        name: profile.name,
        email: newEmail,
        password: "cannot be shown",
        dateModified: new Date().toLocaleDateString(),
      });
      // Clear the token cookie
      res.clearCookie("changePasswordToken");
      res.clearCookie("changePasswordEmailToken");

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/api/change-password-email-option/send-code", async (req, res) => {
  try {
    const { id, email, type } = req.body;
    const userType = !req.user?.role ? "user" : req.user.role;

    // Generate a 6-digit OTP
    const generateOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = await bcrypt.hash(generateOTP, 10);
    // Save the OTP and request details in the database
    await saveChangePasswordRequest(id, userType, otp, type);
    await sendEmail("forgot-password-email", email, {
      otp: generateOTP,
    });
    res.status(200).json({ message: "OTP email sent successfully" });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/logout",
  authenticateToken,
  authorizeRole(["admin", "user", "instructor"]),
  (req, res) => {
    const role = req.user.role;
    if (!role) {
      console.error("No user role found");
      return res.redirect("/user-login");
    }
    const logoutLink = role === "user" ? "/user-login" : "/adminlogin";

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        } else {
          // Clear all cookies after session destruction
          res.clearCookie("connect.sid", { path: "/" });
          res.clearCookie("adminSession", { path: "/" });
          res.clearCookie("userSession", { path: "/" });
          res.clearCookie("jwtToken", { path: "/" });

          // Redirect only after clearing cookies
          return res.redirect(logoutLink);
        }
      });
    } else {
      // Fallback case if no session exists
      res.clearCookie("jwtToken", { path: "/" });
      res.redirect(logoutLink);
    }
  }
);

let browserInstance; // Singleton browser instance

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch();
  }
  return browserInstance;
}

app.get("/certificates-completion-pdc", async (req, res) => {
  const { userId, courseId, instructorId } = req.query;

  const logoPath = path.join(
    __dirname,
    "/f-css/solid/drivers_ed_logo-no-bg.png"
  );
  const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
    logoPath,
    "base64"
  )}`;

  // Example data to pass to the EJS template
  const dlCodesLeft = [
    { code: "A (L1,L2,L3)", mt: false, at: false },
    { code: "A1 (L4,L5,L6,L7)", mt: false, at: false },
    { code: "B (M1)", mt: false, at: false },
    { code: "B1 (M2)", mt: false, at: false },
    { code: "B2 (N1)", mt: false, at: false },
  ];

  const dlCodesRight = [
    { code: "BE (01, 02)", mt: false, at: false },
    { code: "C (N2, N3)", mt: false, at: false },
    { code: "CE (03, 04)", mt: false, at: false },
    { code: "D (M3)", mt: false, at: false },
  ];
  const instructor = await getInstructorwithId(instructorId);
  const user = await getProfilewithUserId(userId);
  const trainee_course = await getTraineeCourseInfo(courseId);

  const genControlNumber = generateTemporaryPassword(32); //re-use a randomize genenerator
  const genCertificateNumber = generateTemporaryPassword(14);

  const certificateInputs = [
    {
      controlNumber: genControlNumber,
      certificateNumber: genCertificateNumber,
      accredNumOfBranch: "123456789",
      driversEdLogo: driversEdLogo,
    },
  ];

  const userProfile = [
    {
      firstName: user.first_name,
      lastName: user.last_name,
      middleName: user.middle_name,
      address: user.address,
      ltoClientId: user.lto_client_id,
      birthday: user.birth_date,
      gender: user.gender,
      civilStatus: user.civil_status,
      nationality: user.nationality,
    },
  ];

  // Calculate the age after defining the userProfile
  userProfile[0].age = user.birth_date
    ? Math.floor(
        (new Date() - new Date(user.birth_date)) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  const profilePicture = user.profile_picture
    ? `data:image/jpeg;base64,${user.profile_picture.toString("base64")}`
    : null;
  userProfile[0].picture = profilePicture;

  const userCourse = [
    {
      courseName: trainee_course.program_name,
      date_started: trainee_course.date_started,
      date_finished: trainee_course.date_completed,
      total_hours: trainee_course.total_hours,
    },
  ];

  const instructorProfile = [
    {
      name: instructor.instructor_name,
      accredNumOfInstructor: instructor.accreditation_number,
    },
  ];

  res.render("certificate-of-completion-PDC", {
    dlCodesLeft,
    dlCodesRight,
    certificateInputs,
    userProfile,
    userCourse,
    instructorProfile,
    userId,
    courseId,
    instructorId,
  });
});

app.post("/certificates-completion-pdc/:type", async (req, res) => {
  try {
    const { userId, instructorId, courseId, dlCodesLeft, dlCodesRight } =
      req.body;
    console.log(
      "userId, courseId, instructorId, dlCodesRight, dlCodesLeft",
      userId,
      courseId,
      instructorId,
      dlCodesRight,
      dlCodesLeft
    );

    const logoPath = path.join(
      __dirname,
      "/f-css/solid/drivers_ed_logo-no-bg.png"
    );
    const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
      logoPath,
      "base64"
    )}`;

    const instructor = await getInstructorwithId(instructorId);
    const user = await getProfilewithUserId(userId);
    const trainee_course = await getTraineeCourseInfo(courseId);

    const genControlNumber = generateTemporaryPassword(32); //re-use a randomize genenerator
    const genCertificateNumber = generateTemporaryPassword(14);

    const certificateInputs = [
      {
        controlNumber: genControlNumber,
        certificateNumber: genCertificateNumber,
        accredNumOfBranch: "123456789",
        driversEdLogo: driversEdLogo,
      },
    ];

    const userProfile = [
      {
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        address: user.address,
        ltoClientId: user.lto_client_id,
        birthday: user.birth_date,
        gender: user.gender,
        civilStatus: user.civil_status,
        nationality: user.nationality,
      },
    ];

    // Calculate the age after defining the userProfile
    userProfile[0].age = user.birth_date
      ? Math.floor(
          (new Date() - new Date(user.birth_date)) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    const profilePicture = user.profile_picture
      ? `data:image/jpeg;base64,${user.profile_picture.toString("base64")}`
      : null;
    userProfile[0].picture = profilePicture;

    const userCourse = [
      {
        courseName: trainee_course.program_name,
        date_started: trainee_course.date_started,
        date_finished: trainee_course.date_completed,
        total_hours: trainee_course.total_hours,
      },
    ];

    const instructorProfile = [
      {
        name: instructor.instructor_name,
        accredNumOfInstructor: instructor.accreditation_number,
      },
    ];

    const html = await new Promise((resolve, reject) => {
      req.app.render(
        "certificate-of-completion-PDC",
        {
          dlCodesLeft,
          dlCodesRight,
          certificateInputs,
          userProfile,
          userCourse,
          instructorProfile,
          userId,
          courseId,
          instructorId,
        },
        (err, renderedHtml) => {
          if (err) reject(err);
          else resolve(renderedHtml);
        }
      );
    });

    const tailwindCSS = fs.readFileSync(
      path.join(__dirname, "/f-css/output.css"),
      "utf8"
    );
    const compiled = html.replace(
      "</head>",
      `<style>${tailwindCSS}</style></head>`
    );

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setContent(compiled, {
      waitUntil: "networkidle0",
    });

    await page.evaluate(() => {
      document.querySelectorAll(".hide-on-print").forEach((el) => el.remove());
    });

    const pdfBuffer = await page.pdf({
      format: "A4", // Change A4 to Letter
      printBackground: true,
    });

    await page.close(); // Closing the page instead of browser

    if (type == "database") {
      await saveCertificateToDatabase(courseId, pdfBuffer, "application/pdf");
      await sendEmail("completion-certificate", user.email, {
        name: user.first_name,
        certificate: pdfBuffer,
      });
    }

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="certificate-pdc.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");
    res.status(200).end(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

app.get("/certificates-completion-tdc", async (req, res) => {
  try {
    const { userId, courseId, instructorId } = req.query;

    const instructor = await getInstructorwithId(instructorId);
    const user = await getProfilewithUserId(userId);
    const trainee_course = await getTraineeCourseInfo(courseId);

    const logoPath = path.join(
      __dirname,
      "/f-css/solid/drivers_ed_logo-no-bg.png"
    );
    const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
      logoPath,
      "base64"
    )}`;
    const genControlNumber = generateTemporaryPassword(32); // Re-use a random generator
    const genCertificateNumber = generateTemporaryPassword(14);

    const certificateInputs = [
      {
        controlNumber: genControlNumber,
        certificateNumber: genCertificateNumber,
        accredNumOfBranch: "123456789",
        driversEdLogo: driversEdLogo,
      },
    ];
    const userProfile = [
      {
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        address: user.address,
        ltoClientId: user.lto_client_id,
        birthday: user.birth_date,
        gender: user.gender,
        civilStatus: user.civil_status,
        nationality: user.nationality,
      },
    ];

    // Calculate the age after defining the userProfile
    userProfile[0].age = user.birth_date
      ? Math.floor(
          (new Date() - new Date(user.birth_date)) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    const profilePicture = user.profile_picture
      ? `data:image/jpeg;base64,${user.profile_picture.toString("base64")}`
      : null;
    userProfile[0].picture = profilePicture;

    const userCourse = [
      {
        courseName: trainee_course.program_name,
        date_started: trainee_course.date_started,
        date_finished: trainee_course.date_completed,
        total_hours: trainee_course.total_hours,
      },
    ];

    const instructorProfile = [
      {
        name: instructor.instructor_name,
        accredNumOfInstructor: instructor.accreditation_number,
      },
    ];

    res.render("certificate-of-completion-TDC", {
      certificateInputs,
      userProfile,
      userCourse,
      instructorProfile,
      userId,
      courseId,
      instructorId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/certificates-completion-tdc/:type", async (req, res) => {
  try {
    const { userId, courseId, instructorId, onsite, online } = req.body;

    const instructor = await getInstructorwithId(instructorId);
    const user = await getProfilewithUserId(userId);
    const trainee_course = await getTraineeCourseInfo(courseId);

    const logoPath = path.join(
      __dirname,
      "/f-css/solid/drivers_ed_logo-no-bg.png"
    );
    const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
      logoPath,
      "base64"
    )}`;

    const genControlNumber = generateTemporaryPassword(32);
    const genCertificateNumber = generateTemporaryPassword(14);

    const certificateInputs = [
      {
        controlNumber: genControlNumber,
        certificateNumber: genCertificateNumber,
        accredNumOfBranch: "123456789",
        driversEdLogo: driversEdLogo,
      },
    ];
    const userProfile = [
      {
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        address: user.address,
        ltoClientId: user.lto_client_id,
        birthday: user.birth_date,
        gender: user.gender,
        civilStatus: user.civil_status,
        nationality: user.nationality,
      },
    ];

    // Calculate the age after defining the userProfile
    userProfile[0].age = Math.floor(
      (new Date() - new Date(userProfile[0].birthday)) /
        (1000 * 60 * 60 * 24 * 365.25)
    );
    const profilePicture = `data:image/jpeg;base64,${user.profile_picture.toString(
      "base64"
    )}`;
    userProfile[0].picture = profilePicture;

    const userCourse = [
      {
        courseName: trainee_course.program_name,
        date_started: trainee_course.date_started,
        date_finished: trainee_course.date_completed,
        total_hours: trainee_course.total_hours,
        modality: onsite ? "onsite" : online ? "online" : "",
      },
    ];

    const instructorProfile = [
      {
        name: instructor.instructor_name,
        accredNumOfInstructor: instructor.accreditation_number,
      },
    ];

    const html = await new Promise((resolve, reject) => {
      req.app.render(
        "certificate-of-completion-TDC",
        {
          certificateInputs,
          userProfile,
          userCourse,
          instructorProfile,
          userId,
          courseId,
          instructorId,
        },
        (err, renderedHtml) => {
          if (err) reject(err);
          else resolve(renderedHtml);
        }
      );
    });

    const tailwindCSS = fs.readFileSync(
      path.join(__dirname, "/f-css/output.css"),
      "utf8"
    );
    const compiled = html.replace(
      "</head>",
      `<style>${tailwindCSS}</style></head>`
    );

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setContent(compiled, {
      waitUntil: "networkidle0",
    });

    await page.evaluate(() => {
      document.querySelectorAll(".hide-on-print").forEach((el) => el.remove());
    });

    const pdfBuffer = await page.pdf({
      format: "A4", // Change A4 to Letter
      printBackground: true,
    });

    await page.close(); // Closing the page instead of browser

    if (type === "database") {
      await saveCertificateToDatabase(courseId, pdfBuffer, "application/pdf");
      await sendEmail("completion-certificate", user.email, {
        name: user.first_name,
        certificate: pdfBuffer,
      });
    }

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="certificate-tdc.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");
    res.status(200).end(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

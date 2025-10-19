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
} from "./config/b-passport.js";

import {
  encryptData,
  decryptData,
  generateKeyPair,
  handlePrivateKey,
} from "./utils/b-encrypt-decrypt.js";
dotenv.config();

const PORT = process.env.port;
const secretKey = process.env.secret_key;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static assets
app.use(express.static(__dirname)); // serves root-level files
app.use("/f-css", express.static(path.join(__dirname, "f-css")));
app.use("/f-jsfiles", express.static(path.join(__dirname, "f-jsfiles"))); // ✅ this is key

// View engine
app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(process.cwd(), "views"));

app.set("trust proxy", "127.0.0.1");

// CORS setup
const corsOptions = {
  origin: process.env.HOST || "*", // fallback for local dev
  credentials: true,
};
app.use(cors(corsOptions));

// Cookie + body parsing
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging
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
    cookie: {
      maxAge: 3600000,
      httpOnly: true,
      secure: true, // Requires HTTPS
      sameSite: "Strict", // Protect against CSRF attacks // (Strict)
    },
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
      { expiresIn: "3h" }
    );
    res.cookie("jwtToken", token, {
      maxAge: 3 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.redirect(`/login-success`);
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
      { expiresIn: "3h" }
    );

    res.cookie("jwtToken", token, {
      maxAge: 3 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.redirect(`/login-success`);
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
        return res.status(401).json({ error });
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

      // Set the JWT as a cookie
      res.cookie("changePasswordToken", token, {
        httpOnly: true, // Prevent client-side access
        maxAge: 20 * 60 * 1000, // 20 minutes
      });

      res.redirect("/change-password-email-option?success=true");
    })(req, res, next);
  }
);

app.post(
  "/api/public-key/share",
  authenticateToken,
  authorizeRole(["user", "instructor", "admin"]),
  async (req, res) => {
    try {
      const clientPublicKey = req.body.clientPublicKey;
      const { publicKey, privateKey } = generateKeyPair();
      const { encrypted, iv } = handlePrivateKey(
        "encrypt",
        secretKey,
        privateKey
      );
      const { userId, role } = req.user;

      await addPrivKeyForUser(userId, role, encrypted, iv, clientPublicKey);
      res.status(200).json({ serverPublicKey: publicKey });
    } catch (error) {
      console.error("Error sharing public key:", error);
      res.status(500).json({ error: "Failed to share public key." });
    }
  }
);

app.post("/trigger-rebuild", (req, res) => {
  try {
    if (req.headers["x-exec-secret"] !== process.env.EXEC_SECRET) {
      return res.status(401).send("Invalid Exec Secret");
    }

    exec(
      "git pull origin main && docker-compose --env-file .env.production up -d",
      (err, stdout, stderr) => {
        if (err) {
          console.error("Rebuild failed:", stderr);
          return res.status(500).send("Rebuild failed");
        }
        console.log("Rebuild successful:", stdout);
        res.status(200).send("Rebuild triggered");
      }
    );
  } catch (error) {
    return res.status(500).send("Trigger Failed");
  }
});

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter); // Apply to all routes

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// import database queries
import {
  addPrivKeyForUser,
  getKeysWithUserId,
  findAccountForChangingPassOrEmail,
  findAccountByPRN,
  findUserAccount,
  userSearch,
  updateUserCredential,
  saveChangePasswordRequest,
  verifyOtp,
  getAllDashboardCounts,
  getDayplusTP,
  getInstructorScheduleForToday,
  getAllPaymentMethods,
  addPaymentMethod,
  editPaymentMethod,
  uploadPaymentMethodFile,
  deletePaymentMethod,
  getApplicants,
  getApplicant,
  deleteUserCourse,
  deleteApplication,
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
  addContinuationDate,
  getAllPdcTdcTakers,
  changeUserAttendanceStatus,
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
  uploadTraineeGradeSheet,
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
  addNotification,
  getNotifications,
  saveCertificateToDatabase,
  setTdcDate,
  deleteTraineeAttendance,
} from "./config/b-database.js";

import {
  authenticateToken,
  authorizeRole,
  authenticateTokenForChangingCredentials,
  generateTemporaryPassword,
  verifyDeleteToken,
} from "./middleware/b-authenticate.js";

import { renderBase64File } from "./utils/file-converter.js";

import { sendEmail } from "./config/b-email-config.js";
import { v4 as uuidv4 } from "uuid";
import redis from "./config/b-redis.js";
import { fileTypeFromBuffer } from "file-type";
import { generateCertificatePDF } from "./utils/generateCertPDF.js";

app.post(
  "/api/delete-token",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id, path } = req.body;
      console.log("path", path);
      if (!id || !path)
        return res.status(400).json({ error: "rowId and path required" });

      const payload = {
        sub: req.user.userId, // bind to user
        id, // bind to resource
        path, // bind to exact endpoint
        jti: uuidv4(), // unique per request
      };

      const TTL_SEC = 120;

      const deleteToken = jwt.sign(payload, secretKey, {
        expiresIn: TTL_SEC,
      });

      // optional audit store
      await redis.setEx(`del:issued:${payload.jti}`, TTL_SEC, "1");

      res.status(200).json({ deleteToken });
    } catch (error) {
      console.error("delete token error:", error);
      res.status(500).json({ error: "Cant make delete token right now." });
    }
  }
);

app.get("/login-success", authenticateToken, (req, res) => {
  res.render("login-loading", {
    role: req.user.role,
  });
});

app.get("/user-registration-form", (req, res) => {
  try {
    res.render("user-registration-form");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

app.get("/user-profile-form", (req, res) => {
  try {
    res.render("user-profile-form");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

app.post(
  "/api/user-profile-submit",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { encryptedWithEncAesKey } = req.body;
      const {
        firstName,
        middleName,
        lastName,
        phoneNumber,
        email,
        nationality,
        gender,
        civilStatus,
        address,
        birthDate,
        ltoClientId,
        identification_card,
        identification_card_picture,
        prn,
        profile_picture,
      } = await decryptData(encryptedWithEncAesKey, userId, role);

      const profilePicture =
        profile_picture !== null ? profile_picture.buffer : null;
      const idCard =
        identification_card_picture !== null
          ? identification_card_picture.buffer
          : null;

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
        identification_card,
        idCard,
        prn,
        profilePicture,
        userId
      );

      await addNotification(
        userId,
        role,
        "Profile",
        "Profile successfully added"
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
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;

      const { encryptedWithEncAesKey } = req.body;
      const {
        firstName,
        middleName,
        lastName,
        phoneNumber,
        email,
        nationality,
        gender,
        civilStatus,
        address,
        birthDate,
        ltoClientId,
        identification_card,
        identification_card_picture,
        prn,
        profile_picture,
      } = await decryptData(encryptedWithEncAesKey, userId, role);
      const profilePicture = profile_picture !== null ? profile_picture : null;
      const idCard =
        identification_card_picture !== null
          ? identification_card_picture
          : null;

      console.log("profilePicture", profilePicture);
      // Fetch existing user profile from the database
      const existingProfile = await getProfilewithUserId(userId);

      // Create an object with only the changed fields
      const updatedProfile = {};

      if (firstName != null && firstName !== existingProfile.first_name)
        updatedProfile.first_name = firstName;

      if (middleName != null && middleName !== existingProfile.middle_name)
        updatedProfile.middle_name = middleName;

      if (lastName != null && lastName !== existingProfile.last_name)
        updatedProfile.last_name = lastName;

      if (phoneNumber != null && phoneNumber !== existingProfile.phone_number)
        updatedProfile.phone_number = phoneNumber;

      if (email != null && email !== existingProfile.email)
        updatedProfile.email = email;

      if (
        birthDate &&
        new Date(birthDate).getTime() !==
          new Date(existingProfile.birth_date).getTime()
      )
        updatedProfile.birth_date = birthDate;

      if (nationality != null && nationality !== existingProfile.nationality)
        updatedProfile.nationality = nationality;

      if (gender != null && gender !== existingProfile.gender)
        updatedProfile.gender = gender;

      if (address != null && address !== existingProfile.address)
        updatedProfile.address = address;

      if (civilStatus != null && civilStatus !== existingProfile.civil_status)
        updatedProfile.civil_status = civilStatus;

      if (ltoClientId != null && ltoClientId !== existingProfile.lto_client_id)
        updatedProfile.lto_client_id = ltoClientId;

      if (prn != null && prn !== existingProfile.prn) updatedProfile.prn = prn;

      if (profilePicture && profilePicture.buffer)
        updatedProfile.profile_picture = profilePicture.buffer;

      if (idCard && idCard.buffer) {
        updatedProfile.identification_card = identification_card;
        updatedProfile.identification_card_picture = idCard.buffer;
      }

      console.log(updatedProfile);
      // Check if there are any fields to update
      if (Object.keys(updatedProfile).length === 0) {
        return res.status(200).json({ message: "No changes detected." });
      }

      await updateUserProfile(userId, updatedProfile);
      await addNotification(
        userId,
        role,
        "Profile",
        "Profile changes successfully edited"
      );
      return res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error Updating Profile:", error);
      return res.status(400).json({ error: "Error Updating Profile!" });
    }
  }
);

app.get("/user-profile", authenticateToken, async (req, res) => {
  try {
    res.render("user-profile");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

app.get(
  "/api/user-profile",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      let userProfileDetails = await getProfilewithUserId(userId);
      const courseList = await getTraineeCourseList(userId);

      if (userProfileDetails) {
        if (userProfileDetails.profile_picture) {
          userProfileDetails.profile_picture = await renderBase64File(
            userProfileDetails.profile_picture
          );
        }
        if (userProfileDetails.identification_card) {
          userProfileDetails.identification_card_picture =
            await renderBase64File(
              userProfileDetails.identification_card_picture
            );
        }

        userProfileDetails.age = userProfileDetails.birth_date
          ? Math.floor(
              (new Date() - new Date(userProfileDetails.birth_date)) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
          : null;
      }

      const userCourseInfoList = courseList
        ? courseList.map((course) => ({
            program_name: course.program_name,
            date_started: course.date_started,
            date_completed: course.date_completed,
            total_hours: course.total_hours,
            program_duration: course.program_duration,
          }))
        : null;

      const data = {
        userProfileDetails: userProfileDetails || null,
        userCourseInfoList,
      };

      const encrypted = await encryptData(data, userId, role);
      return res.status(200).json({ encrypted });
    } catch (error) {
      console.error("User Profile error:", error);
      return res.status(500).json({ error: "Can't fetch data right now!" });
    }
  }
);

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

    await addNotification(
      userId,
      "user",
      "Welcome!!",
      `Greetings to you, ${name}!!
      Thank you for choosing our driving school.`
    );

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
    res.render("error-500", {
      error,
    });
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
            expiresIn: "3h",
          }
        );

        // Set the JWT token in a cookie
        res.cookie("jwtToken", token, {
          maxAge: 3 * 60 * 60 * 1000,
          httpOnly: true,
        });
        return res.status(200).json({
          message: "User login successful",
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
      res.render("error-500", {
        error,
      });
    }
  }
);

app.get(
  "/api/user-dashboard/client-courses",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const traineesCourseList = await getTraineeCourseList(userId);
      const traineesCourseSchedule = await getUserAttendanceSchedule(
        userId,
        role
      );
      res.status(200).json({ traineesCourseList, traineesCourseSchedule });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Error fetching data" });
    }
  }
);

app.get("/api/user-dashboard/program-list", async (req, res) => {
  try {
    const programs = await getProgramsWithInstructors();

    const programMap = new Map();

    for (const row of programs) {
      const existing = programMap.get(row.program_id);

      if (existing) {
        if (row.instructor_id) {
          existing.instructors.push({
            instructor_id: row.instructor_id,
            instructor_name: row.instructor_name,
          });
        }
      } else {
        const cover = await renderBase64File(
          row.program_cover,
          row.program_cover_file_type
        );

        programMap.set(row.program_id, {
          program_id: row.program_id,
          program_name: row.program_name,
          program_description: row.program_description,
          program_duration: row.program_duration,
          program_fee: row.program_fee,
          program_cover: cover,
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
    }

    const programList = Array.from(programMap.values());
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

      let enrolltype = transmissionType == "Onsite" ? "TDC" : "PDC";
      if (userId !== 0) {
        const profile = await getUserAccountById(userId);
        let appliedDates = `${startDate} - ${continuation}`;
        await sendEmail("apply-enroll", profile.user_email, {
          name: profile.user_name,
          appliedDates: appliedDates,
        });
        await addNotification(
          profile.user_id,
          profile.user_role,
          `Applying ${enrolltype} course.`,
          "Application successfully added!"
        );
      } else {
        await addNotification(
          userId,
          role,
          `Applying ${enrolltype} course.`,
          "Application successfully added!"
        );
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
      const { userId, role } = req.user;
      const { tdcInstructor, tdcDate, maxSlots } = req.body;
      const parsedMaxSlots = parseInt(maxSlots, 10);

      if (!Number.isInteger(parsedMaxSlots) || maxSlots <= 0) {
        return res.status(400).json({ error: "Invalid maxSlots value" });
      }
      // Update availability for the TDC date
      await setTdcDate(tdcInstructor, tdcDate, undefined, undefined, maxSlots);

      await addNotification(
        userId,
        role,
        "Set TDC date",
        `TDC Date Set to ${tdcDate} with ${maxSlots} slots Successfully!`
      );
      return res.status(200).json({
        message: `TDC Date Set to ${tdcDate} with ${maxSlots} slots Successfully!`,
      });
    } catch (error) {
      console.error("Error setting TDC date:", error);
      return res.status(500).json({ error: "Error setting TDC date" });
    }
  }
);

app.post(
  "/api/user-application/add-continuation",
  authenticateToken,
  upload.none(),
  authorizeRole(["admin", "user"]),
  async (req, res) => {
    const { instructor, courseOption, continuationDate, dateAMPM, clientId } =
      req.body;
    const { role } = req.user;

    let userID, createdBy, course;
    if (role == "user") {
      userID = req.user.userId;
      createdBy = role;
      course = courseOption;
    } else {
      userID = clientId == null ? 0 : clientId;
      createdBy = clientId == null ? "admin" : "user";
      course = clientId == null ? 0 : courseOption;
    }
    try {
      await addContinuationDate(
        userID,
        createdBy,
        course,
        instructor,
        continuationDate,
        dateAMPM
      );
      if (clientId !== null) {
        await addNotification(
          userID,
          createdBy,
          `Continuation date.`,
          "Successfully added new continuation date to your course."
        );
      }
      await addNotification(
        0,
        "admin",
        `Continuation date.`,
        "Successfully added new continuation date to your course."
      );
      return res.status(200).json({
        message: "Successfully added continuation date to your course",
      });
    } catch (error) {
      console.error("Error adding continuation to your course", error);
      return res
        .status(500)
        .json({ error: "Error adding continuation to your course" });
    }
  }
);

app.post(
  "/api/user-application/admin-add-continuation",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { instructor, continuationDate, dateAMPM, transmissionType } =
      req.body;
    const { role } = req.user;
    try {
      await addContinuationDate(
        0,
        "admin",
        0,
        instructor,
        continuationDate,
        dateAMPM,
        transmissionType
      );
      await addNotification(
        0,
        "admin",
        `Continuation date.`,
        "Successfully added new continuation date to your course."
      );
      return res.status(200).json({
        message: "Successfully added continuation date to your course",
      });
    } catch (error) {
      console.error("Error adding continuation to your course", error);
      return res
        .status(500)
        .json({ error: "Error adding continuation to your course" });
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

    res.status(200).json(availability);
  } catch (error) {
    console.error("Error fetching instructor availability:", error);
    return res
      .status(500)
      .json({ error: "Error fetching instructor availability" });
  }
});

app.get(
  "/user-programs",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      res.render("user-programs");
    } catch (error) {
      console.error("Internal Server Error", error);
      res.render("error-500", {
        error,
      });
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
      const userApplication = await getApplicant(userId);
      const courseList = await getTraineeCourseList(userId);
      const filtered = courseList.filter(
        (arr) => arr.program_duration > arr.total_hours
      );
      res
        .status(200)
        .json({ userApplication: userApplication, userCourseList: filtered });
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).json({ error: "Error fetching applicants" });
    }
  }
);

app.get("/search", authenticateToken, async (req, res) => {
  try {
    res.render("search");
  } catch (error) {
    console.error("Internal Server Error", error);
    res.render("error-500", {
      error,
    });
  }
});

app.post(
  "/api/user-search",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { encryptedWithEncAesKey } = req.body;
      const { userId, role } = req.user;
      const { searchOption, userInfo } = await decryptData(
        encryptedWithEncAesKey,
        userId,
        role
      );
      const profile = await findUserAccount(searchOption, userInfo);
      const encryptedProfile = await encryptData(profile, userId, role);
      return res.status(200).json({ encryptedProfile });
    } catch (err) {
      console.error("Error sending data to the server!");
      return res
        .status(500)
        .json({ error: "Error sending data to the server!", err });
    }
  }
);

app.get(
  "/api/user-search/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { userId, role } = req.user;
      const profile = await userSearch(id);
      const encryptedProfile = await encryptData(profile, userId, role);
      return res.status(200).json({ encryptedProfile: encryptedProfile });
    } catch (err) {
      console.error("Error fetching data for user!", err);
      return res
        .status(500)
        .json({ error: "Errorfetching data for user!", err });
    }
  }
);

app.get(
  "/user-requests",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      res.render("user-requests");
    } catch (error) {
      console.error("Internal Server Error", error);
      res.render("error-500", {
        error,
      });
    }
  }
);

app.post("/api/submit-request", authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { titleRequest, detailsRequest } = req.body;
    if (!titleRequest || !detailsRequest) {
      res.status(400).json({ error: "Please Provide all fields!" });
      return;
    }
    await addUserRequest(titleRequest, detailsRequest, userId);
    await addNotification(
      userId,
      role,
      "Request submit",
      "Request Form successfully submitted!"
    );
    await addNotification(
      0,
      "admin",
      "Request submit",
      `User ${userId} submitted a request!`
    );
    res.status(200).json({ message: "Request added successfully" });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/api/user-requests", authenticateToken, async (req, res) => {
  try {
    const id = req.user.userId;
    const data = await getUserRequest(id);
    res.status(200).json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/api/user-requests/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const data = await getUserDetailRequest(requestId);
      res.status(200).json(data);
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).json({ error: "Internal Server Error" });
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
      res.render("error-500", {
        error,
      });
    }
  }
);

app.post("/api/submit-report", authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { titleReport, detailsReport } = req.body;
    if (!titleReport || !detailsReport) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    }
    await addUserReport(titleReport, detailsReport, userId);
    await addNotification(
      userId,
      role,
      "Report submit",
      "Report Form successfully submitted!"
    );
    await addNotification(
      0,
      "admin",
      "Request submit",
      `User ${userId} submitted a report!`
    );
    res.status(201).json({ message: "Report added successfully" });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

app.get("/api/user-reports", authenticateToken, async (req, res) => {
  try {
    const id = req.user.userId;
    const data = await getUserReport(id);
    res.json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/user-reports/:reportId", authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const data = await getUserDetailReport(reportId);
    res.json(data);
  } catch (err) {
    console.log("Error fetching data: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user-payments", authenticateToken, (req, res) => {
  try {
    res.render("user-payment");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
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
      const { userId, role } = req.user;
      const courseList = await getTraineeCourseList(userId);
      const methodList = await getAllPaymentMethods();
      const paymentCourses = courseList.map((payment) => ({
        course_id: payment.course_id,
        course_name: payment.program_name,
        course_price: payment.program_fee,
        isPaid: payment.isPaid,
      }));
      const paymentMethods = await Promise.all(
        methodList.map(async (method) => ({
          ...method,
          method_file: await renderBase64File(
            method.method_file,
            method.method_file_type
          ),
        }))
      );

      const data = {
        paymentMethods: paymentMethods,
        paymentCourses: paymentCourses,
      };
      const encrypted = await encryptData(data, userId, role);

      res.status(200).json({ encrypted: encrypted });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/admin-registration", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    res.render("admin-registration-form");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

app.post("/api/admin-registration", authenticateToken, authorizeRole("admin"), async (req, res) => {
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

    await sendEmail("new-account", email, {
      name: admin_name,
      email: user_email,
      generatedPassword: user_password,
      dateCreated: new Date().toLocaleDateString(),
    });
    await addNotification(
      userId,
      "admin",
      "New Admin account added.",
      `Welcome to the company, ${admin_name} <br>
      I look forward working with you!! `
    );

    // Send a successful response with the token
    return res.status(201).json({ message: "Admin registered successfully" });
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
    res.render("error-500", {
      error,
    });
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
            expiresIn: "3h",
          }
        );

        res.cookie("jwtToken", token, {
          maxAge: 3 * 60 * 60 * 1000,
          httpOnly: true,
        });

        return res.status(200).json({
          message: `${
            admin.account_role == "admin" ? "Admin" : "Instructor"
          } login Successful`,
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
      if (role === "admin") {
        const dashboardCounts = await getAllDashboardCounts();
        res.render("admin-dashboard", {
          dashboardCounts,
        });
      } else if (role === "instructor") {
        res.render("instructor-dashboard");
      } else {
        res.status(401).json({ error: "invalid role type" });
      }
    } catch (error) {
      console.error("Error in /admin-dashboard endpoint:", error);
      res.render("error-500", {
        error,
      });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/api/admin-dashboard/dashboard-details",
  authenticateToken,
  async (req, res) => {
    try {
      const paymentMethod = await getAllPaymentMethods();
      const methodList = await Promise.all(
        paymentMethod.map(async (row) => ({
          ...row,
          method_file: await renderBase64File(
            row.method_file,
            row.method_file_type
          ),
        }))
      );
      const scheduleList = await getInstructorScheduleForToday();
      res.status(200).json({ methodList, scheduleList });
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/payment-methods/add",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;

      const { encryptedWithEncAesKey } = req.body;
      const data = await decryptData(encryptedWithEncAesKey, userId, role);
      const { methodName, availability, methodFile } = data;
      const file = methodFile !== null ? methodFile.buffer : null;
      const fileType = methodFile !== null ? methodFile.type : null;

      await addPaymentMethod(methodName, availability, file, fileType);
      await addNotification(
        userId,
        role,
        "Payment",
        `${methodName} Payment method successfully added!`
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

app.post(
  "/api/payment-methods/upload",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;

      // Decrypt the encrypted payload
      const { encryptedWithEncAesKey } = req.body;
      if (!encryptedWithEncAesKey) {
        return res.status(400).json({ error: "Missing encrypted data" });
      }

      // Decrypt the payload (assumes decryptData returns an object with methodId, etc.)
      const decrypted = await decryptData(encryptedWithEncAesKey, userId, role);
      const methodId = decrypted.methodId;
      if (!methodId) {
        return res.status(400).json({ error: "Missing methodId" });
      }

      // File handling
      const methodFile =
        decrypted.methodFile !== null ? decrypted.methodFile.buffer : null;
      const methodFileType =
        decrypted.methodFile !== null ? decrypted.methodFile.type : null;
      if (!methodFile) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Save to database (implement uploadPaymentMethodFile accordingly)
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
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const methodId = req.params.methodId;
      await deletePaymentMethod(methodId);
      await addNotification(
        userId,
        role,
        "Payment",
        `Payment method ID #${methodId} successfully deleted!`
      );
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
  "/api/instructor/attendance-list/:type",
  authenticateToken,
  authorizeRole("instructor"),
  async (req, res) => {
    try {
      // const id = req.params.instructorId;
      const { userId, role } = req.user;
      const type = req.params.type;
      const instructor = await getInstructorWithAccountId(userId);
      const instructorId = instructor.instructor_id;
      const { data, userProfilePictures } = await getAttendanceByInstructorId(
        instructorId,
        type
      );
      const encrypted = await encryptData(
        {
          list: data,
          pictures: userProfilePictures,
        },
        userId,
        role
      );
      res.status(200).json({ encrypted });
    } catch (err) {
      console.error("Error fetching data: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/instructor-dashboard/trainee-info/:courseID",
  async (req, res) => {
    try {
      const id = req.params.courseID;
      const data = await getTraineeCourseInfo(id);
      const convertFile = data.grade_sheet
        ? await fileTypeFromBuffer(data.grade_sheet)
        : null;
      const mimeType = data.grade_sheet
        ? convertFile?.mime || "application/octet-stream"
        : null;

      const userCourse = await Promise.all(
        data.map(async (arr) => ({
          ...arr,
          certificate_file: await renderBase64File(
            arr.certificate_file,
            arr.certificate_file_type
          ),
          grade_sheet: await renderBase64File(arr.grade_sheet, mimeType),
          grade_sheet_type: mimeType,
        }))
      );
      res.status(200).json(userCourse);
    } catch (err) {
      console.log("Error fetching data: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/attendance",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("attendance-pdc-tdc");
    } catch (error) {
      res.render("error-500", {
        error,
      });
    }
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
      console.log("id, status, hoursAttended", id, status, hoursAttended);
      const { clientId } = await changeUserAttendanceStatus(
        id,
        status,
        hoursAttended
      );
      const { userId, role } = req.user; //admin
      await addNotification(
        userId,
        role,
        "Attendance",
        `Attendance id#${id} Status has been change into "${status}" ${
          !hoursAttended ? "" : `with ${hoursAttended} hours added`
        }`
      );
      await addNotification(
        clientId,
        "user",
        "Attendance",
        `Attendance id#${id} Status has been change into "${status}" ${
          !hoursAttended ? "" : `with ${hoursAttended} hours added`
        }`
      );

      return res.status(200).json({ message: "Success" });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/api/delete-attendance",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { id, creatorId, createdBy, courseId } = req.body;
      const deleted = await deleteTraineeAttendance(
        creatorId,
        createdBy,
        courseId
      );
      console.log("deleted", deleted);
      if (createdBy == "user") {
        await addNotification(
          creatorId,
          "user",
          "Application",
          `User course id#${courseId} successfully deleted!`
        );
      }
      await addNotification(
        userId,
        role,
        "Application",
        `Application id#${id} successfully deleted!`
      );

      return res.status(200).json({
        message: `User course id#${courseId} successfully deleted!`,
      });
    } catch (err) {
      console.error("Error deleting application:", err);
      res.status(500).json({ error: err });
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
      res.render("error-500", {
        error,
      });
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
      res.status(500).json({ error: "Internal Server Error" });
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
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/api/delete-application-by-course",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { userId, role } = req.user;

    const { clientId, instructorName, dateStarted, courseId } = req.body;

    try {
      await deleteUserCourse(clientId, instructorName, dateStarted);
      await addNotification(
        userId,
        role,
        "User Course",
        `User course id#${courseId} successfully deleted!`
      );
      await addNotification(
        clientId,
        "user",
        "User Course",
        `User course id#${courseId} successfully deleted!`
      );

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error });
    }
  }
);

app.delete(
  "/api/applicant/:id",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { userId, role } = req.user;
      const deleted = await deleteApplication(id);
      console.log("deleted", deleted);
      await addNotification(
        userId,
        role,
        "Application",
        `Application id#${id} successfully deleted!`
      );
      await addNotification(
        deleted.clientId,
        "user",
        "Application",
        `User course id#${deleted.courseId} successfully deleted!`
      );
      return res.status(200).json({
        message: `User course id#${deleted.courseId} successfully deleted!`,
      });
    } catch (err) {
      console.error("Error deleting application:", err);
      res.status(500).json({ error: err });
    }
  }
);

app.get(
  "/manage-people",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("manage-people");
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.render("error-500", {
        error,
      });
    }
  }
);

app.get(
  "/api/manage-people/list",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const instructorList = await getInstructors();
      const encrypted = await encryptData(instructorList, userId, role);
      return res.status(200).json({ encrypted: encrypted });
    } catch (error) {
      console.error("Error fetching Instructors Data:", error);
      res
        .status(500)
        .json({ error: "Error fetching Instructors Data: " + error.message });
    }
  }
);

app.post(
  "/api/manage-people/instructor-add",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { encryptedWithEncAesKey } = req.body;
      const {
        name,
        rate,
        type,
        onsite,
        manual,
        automatic,
        SSS,
        Pagibig,
        Philhealth,
        accreditationNumber,
        dateStarted,
        profile_picture,
      } = await decryptData(encryptedWithEncAesKey, userId, role);
      const profilePicture =
        profile_picture !== null ? profile_picture.buffer : null;

      await addInstructor(
        name,
        rate,
        type,
        onsite,
        manual,
        automatic,
        SSS,
        Pagibig,
        Philhealth,
        accreditationNumber,
        dateStarted,
        profilePicture
      );
      await addNotification(
        userId,
        role,
        "Add Instructor",
        `${name} has been successfully added!`
      );
      return res
        .status(200)
        .json({ message: `New instructor has been successfully added!` });
    } catch (error) {
      console.error("Error fetching Instructors Data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/manage-people/assign-account",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { encryptedWithEncAesKey } = req.body;
      const data = await decryptData(encryptedWithEncAesKey, userId, role);
      const { id, userName, userEmail, accountRole, prn } = data;

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
      console.log("temporaryPass", temporaryPass);
      const hashedPassword = await bcrypt.hash(temporaryPass, 10);

      // Save the new user to the database
      const newUser = {
        name: userName,
        email: userEmail,
        password: hashedPassword,
        account_role: accountRole,
        isVerify: false,
      };

      const accountId = await saveAdminAccount(newUser);

      await assignAccountToInstructor(id, prn, accountId);

      await sendEmail("new-account", userEmail, {
        name: userName,
        email: userEmail,
        generatedPassword: temporaryPass,
        dateCreated: new Date().toLocaleDateString(),
      });

      await addNotification(
        userId,
        role,
        "Assign Account",
        `Instructor ${userName} successfully assigned a account!`
      );
      await addNotification(
        accountId,
        "instructor",
        "User Course",
        `Welcome to the company, ${userName} <br>
        I look forward working with you!! `
      );

      return res.status(201).json({ message: "Account assigned successfully" });
    } catch (error) {
      console.error("Error fetching Instructors Data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put(
  "/api/manage-people/:id",
  authenticateToken,
  upload.none(),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const instructorId = req.params.id;
      const { encryptedWithEncAesKey } = req.body;
      const data = await decryptData(encryptedWithEncAesKey, userId, role);
      console.log("data", data);

      const {
        name,
        rate,
        type,
        onsite,
        manual,
        automatic,
        SSS,
        Pagibig,
        Philhealth,
        accreditationNumber,
        dateStarted,
        profile_picture,
      } = data;

      // Fetch existing user profile from the database
      const existingInstructor = await getInstructorwithId(instructorId);

      const profilePicture = profile_picture !== null ? profile_picture : null;

      // Create an object with only the changed fields
      const updatedProfile = {};

      if (name && name !== existingInstructor.instructor_name)
        updatedProfile.instructor_name = name;

      if (
        rate != null &&
        parseFloat(rate) !== parseFloat(existingInstructor.rate_per_hour)
      )
        updatedProfile.rate_per_hour = rate;

      if (type && type !== existingInstructor.instructor_type)
        updatedProfile.instructor_type = type;

      if (
        onsite != null &&
        parseInt(onsite) !== parseInt(existingInstructor.isTdcOnsite)
      )
        updatedProfile.isTdcOnsite = onsite;

      if (
        manual != null &&
        parseInt(manual) !== parseInt(existingInstructor.isManual)
      )
        updatedProfile.isManual = manual;

      if (
        automatic != null &&
        parseInt(automatic) !== parseInt(existingInstructor.isAutomatic)
      )
        updatedProfile.isAutomatic = automatic;

      if (SSS != null && parseFloat(SSS) !== parseFloat(existingInstructor.SSS))
        updatedProfile.SSS = SSS;

      if (
        Pagibig != null &&
        parseFloat(Pagibig) !== parseFloat(existingInstructor.Pag_ibig)
      )
        updatedProfile.Pag_ibig = Pagibig;

      if (
        Philhealth != null &&
        parseFloat(Philhealth) !== parseFloat(existingInstructor.Philhealth)
      )
        updatedProfile.Philhealth = Philhealth;

      if (
        accreditationNumber &&
        accreditationNumber !== existingInstructor.accreditation_number
      )
        updatedProfile.accreditation_number = accreditationNumber;

      if (
        dateStarted &&
        new Date(dateStarted).getTime() !==
          new Date(existingInstructor.date_started).getTime()
      )
        updatedProfile.date_started = dateStarted;

      if (profilePicture && profilePicture.buffer)
        updatedProfile.instructor_profile_picture = profilePicture.buffer;
      console.log("updatedProfile", updatedProfile);
      // Check if there are any fields to update
      if (Object.keys(updatedProfile).length === 0) {
        return res.status(200).json({ message: "No changes detected." });
      }
      await updateInstructorInfo(instructorId, updatedProfile);

      return res
        .status(200)
        .json({ message: "Instructor Profile updated successfully!" });
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

app.get("/api/instructor-profile", authenticateToken, async (req, res) => {
  try {
    const id = req.user.userId;
    const instructor = await getInstructorWithAccountId(id);
    return res.status(200).json({ instructor });
  } catch (error) {
    console.error("Error fetching Instructors Data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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

app.delete(
  "/api/manage-people/:rowID",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const rowId = req.params.rowID;
      const { id } = req.body;
      await deleteInstructor(rowId);
      const message = `Instructor profile id#${rowId} successfully deleted!`;

      await addNotification(userId, role, "Instructor", message);
      if (+id) {
        await addNotification(id, "instructor", "Instructor", message);
      }
      return res.status(200).json({ message: message });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/programs",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("programs");
    } catch (error) {
      res.render("error-500", {
        error,
      });
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
    const { userId, role } = req.user;
    const {
      programName,
      status,
      programDuration,
      programFee,
      programDescription,
    } = req.body;
    if (!programName || !status) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    }
    await addProgram(
      programName,
      status,
      programDuration,
      programFee,
      programDescription
    );

    await addNotification(
      userId,
      role,
      "Program",
      `${programName} successfully added!`
    );
    res.status(201).json({ message: "Program added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
      instructor_type: instructor.instructor_type,
    }));
    return res.status(200).json({ instructorsNameList });
  } catch (error) {
    console.error("Error fetching Instructors Data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/assign-programs", authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { instructor_id, program_ids } = req.body;
  console.log("program_ids", program_ids);

  if (
    !instructor_id ||
    !Array.isArray(program_ids) ||
    program_ids.length === 0
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Build the programMsg string
  const programMsg = program_ids.join("&");

  try {
    await assignPrograms(instructor_id, program_ids);
    await addNotification(
      userId,
      role,
      "Program assign",
      `Instructor id#${instructor_id} assigned programs id#${programMsg} successfully added!`
    );
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

app.delete(
  "/api/programs/:rowID",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const id = req.params.rowID;
      await deleteProgram(id);
      await addNotification(
        userId,
        role,
        "Program",
        `Program #${id} successfully deleted!`
      );
      return res
        .status(200)
        .json({ message: `Program #${id} successfully deleted!` });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/requests",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("requests");
    } catch (error) {
      res.render("error-500", {
        error,
      });
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
      const { userId, role } = req.user;
      const { clientId, title, reqStatus } = await editUserRequest(
        status,
        reason,
        rowId
      );

      await addNotification(
        userId,
        role,
        "Request",
        `Request titled "${title}" has been updated to ${reqStatus}`
      );
      await addNotification(
        clientId,
        "user",
        "Request",
        `Request titled "${title}" has been updated to ${reqStatus}`
      );

      return res.status(200).json({ message: "Success" });
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
      res.render("error-500", {
        error,
      });
    }
  }
);

app.get("/api/certificates", authenticateToken, async (req, res) => {
  try {
    const allCert = await getAllCert();
    const certList = await Promise.all(
      allCert.map(async (cert) => ({
        ...cert,
        certificate_template: await renderBase64File(
          cert.certificate_template,
          cert.template_file_type
        ),
      }))
    );
    return res.json({ certList });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/certificate/add", authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { certificateID, certificateName } = req.body;
    if ((!certificateID, !certificateName)) {
      return res.status(400).json({ error: "Please Provide all fields!" });
    }

    const certificatetId = await addCertificate(certificateID, certificateName);

    await addNotification(
      userId,
      role,
      "Certificate",
      `${certificateName} Certificate successfully added!`
    );
    res
      .status(201)
      .json({ message: "Certificate added successfully", certificatetId });

    res.status;
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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

app.delete(
  "/api/certificates/:rowID",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const id = req.params.rowID;
      await deleteCertificate(id);
      await addNotification(
        userId,
        role,
        "Certificate",
        `Certificate id#${id} successfully deleted!`
      );
      return res
        .status(200)
        .json({ message: `Certificate id#${id} successfully deleted!` });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/reports",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("reports");
    } catch (error) {
      res.render("error-500", {
        error,
      });
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
      const { userId, role } = req.user;
      const { status, reason, rowId } = req.body;
      const { clientId, title, repStatus } = await editUserReport(
        status,
        reason,
        rowId
      );
      await addNotification(
        userId,
        role,
        "Report",
        `Report titled "${title}" has been updated to ${repStatus}`
      );
      await addNotification(
        clientId,
        "user",
        "Report",
        `Report titled "${title}" has been updated to ${repStatus}`
      );

      return res.status(200).json({ message: "Success" });
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
      res.render("error-500", {
        error,
      });
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
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { encryptedWithEncAesKey } = req.body;
      // Destructure fields from req.body
      const {
        accountName,
        id,
        amount,
        paymentMethod,
        courseSelect,
        screenshotReceipt,
      } = await decryptData(encryptedWithEncAesKey, userId, role);
      // For admin, id is sent; for user, use req.user.userId
      const clientId = role === "admin" ? (id !== undefined ? id : 0) : userId;

      if (!accountName || !amount || !paymentMethod || !courseSelect) {
        return res.status(400).json({ error: "Please Provide all fields!" });
      }

      let compressedReceipt = null;
      if (screenshotReceipt !== null) {
        compressedReceipt = await sharp(screenshotReceipt.buffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      await addPayments(
        clientId,
        accountName,
        amount,
        paymentMethod,
        compressedReceipt,
        courseSelect
      );

      if (role === "user") {
        await addNotification(
          clientId,
          role,
          "Payment",
          `User #${userId} made a payment using: <br>
           ${paymentMethod} : ${amount} `
        );
        await addNotification(
          0,
          "admin",
          "Payment",
          `User #${userId} made a payment using: <br>
           ${paymentMethod} : ${amount} `
        );
      } else {
        const message =
          clientId == 0
            ? `Manually added payment ${amount}`
            : `User #${userId} made a payment using: <br>
             ${paymentMethod} : ${amount}`;

        await addNotification(0, "admin", "Payment", message);
        if (userId) {
          await addNotification(clientId, "user", "Payment", message);
        }
      }

      return res.status(200).json({ message: "Payment added successfully!" });
    } catch (error) {
      console.error("Error in /api/payment/add:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/payments/receipt/:id",
  authenticateToken,
  authorizeRole(["admin", "user"]),
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
      const { user_id, payment_method, amount, payStatus } =
        await changePaymentStatus(paymentId, status);

      await addNotification(
        user_id,
        "user",
        "Payment",
        `Your payment has change status into "${payStatus}" <br>
           ${payment_method} : ${amount} `
      );
      res.status(200).json({ message: "Payment Status changed successfully!" });
    } catch (error) {
      console.error("Error fetching report details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/api/payments/delete/:rowId",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const rowId = req.params.rowId;
      await deletePaymentInfo(rowId);
      await addNotification(
        userId,
        role,
        "Payment",
        `Payment id#${rowId} info Deleted successfully!`
      );
      return res
        .status(200)
        .json({ message: "Payment info Deleted successfully!" });
    } catch (err) {
      console.error("Cant delete payment right now!", err);
      res.status(500).json({ error: "Internal Server Error", err });
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
      res.render("error-500", {
        error,
      });
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
      console.log(
        "completedCourseList",
        Object.keys(completedCourseList).length
      );
      return res.status(200).json(completedCourseList);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
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
      return res
        .status(200)
        .json({ message: "Trainee course hours updated successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
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
      console.error(error);
      res
        .status(500)
        .json({ error: "Cant upload completion certificate right now!" });
    }
  }
);

app.post(
  "/api/completed-course/grade-upload/:id",
  authenticateToken,
  authorizeRole(["admin", "instructor"]),
  upload.single("grade-completion-file"),
  async (req, res) => {
    try {
      const id = req.params.id;
      console.log("id", id);
      const gradeSheet = req.file ? req.file.buffer : null;
      console.log("gradeSheet", gradeSheet);
      const { courseGrade } = req.body;
      console.log("courseGrade", courseGrade);
      await uploadTraineeGradeSheet(id, gradeSheet, courseGrade);
      if (req.user.role == "instructor") {
        const userCourse = await getTraineeCourseInfo(id);
        return res.status(200).json(userCourse);
      }
      return res
        .status(200)
        .json({ message: "Grade Sheet uploaded successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Cant upload grade sheet right now." });
    }
  }
);

app.delete(
  "/api/completed-course/:id",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, dateStarted, continuation } = req.body;
      await deleteTraineeCourseInfo(userId, dateStarted, continuation);

      await addNotification(
        req.user.userId,
        req.user.role,
        "User Course",
        `User course id#${decrypted.courseId} successfully deleted!`
      );
      await addNotification(
        userId,
        "user",
        "User Course",
        `User course id#${decrypted.courseId} successfully deleted!`
      );
      return res
        .status(200)
        .json({ message: "Trainee course info Deleted successfully!" });
    } catch (err) {
      console.error("deleting user course:", err);
      res
        .status(500)
        .json({ error: `Deleting user course, please try again later` });
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
      res.render("error-500", {
        error,
      });
    }
  }
);

app.get("/api/vehicles", authenticateToken, async (req, res) => {
  try {
    const vehicleList = await getAllVehicle();
    return res.json({ vehicleList });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/api/vehicle/add",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { plateNumber, vehicleModel, year, vehicleType } = req.body;
      if ((!plateNumber, !vehicleModel, !year, !vehicleType)) {
        return res.status(400).json({ error: "Please Provide all fields!" });
      }
      const vehicleId = await addVehicle(
        plateNumber,
        vehicleModel,
        year,
        vehicleType
      );

      await addNotification(
        userId,
        role,
        "Add vehicle",
        `Successfully added! <br>
        ${vehicleType} ${vehicleModel} ${year} - ${plateNumber} `
      );
      res
        .status(201)
        .json({ message: "Vehicle added successfully", plateNumber });

      res.status;
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

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
    console.log(req.file);
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
    return res.status(200).json({ message: "Vehicle Update!" });
  } catch (error) {
    console.error("Error fetching report details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete(
  "/api/vehicles/:rowID",
  authenticateToken,
  verifyDeleteToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const id = req.params.rowID;
      await deleteVehicle(id);
      await addNotification(
        userId,
        role,
        "Vehicle",
        `Vehicle id#${id} Successfully deleted! `
      );
      return res
        .status(200)
        .json({ message: `Vehicle id#${id} Successfully deleted! ` });
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      return res.status(500).json({ error: "Internal Server Error", err });
    }
  }
);

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
      res.render("error-500", {
        error,
      });
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
    res.status(500).json({ error: "Internal Server Error" });
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

app.get(
  "sample-certificates-completion",
  authenticateToken,
  authorizeRole("user"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;

      const logoPath = path.join(
        __dirname,
        "./f-css/solid/drivers_ed_logo-no-bg.png"
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
      const user = await getProfilewithUserId(userId);

      const certificateInputs = [
        {
          controlNumber: "SAMPLESAMPLESAMPLE",
          certificateNumber: "SAMPLESAMPLESAMPLE",
          accredNumOfBranch: "SAMPLESAMPLESAMPLE",
          driversEdLogo: driversEdLogo,
        },
      ];
      const fullName = `${user.last_name.toUpperCase()} ${user.first_name.toUpperCase()} ${user.middle_name.toUpperCase()}`;
      const userProfile = [
        {
          fullName: fullName || null,
          address: user.address,
          ltoClientId: "SAMPLESAMPLESAMPLE",
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

      userProfile[0].profilePicture = await renderBase64File(
        user.profile_picture
      );

      const userCourse = [
        {
          courseName: "SAMPLESAMPLE",
          dateStarted: "01/01/2001",
          dateFinished: "01/01/2001",
          totalHours: 10,
        },
      ];

      const instructorProfile = [
        {
          instructorName: "SAMPLESAMPLE",
          accredNumOfInstructor: "SAMPLESAMPLE",
        },
      ];

      const encrypted = await encryptData(
        {
          dlCodesLeft,
          dlCodesRight,
          certificateInputs,
          userProfile,
          userCourse,
          instructorProfile,
          clientId,
          courseId,
          instructorId,
        },
        userId,
        role
      );
      res.status(200).render("sample", {
        encrypted,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/certificates-completion-pdc",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    res.render("certificate-of-completion-PDC", {
      isPDF: false,
    });
  }
);

app.post(
  "/api/certificates-completion-pdc",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { clientId, courseId, instructorId } = req.body;
      console.log("pdc", clientId, courseId, instructorId);

      const logoPath = path.join(
        __dirname,
        "./f-css/solid/drivers_ed_logo-no-bg.png"
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
      const user = await getProfilewithUserId(clientId);
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
      const fullName = `${user.last_name.toUpperCase()} ${user.first_name.toUpperCase()} ${user.middle_name.toUpperCase()}`;
      const userProfile = [
        {
          fullName: fullName || null,
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

      userProfile[0].profilePicture = await renderBase64File(
        user.profile_picture
      );

      const userCourse = [
        {
          courseName: trainee_course[0].program_name,
          dateStarted: trainee_course[0].date_started,
          dateFinished: trainee_course[0].date_completed,
          totalHours: trainee_course[0].total_hours,
        },
      ];

      const instructorProfile = [
        {
          instructorName: instructor.instructor_name,
          accredNumOfInstructor: instructor.accreditation_number,
        },
      ];

      const encrypted = await encryptData(
        {
          dlCodesLeft,
          dlCodesRight,
          certificateInputs,
          userProfile,
          userCourse,
          instructorProfile,
          clientId,
          courseId,
          instructorId,
        },
        userId,
        role
      );
      res.status(200).json(encrypted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/certificates-completion-pdc/:type",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const adminId = req.user.userId;
      const role = req.user.role;
      const type = req.params.type;
      const { encryptedWithEncAesKey } = req.body;

      const decrypted = await decryptData(
        encryptedWithEncAesKey,
        adminId,
        role
      );
      const {
        userId,
        courseId,
        instructorId,
        dlCodesLeft,
        dlCodesRight,
        profileInputs,
      } = decrypted;

      const logoPath = path.join(
        __dirname,
        "/f-css/solid/drivers_ed_logo-no-bg.png"
      );
      const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
        logoPath,
        "base64"
      )}`;

      const certificateInputs = [
        {
          controlNumber: profileInputs.controlNumber,
          certificateNumber: profileInputs.certificateNumber,
          accredNumOfBranch: profileInputs.accredNumOfBranch,
          driversEdLogo: driversEdLogo,
        },
      ];

      const userProfile = [
        {
          fullName: profileInputs.fullName,
          address: profileInputs.address,
          ltoClientId: profileInputs.ltoClientId,
          birthday: profileInputs.birthday,
          gender: profileInputs.gender,
          civilStatus: profileInputs.civilStatus,
          nationality: profileInputs.nationality,
          age: Math.floor(
            (new Date() - new Date(profileInputs.birthday)) /
              (1000 * 60 * 60 * 24 * 365.25)
          ),
          profilePicture: profileInputs.profilePicture,
          spNumber: profileInputs.spNumber,
        },
      ];

      const userCourse = [
        {
          dateStarted: profileInputs.dateStarted,
          dateFinished: profileInputs.dateFinished,
          totalHours: profileInputs.totalHours,
        },
      ];

      const instructorProfile = [
        {
          instructorName: profileInputs.instructorName,
          accredNumOfInstructor: profileInputs.accredNumOfInstructor,
        },
      ];

      const payload = {
        dlCodesLeft,
        dlCodesRight,
        certificateInputs,
        userProfile,
        userCourse,
        instructorProfile,
        userId,
        courseId,
        instructorId,
      };

      const pdfBuffer = await generateCertificatePDF({
        type: "PDC",
        payload,
      });

      const convertedPdfBuff = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);

      console.log("pdfBuffer size:", convertedPdfBuff.length);

      if (type == "database") {
        try {
          await saveCertificateToDatabase(
            courseId,
            convertedPdfBuff,
            "application/pdf"
          );
        } catch (error) {
          throw new Error("Cant upload certificate to the database.");
        }
        /*
        await sendEmail("completion-certificate", user.email, {
          name: user.first_name,
          certificate: Buffer.from(pdfBuffer),
        });
        */
        await addNotification(
          userId,
          "user",
          "PDC Certificate of Completion",
          `${profileInputs.fullName} PDC Course Certificate `
        );
        await addNotification(
          0,
          "admin",
          "PDC Certificate of Completion",
          `${profileInputs.fullName} PDC Course Certificate `
        );
      }
      const name = profileInputs.courseName;
      console.log("name", name);
      const sanitized = name.replace(/[^a-zA-Z0-9 ]/g, "");
      const fileSafe = sanitized.trim().toLowerCase().replace(/ +/g, "-");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileSafe}-certificate-pdc.pdf"`
      );
      res.setHeader("Content-Type", "application/pdf");
      res.status(200).end(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Error generating PDF:", error);
      res
        .status(500)
        .json({ error: "An error occurred while generating the PDF." });
    }
  }
);

app.get(
  "/certificates-completion-tdc",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      res.render("certificate-of-completion-TDC", {
        isPDF: false,
      });
    } catch (error) {
      res.render("error-500", {
        error,
      });
    }
  }
);

app.post(
  "/api/certificates-completion-tdc",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { clientId, courseId, instructorId } = req.body;
      console.log("tdc", clientId, courseId, instructorId);

      const instructor = await getInstructorwithId(instructorId);
      const user = await getProfilewithUserId(clientId);
      const trainee_course = await getTraineeCourseInfo(courseId);

      const logoPath = path.join(
        __dirname,
        "./f-css/solid/drivers_ed_logo-no-bg.png"
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
          firstName: user.first_name.toUpperCase(),
          lastName: user.last_name.toUpperCase(),
          middleName: user.middle_name.toUpperCase(),
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

      userProfile[0].profilePicture = await renderBase64File(
        user.profile_picture
      );

      const userCourse = [
        {
          courseName: trainee_course[0].program_name,
          dateStarted: trainee_course[0].date_started,
          dateFinished: trainee_course[0].date_completed,
          totalHours: trainee_course[0].total_hours,
        },
      ];

      const instructorProfile = [
        {
          name: instructor.instructor_name,
          accredNumOfInstructor: instructor.accreditation_number,
        },
      ];

      const encrypted = await encryptData(
        {
          certificateInputs,
          userProfile,
          userCourse,
          instructorProfile,
          userId: clientId,
          courseId,
          instructorId,
        },
        userId,
        role
      );

      res.status(200).json(encrypted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/certificates-completion-tdc/:type",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const adminId = req.user.userId;
      const role = req.user.role;
      const type = req.params.type;
      const { encryptedWithEncAesKey } = req.body;
      const decrypted = await decryptData(
        encryptedWithEncAesKey,
        adminId,
        role
      );

      const { userId, courseId, instructorId, profileInputs } = decrypted;

      const logoPath = path.join(
        __dirname,
        "/f-css/solid/drivers_ed_logo-no-bg.png"
      );
      const driversEdLogo = `data:image/png;base64,${fs.readFileSync(
        logoPath,
        "base64"
      )}`;

      const certificateInputs = [
        {
          controlNumber: profileInputs.controlNumber,
          certificateNumber: profileInputs.certificateNumber,
          accredNumOfBranch: profileInputs.accredNumOfBranch,
          driversEdLogo: driversEdLogo,
        },
      ];
      const userProfile = [
        {
          firstName: profileInputs.firstName,
          lastName: profileInputs.lastName,
          middleName: profileInputs.middleName,
          address: profileInputs.address,
          ltoClientId: profileInputs.ltoClientId,
          birthday: profileInputs.birthday,
          gender: profileInputs.gender,
          civilStatus: profileInputs.civilStatus,
          nationality: profileInputs.nationality,
          age: Math.floor(
            (new Date() - new Date(profileInputs.birthday)) /
              (1000 * 60 * 60 * 24 * 365.25)
          ),
          profilePicture: profileInputs.profilePicture,
        },
      ];

      const userCourse = [
        {
          dateStarted: profileInputs.dateStarted,
          dateFinished: profileInputs.dateFinished,
          totalHours: profileInputs.totalHours,
          modality: profileInputs.modality,
        },
      ];

      const instructorProfile = [
        {
          instructorName: profileInputs.instructorName,
          accredNumOfInstructor: profileInputs.accredNumOfInstructor,
        },
      ];

      const payload = {
        certificateInputs,
        userProfile,
        userCourse,
        instructorProfile,
        userId,
        courseId,
        instructorId,
      };

      const pdfBuffer = await generateCertificatePDF({
        type: "TDC",
        payload,
      });

      const name = `${profileInputs.lastName.toUpperCase()} ${profileInputs.firstName.toUpperCase()} ${profileInputs.middleName.toUpperCase()}`;

      if (type === "database") {
        await saveCertificateToDatabase(
          courseId,
          Buffer.from(pdfBuffer),
          "application/pdf"
        );
        /*
        await sendEmail("completion-certificate", user.email, {
          name: user.first_name,
          certificate: Buffer.from(pdfBuffer),
        });
        */
        await addNotification(
          userId,
          "user",
          "TDC Certificate of Completion",
          `${name} TDC Course Certificate `
        );
        await addNotification(
          0,
          "admin",
          "TDC Certificate of Completion",
          `${name} TDC Course Certificate `
        );
      }

      const sanitized = name.replace(/[^a-zA-Z0-9 ]/g, " ");
      const fileSafe = sanitized.trim().toLowerCase().replace(/ +/g, "_");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileSafe}-certificate-tdc.pdf"`
      );

      res.setHeader("Content-Type", "application/pdf");
      res.status(200).end(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500)({ error: "An error occurred while generating the PDF." });
    }
  }
);

app.get(
  "/sample",
  authenticateToken,
  authorizeRole(["user", "admin"]),
  (req, res) => {
    try {
      res.render("sample");
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to load page", err });
    }
  }
);

async function shutdown(signal) {
  console.log(`🛑 ${signal} received. Shutting down...`);

  try {
    await redis.quit();
    console.log("✅ Redis disconnected");
  } catch (err) {
    console.error("❌ Error disconnecting Redis:", err);
  }

  try {
    if (browserInstance) {
      await browserInstance.close();
      console.log("✅ Puppeteer browser closed");
    }
  } catch (err) {
    console.error("❌ Error closing Puppeteer:", err);
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

app.use((req, res, next) => {
  if (!req.route) {
    return res.status(404).end(); // No logging, no message
  }
  next();
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running at ${PORT}`);
});

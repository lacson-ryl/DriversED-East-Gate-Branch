import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import validator from "validator";
import fs from "fs";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import crypto from "crypto";

dotenv.config({ path: ".env.production" });

const PUBLIC_PORT = process.env.PUBLIC_PORT;
const secretKey = process.env.secret_key;
const HOST = process.env.HOST;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("/health-check-docker", (req, res) => {
  res.sendStatus(200);
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://www.gstatic.com",
        ],
        styleSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://unpkg.com", "https://www.google.com"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://maps.google.com",
        ],
      },
    },
  }),
);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static assets
app.use(
  "/public/f-css",
  express.static(path.join(process.cwd(), "/shared/f-css")),
);
app.use(
  "/public/f-assets",
  express.static(path.join(__dirname, "shared", "f-assets"), {
    maxAge: "1h", // cache for 1 hour
    etag: false, // disable ETag revalidation
  }),
);
app.use("/public/f-jsfiles", express.static(path.join(__dirname, "f-jsfiles")));
app.use("/public/utils", express.static(path.join(__dirname, "utils")));

// View engine
app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(process.cwd(), "views"));

app.set("trust proxy", "127.0.0.1");
//app.set("trust proxy", true);

// CORS setup
const corsOptions = {
  origin: HOST || "*", // fallback for local dev
  credentials: true,
};
app.use(cors(corsOptions));

// Cookie + body parsing
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const sessionMiddleware = session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    name: "defaultSession", // Dynamically set session name
    cookie: {
      maxAge: 3600000,
      httpOnly: true,
      secure: true, // Requires HTTPS
      sameSite: "Strict", // Protect against CSRF attacks // (Strict)
    },
  });

  sessionMiddleware(req, res, next);
});

// Logging
app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter); // Apply to all routes

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.render("website");
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

router.get("/contact-us", async (req, res) => {
  try {
    const captchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    res.render("contact-us", {
      captchaSiteKey,
    });
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

router.post("/contact/submit", async (req, res) => {
  try {
    /*
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    console.log("Contact form submission:", {
      name,
      email,
      phone: phone || "Not provided",
      subject,
      message,
      timestamp: new Date().toISOString(),
    });
*/
    res.json({ success: true, message: "This feature is under development." });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to process contact form" });
  }
});

app.use("/public", router);
app.listen(PUBLIC_PORT, "0.0.0.0", () => {
  console.log(`Server is running at ${PUBLIC_PORT}`);
});

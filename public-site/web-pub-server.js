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

app.use(helmet());
// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static assets
app.use("/public/f-css", express.static(path.join(process.cwd(), "/shared/f-css")));
console.log("Serving from:", path.join(__dirname, "/shared/f-css"));
app.use(
  "/public/f-assets",
  express.static(path.join(__dirname, "shared", "f-assets"), {
    maxAge: "1h", // cache for 1 hour
    etag: false, // disable ETag revalidation
  })
);
app.use("/public/js", express.static(path.join(__dirname, "js")));
app.use("/public/utils", express.static(path.join(__dirname, "utils")));

// View engine
app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(process.cwd(), "website"));

//app.set("trust proxy", "127.0.0.1");
app.set("trust proxy", true);

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

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'"
  );
  next();
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
    res.render("website", { error: false});
  } catch (error) {
    res.render("error-500", {
      error,
    });
  }
});

app.use("/public", router);
app.listen(PUBLIC_PORT, "0.0.0.0", () => {
  console.log(`Server is running at ${PUBLIC_PORT}`);
});

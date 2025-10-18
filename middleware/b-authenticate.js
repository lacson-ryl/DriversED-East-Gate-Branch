import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import redis from "../config/b-redis.js";
dotenv.config();

const secretKey = process.env.secret_key;
const GITHUB_SECRET = process.env.GITHUB_SECRET;

export function authenticateToken(req, res, next) {
  const token = req.cookies.jwtToken;
  console.log("Token from cookie:", token);

  if (!token) {
    console.log("No token found");
    if (req.originalUrl.startsWith("/user")) {
      return res.redirect("/user-login?error=token_not_found");
    } else {
      return res.redirect("/adminlogin?error=token_not_found");
    }
  }

  jwt.verify(token, secretKey, (error, user) => {
    if (error) {
      console.log("Token verification failed:", error);
      if (req.originalUrl.startsWith("/user")) {
        return res.redirect("/user-login?error=invalid_token");
      } else {
        return res.redirect("/adminlogi?error=invalid_token");
      }
    }
    console.log("Token verified, user:", user);
    req.user = user;
    next();
  });
}

export function authorizeRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      if (req.originalUrl.startsWith("/admin")) {
        res.clearCookie("jwtToken");
        return res.redirect("/adminlogin?error=invalid_role");
      } else if (req.originalUrl.startsWith("/user")) {
        res.clearCookie("jwtToken");
        return res.redirect("/user-login?error=invalid_role");
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    next();
  };
}

export function generateTemporaryPassword(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$&!";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

export function authenticateTokenForChangingCredentials(req, res, next) {
  const token = req.cookies.changePasswordEmailToken;
  console.log("Token from cookie:", token);

  if (!token) {
    console.log("No token found");
    return res
      .status(401)
      .json({ error: "Token not found. Unauthorized access." });
  }

  jwt.verify(token, secretKey, (error, decoded) => {
    if (error) {
      console.log("Token verification failed:", error);
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    console.log("Token verified, decoded data:", decoded);
    req.tokenData = decoded;
    next();
  });
}

export async function verifyDeleteToken(req, res, next) {
  if (req.method !== "DELETE") return next();

  const token = req.headers["x-delete-token"];
  if (!token) return res.status(400).json({ error: "Missing delete token" });

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  if (payload.sub !== req.user.userId) {
    return res.status(403).json({ error: "Token not for this user" });
  }

  // exact path match
  const actualPath = req.originalUrl.split("?")[0];
  if (payload.path !== actualPath) {
    return res.status(403).json({ error: "Token path mismatch" });
  }

  // enforce one-time use
  const usedKey = `del:used:${payload.jti}`;
  const set = await redis.set(usedKey, "1", { NX: true, EX: 60 });
  if (set !== "OK") {
    return res.status(403).json({ error: "Token already used" });
  }

  req.deleteToken = payload;
  next();
}

// Middleware to verify GitHub signature
export function verifyGitHubSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return res.status(401).send('No signature');

  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(403).send('Invalid signature');
  }

  next();
}
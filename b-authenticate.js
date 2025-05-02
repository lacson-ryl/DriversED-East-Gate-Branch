import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.secret_key;

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

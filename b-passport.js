import passport from "passport";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import {
  adminCheckEmail,
  getAdminAccountById,
  checkEmail,
  getUserAccountById,
  saveUser,
  findAccountByEmail,
} from "./b-database.js";
import { generateTemporaryPassword } from "./b-authenticate.js";
import { sendEmail } from "./b-email-config.js";

dotenv.config();

// Admin Passport Configuration
const adminPassport = new passport.Passport();
const userPassport = new passport.Passport();
const changePasswordPassport = new passport.Passport();

adminPassport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ADMIN_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADMIN_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/admin/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await adminCheckEmail(email);
        if (existingUser) {
          return done(null, existingUser);
        } else {
          return done(null, false, {
            message:
              "Sorry! we can't find a user with your email. Contact the admin to register your account.",
          });
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

adminPassport.serializeUser((user, done) => {
  console.log("Serializing admin:", user);
  done(null, { id: user.account_id, userType: "admin" });
});

adminPassport.deserializeUser(async (obj, done) => {
  try {
    if (obj.userType === "admin") {
      console.log("Deserializing admin with ID:", obj.id);
      const user = await getAdminAccountById(obj.id);
      console.log("Deserialized admin:", user);
      return done(null, user);
    } else {
      return done(
        new Error("Invalid user type for admin deserialization"),
        null
      );
    }
  } catch (error) {
    console.error("Error deserializing admin:", error);
    return done(error, null);
  }
});

// User Passport Configuration
userPassport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_USER_CLIENT_ID,
      clientSecret: process.env.GOOGLE_USER_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/user/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await checkEmail(email);
        if (existingUser) {
          return done(null, existingUser);
        } else {
          const random8CharacPass = generateTemporaryPassword(8);
          console.log("random8CharacPass", random8CharacPass);
          const hashedPassword = await bcrypt.hash(random8CharacPass, 10);
          const newUser = {
            name: profile.displayName,
            email: email,
            password: hashedPassword,
            isVerify: "true",
          };
          const userId = await saveUser(newUser);
          newUser.user_id = userId;
          newUser.user_role = "user";

          await sendEmail("new-account", email, {
            name: profile.displayName,
            email: email,
            generatedPassword: random8CharacPass,
            dateCreated: new Date().toLocaleDateString(),
          });
          return done(null, newUser);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

userPassport.serializeUser((user, done) => {
  done(null, { id: user.user_id, userType: "user" });
});

userPassport.deserializeUser(async (obj, done) => {
  try {
    if (obj.userType === "user") {
      const user = await getUserAccountById(obj.id);
      return done(null, user);
    } else {
      return done(
        new Error("Invalid user type for user deserialization"),
        null
      );
    }
  } catch (error) {
    console.error("Error deserializing user:", error);
    return done(error, null);
  }
});

changePasswordPassport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CHANGE_PASSWORD_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CHANGE_PASSWORD_SECRET,
      callbackURL: "http://localhost:8000/auth/google/change-password/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await findAccountByEmail(email);
        if (existingUser) {
          return done(null, existingUser);
        } else {
          return done(null, false, { message: "No user with given email." });
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

changePasswordPassport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, { id: user.user_id, userType: "changePassword" });
});

changePasswordPassport.deserializeUser(async (obj, done) => {
  try {
    if (obj.userType === "changePassword") {
      console.log("Deserializing user with ID:", obj.id);
      const user = await getUserAccountById(obj.id);
      console.log("Deserialized user:", user);
      return done(null, user);
    } else {
      return done(
        new Error("Invalid user type for user deserialization"),
        null
      );
    }
  } catch (error) {
    console.error("Error deserializing user:", error);
    return done(error, null);
  }
});

export { adminPassport, userPassport, changePasswordPassport };

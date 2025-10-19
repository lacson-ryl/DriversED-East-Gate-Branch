// b-mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export default async function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_EMAIL,
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

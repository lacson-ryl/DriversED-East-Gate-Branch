import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_SEND_EMAIL_CLIENT_ID,
  process.env.GOOGLE_SEND_EMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_EMAIL,
        clientId: process.env.GOOGLE_SEND_EMAIL_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SEND_EMAIL_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error);
    if (error.response && error.response.data.error === "invalid_grant") {
      console.error("Refresh token is invalid or expired. Reauthorize the app.");
    }
    throw error;
  }
}

export default createTransporter;

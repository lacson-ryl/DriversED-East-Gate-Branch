import bcrypt from "bcrypt";
import { getUserByEmail, updateUserEmail, updateUserPassword, getResetCode } from "./b-database.js"; // Assume these functions exist in your database module

app.post("/api/change-email", authenticateToken, async (req, res) => {
  try {
    const { oldEmail, newEmail, password, otp } = req.body;

    // Step 1: Validate input
    if (!oldEmail || !newEmail || !password || !otp) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Step 2: Check if the old email exists in the user table
    const user = await findAccountByEmail(oldEmail);
    if (!user) {
      return res.status(404).json({ error: "Old email not found." });
    }

    // Step 3: Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password." });
    }

    // Step 4: Get the reset code from the change_password_or_email table
    const resetEntry = await getResetCode(user.user_id, user.user_role, "email");
    if (!resetEntry) {
      return res.status(404).json({ error: "Reset code not found." });
    }

    // Step 5: Verify the OTP (reset code)
    const isOtpValid = await bcrypt.compare(otp, resetEntry.reset_code);
    if (!isOtpValid) {
      return res.status(401).json({ error: "Invalid OTP code." });
    }

    // Step 6: Update the email
    const updateResult = await updateUserEmail(user.user_id, newEmail);
    if (!updateResult) {
      return res.status(500).json({ error: "Failed to update email." });
    }

    return res.status(200).json({ message: "Email updated successfully." });
  } catch (error) {
    console.error("Error in /api/change-email:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

app.post("/api/change-password", authenticateToken, async (req, res) => {
  try {
    const { email, newPassword, newPasswordCheck, otp } = req.body;

    // Step 1: Validate input
    if (!email || !newPassword || !newPasswordCheck || !otp) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Step 2: Check if new passwords match
    if (newPassword !== newPasswordCheck) {
      return res.status(400).json({ error: "New passwords do not match." });
    }

    // Step 3: Check if the email exists in the user table
    const user = await findAccountByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Email not found." });
    }

    // Step 4: Get the reset code from the change_password_or_email table
    const resetEntry = await getResetCode(user.user_id, user.user_role, "password");
    if (!resetEntry) {
      return res.status(404).json({ error: "Reset code not found." });
    }

    // Step 5: Verify the OTP (reset code)
    const isOtpValid = await bcrypt.compare(otp, resetEntry.reset_code);
    if (!isOtpValid) {
      return res.status(401).json({ error: "Invalid OTP code." });
    }

    // Step 6: Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 7: Update the password
    const updateResult = await updateUserPassword(user.user_id, hashedPassword);
    if (!updateResult) {
      return res.status(500).json({ error: "Failed to update password." });
    }

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in /api/change-password:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});
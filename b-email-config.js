import createTransporter from "./b-mailer.js";

const businessName = "East Gate Driver's ED Driving School";

export async function sendEmail(type, recipient, data) {
  const transporter = await createTransporter();

  let subject;
  let textBody;

  // Choose template based on type
  switch (type) {
    case "new-account":
      // Expect data to have: email, generatedPassword, dateCreated
      subject = `Welcome to ${businessName}!`;
      textBody = `
  Hi ${data.name},
  
  Welcome to ${businessName}! Your account has been successfully created using your Google login.
  
  Here are your account details:
    - Email: ${data.email}
    - Password: ${data.generatedPassword}
    - Date Created: ${data.dateCreated}
  
  Please keep this information safe and use it to log in the first time. You can change your password later from login page > forgot password.
  
  Best regards,
  The ${businessName} Team
        `;
      break;

    case "forgot-password-email":
      // Expect data to have: otp
      subject = "Your OTP for Account Recovery";
      textBody = `
  Hi,
  
  Here is your One-Time Password (OTP) for account recovery:
    OTP: ${data.otp}
  
  Please note that this OTP is valid for only 20 minutes. If you did not request this, please contact support immediately.
  
  Regards,
  ${businessName}
        `;
      break;

    case "password-changed" || "email-changed":
      // Expect data to have: email, generatedPassword, dateCreated
      subject = `${
        type === "password-changed" ? "Password" : "Email"
      } Change Confirmation`;
      textBody = `
    Hi ${data.name},
    
    Your account has been successfully updated.
    
    Here are your account details:
      - Email: ${data.email}
      - Password: ${data.password}
      - Date Modified: ${data.dateModified}
    
    Please keep this information safe and use it to log in. If you dont recognize this action, Please contanct us imeadiately.
    
    Best regards,
    The ${businessName} Team
          `;
      break;

    case "apply-enroll":
      subject = "Driver School Application Confirmation";
      textBody = `
  Hi ${data.name || "Applicant"},
  
  Thank you for applying to the ${businessName} Driver School.
  We have received your application and noted your preferred dates: ${
    data.appliedDates
  }.
  
  We will review your application and contact you with further instructions.
  
  Best regards,
  The ${businessName} Team
        `;
      break;

    case "completion-certificate":
      subject = "Congratulations on Completing Your Course!";
      textBody = `
        Hi ${data.name || "Trainee"},
        Congratulations on successfully completing your course at ${businessName}!
        Your completion certificate is attached to this email.
        Please keep it safe for your records.

        Best regards,
        The ${businessName} Team
        `;
      break;

    default:
      throw new Error("Invalid email type specified.");
  }

  const mailOptions = {
    from: process.env.GOOGLE_EMAIL,
    to: recipient,
    subject: subject,
    text: textBody,
  };

  if (type === "completion-certificate" && data.certificate) {
    mailOptions.attachments = [
      {
        filename: "certificate.pdf",
        content: data.certificate, // Buffer or base64 string
        contentType: "application/pdf",
      },
    ];
  }

  // Return a promise so the calling function can handle errors/responses
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // Reject error so you can catch it in your route/controller
        reject(error);
      } else {
        // Resolve info to let the caller decide what to do next
        resolve(info);
      }
    });
  });
}

import axios from "axios";
import { env } from "../config/env.js";

/**
 * Reusable layout for modern, dark-themed email templates
 */
const generateDarkEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #121212; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #121212; padding-bottom: 40px; }
    .main { background-color: #1e1e1e; margin: 40px auto; max-width: 600px; border-radius: 8px; border: 1px solid #333333; overflow: hidden; color: #e0e0e0; }
    .header { padding: 30px; text-align: center; border-bottom: 1px solid #333333; background-color: #181818; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .header h1 span { color: #6366F1; } /* Indigo accent for Vault */
    .body-content { padding: 30px; line-height: 1.6; font-size: 16px; }
    .body-content h3 { color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 500; }
    .body-content p { margin: 0 0 15px 0; color: #cccccc; }
    .highlight { color: #ffffff; font-weight: bold; }
    .info-box { background-color: #252525; border-left: 4px solid #6366F1; padding: 15px 20px; border-radius: 0 6px 6px 0; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #333333; background-color: #181818; }
    .footer p { margin: 5px 0; }
    .btn { display: inline-block; background-color: #6366F1; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 15px; text-align: center; }
    .btn:hover { background-color: #4F46E5; }
    .status-approved { color: #10B981; font-weight: bold; }
    .status-rejected { color: #EF4444; font-weight: bold; }
    .border-approved { border-left-color: #10B981; }
    .border-rejected { border-left-color: #EF4444; }
    .border-warning { border-left-color: #F59E0B; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>Legacy<span>Vault</span></h1>
      </div>
      <div class="body-content">
        ${content}
      </div>
      <div class="footer">
        <p>This is an automated message from LegacyVault. Please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} LegacyVault. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends an email using Brevo's API. Logs to console as fallback in development if API key is missing.
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Development/Test Fallback when Brevo configuration is missing
    if (!env.BREVO_API_KEY || !env.MAIL_FROM || !env.MAIL_FROM_NAME) {
      if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
        console.log(`
          ====== [SIMULATED EMAIL LOG] ======
          To: ${to}
          Subject: ${subject}
          Content: ${html.replace(/<[^>]*>/g, " ")}
          ====================================
        `);
        return { message: "Simulated email sent successfully (dev fallback)" };
      }
      throw new Error("Brevo SMTP credentials are not fully configured in the environment");
    }

    if (!to) throw new Error("Receiver email (to) is missing");
    if (!subject) throw new Error("Email subject is missing");
    if (!html) throw new Error("Email html is missing");

    const toList = Array.isArray(to)
      ? to.map((email) => ({ email }))
      : [{ email: to }];

    const payload = {
      sender: {
        name: env.MAIL_FROM_NAME,
        email: env.MAIL_FROM,
      },
      to: toList,
      subject,
      htmlContent: html,
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Brevo email error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Failed to send email");
  }
};

/**
 * Sends notification when user inactivity is detected and verification starts.
 */
export const sendNomineeNotification = async (nomineeEmail, nomineeName, ownerName, inactivityDays) => {
  const subject = `LegacyVault Notification: Inheritance Case Triggered for ${ownerName}`;
  const html = generateDarkEmailTemplate(`
    <h3>Hello ${nomineeName},</h3>
    <p>We are notifying you that <span class="highlight">${ownerName}</span> has designated you as a nominee on LegacyVault.</p>
    
    <div class="info-box">
      <p style="margin: 0;">Due to prolonged inactivity (<span class="highlight">${inactivityDays} days</span>) on their account, an automated verification workflow has been initiated.</p>
    </div>
    
    <p>You can now log in to your nominee account and request access to the designated assets assigned to you.</p>
    
    <!-- Assuming your app runs on a known URL, replace '#' with your actual frontend login URL -->
    <a href="#" class="btn">Log in to LegacyVault</a>
  `);
  
  return await sendEmail({ to: nomineeEmail, subject, html });
};

/**
 * Sends notification when nominee requests access.
 */
export const sendAccessRequestedNotification = async (adminEmails, nomineeName, ownerName, assetTitle) => {
  const subject = `LegacyVault Admin Alert: Access Requested by Nominee`;
  const html = generateDarkEmailTemplate(`
    <h3>Admin Alert,</h3>
    <p>Nominee <span class="highlight">${nomineeName}</span> has submitted a new access request.</p>
    
    <div class="info-box border-warning">
      <p style="margin: 0 0 5px 0;"><strong>Asset:</strong> <span class="highlight">${assetTitle}</span></p>
      <p style="margin: 0;"><strong>Owner:</strong> <span class="highlight">${ownerName}</span></p>
    </div>
    
    <p>Please log in to the Admin Dashboard to review this request. You can either approve or reject the release of this asset.</p>
    
    <a href="#" class="btn" style="background-color: #F59E0B;">Review Request</a>
  `);
  
  // Send to list of admin emails
  for (const adminEmail of adminEmails) {
    try {
      await sendEmail({ to: adminEmail, subject, html });
    } catch (err) {
      console.warn("Failed to notify admin:", adminEmail, err.message);
    }
  }
};

/**
 * Sends notification when an access request is approved.
 */
export const sendAccessApprovedNotification = async (nomineeEmail, nomineeName, assetTitle, ownerName) => {
  const subject = `LegacyVault Access Request: APPROVED`;
  const html = generateDarkEmailTemplate(`
    <h3>Hello ${nomineeName},</h3>
    <p>We are pleased to inform you that your request to access the asset below has been <span class="status-approved">APPROVED</span> by the platform administrator.</p>
    
    <div class="info-box border-approved">
      <p style="margin: 0 0 5px 0;"><strong>Asset:</strong> <span class="highlight">${assetTitle}</span></p>
      <p style="margin: 0;"><strong>Owner:</strong> <span class="highlight">${ownerName}</span></p>
    </div>
    
    <p>You can now log in to the platform and view or download the decrypted details under your <strong>"Released Assets"</strong> page.</p>
    
    <a href="#" class="btn" style="background-color: #10B981;">View Assets</a>
  `);
  
  return await sendEmail({ to: nomineeEmail, subject, html });
};

/**
 * Sends notification when an access request is rejected.
 */
export const sendAccessRejectedNotification = async (nomineeEmail, nomineeName, assetTitle, ownerName, reason) => {
  const subject = `LegacyVault Access Request: REJECTED`;
  const html = generateDarkEmailTemplate(`
    <h3>Hello ${nomineeName},</h3>
    <p>We regret to inform you that your request to access the asset below has been <span class="status-rejected">REJECTED</span> by the platform administrator.</p>
    
    <div class="info-box border-rejected">
      <p style="margin: 0 0 5px 0;"><strong>Asset:</strong> <span class="highlight">${assetTitle}</span></p>
      <p style="margin: 0 0 10px 0;"><strong>Owner:</strong> <span class="highlight">${ownerName}</span></p>
      <p style="margin: 0; padding-top: 10px; border-top: 1px solid #444; color: #EF4444;">
        <strong>Reason:</strong> <em>${reason || "Verification details could not be validated."}</em>
      </p>
    </div>
    
    <p>If you believe this is an error, please reach out to the administrator for further clarification.</p>
  `);
  
  return await sendEmail({ to: nomineeEmail, subject, html });
};
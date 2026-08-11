import axios from "axios";
import { env } from "../config/env.js";

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
  const html = `
    <h3>Hello ${nomineeName},</h3>
    <p>We are notifying you that <strong>${ownerName}</strong> has designated you as a nominee on LegacyVault.</p>
    <p>Due to prolonged inactivity (${inactivityDays} days) of their account, a verification workflow has been initiated.</p>
    <p>You can now log in to your nominee account and request access to the designated assets assigned to you.</p>
    <br/>
    <p>Best regards,</p>
    <p>LegacyVault Team</p>
  `;
  return await sendEmail({ to: nomineeEmail, subject, html });
};

/**
 * Sends notification when nominee requests access.
 */
export const sendAccessRequestedNotification = async (adminEmails, nomineeName, ownerName, assetTitle) => {
  const subject = `LegacyVault Admin Notification: Access Requested by Nominee`;
  const html = `
    <h3>Admin Alert,</h3>
    <p>Nominee <strong>${nomineeName}</strong> has submitted an access request for the asset: <strong>${assetTitle}</strong> owned by <strong>${ownerName}</strong>.</p>
    <p>Please log in to the Admin Dashboard to review and approve or reject this request.</p>
    <br/>
    <p>Best regards,</p>
    <p>LegacyVault Auto-Mailer</p>
  `;
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
  const html = `
    <h3>Hello ${nomineeName},</h3>
    <p>We are pleased to inform you that your request to access the asset: <strong>${assetTitle}</strong> (owned by <strong>${ownerName}</strong>) has been <strong>APPROVED</strong> by the platform administrator.</p>
    <p>You can now log in to the platform and view/download the decrypted details under your "Released Assets" page.</p>
    <br/>
    <p>Best regards,</p>
    <p>LegacyVault Team</p>
  `;
  return await sendEmail({ to: nomineeEmail, subject, html });
};

/**
 * Sends notification when an access request is rejected.
 */
export const sendAccessRejectedNotification = async (nomineeEmail, nomineeName, assetTitle, ownerName, reason) => {
  const subject = `LegacyVault Access Request: REJECTED`;
  const html = `
    <h3>Hello ${nomineeName},</h3>
    <p>We regret to inform you that your request to access the asset: <strong>${assetTitle}</strong> (owned by <strong>${ownerName}</strong>) has been <strong>REJECTED</strong> by the platform administrator.</p>
    <p>Reason provided: <em>${reason || "Verification details could not be validated."}</em></p>
    <p>If you believe this is an error, please contact the administrator.</p>
    <br/>
    <p>Best regards,</p>
    <p>LegacyVault Team</p>
  `;
  return await sendEmail({ to: nomineeEmail, subject, html });
};

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config/config.js';

/**
 * Creates or retrieves the active Nodemailer SMTP transporter.
 * Supports Gmail (service: 'gmail' or smtp.gmail.com) and custom SMTP servers.
 */
function getNodemailerTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || config.smtpUser;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || config.smtpPass;
  const host = process.env.SMTP_HOST || config.smtpHost || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || config.smtpPort || 587, 10);
  const secure = process.env.SMTP_SECURE === 'true' || config.smtpSecure || false;

  if (!user || !pass) {
    return null;
  }

  const isGmail = user.includes('@gmail.com') || host.includes('gmail');
  return nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: { user, pass }
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass }
        }
  );
}

/**
 * Creates or retrieves the Resend client instance.
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || config.resendApiKey;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new Resend(apiKey.trim());
}

export const emailService = {
  /**
   * Sends a real password reset email containing a 6-digit verification code.
   * Dispatches via Nodemailer SMTP (Gmail / Custom SMTP) or Resend API.
   * If no credentials are configured, throws a clear configuration error.
   */
  async sendPasswordResetEmail({ toEmail, recipientName, resetCode, resetUrl }) {
    if (!toEmail) {
      throw new Error('Recipient email address is required.');
    }

    const cleanEmail = toEmail.trim().toLowerCase();
    const name = recipientName || 'SmartMess User';
    const code = resetCode.toString().trim();
    const subject = `SmartMess — Password Reset Code: ${code}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - SmartMess</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #EDF2F7;" cellspacing="0" cellpadding="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #D95420 100%); padding: 32px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SmartMess</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0; font-size: 13px; font-weight: 500;">Smart Campus Mess Food Ordering & Management</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #1A202C;">Password Reset Request</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4A5568;">
                Hello <strong>${name}</strong>,<br>
                We received a request to reset the password for your SmartMess account associated with <strong>${cleanEmail}</strong>.
              </p>

              <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Your 6-Digit Verification Code</p>

              <!-- OTP Code Card -->
              <div style="background-color: #FFF5F0; border: 2px dashed #FF6B35; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #FF6B35; font-family: monospace; display: inline-block;">${code}</span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #718096;">Valid for <strong>15 minutes</strong></p>
              </div>

              ${resetUrl ? `
              <div style="text-align: center; margin: 0 0 24px;">
                <a href="${resetUrl}" style="background-color: #FF6B35; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);">Reset Password Now</a>
              </div>
              ` : ''}

              <!-- Security Warning -->
              <div style="background-color: #F7FAFC; border-left: 4px solid #CBD5E0; padding: 12px 16px; border-radius: 4px; margin: 0 0 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #718096;">
                  🔒 <strong>Security Tip:</strong> Never share this code with anyone. SmartMess administrators will never ask for your verification code or password.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #A0AEC0;">
                If you did not request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F7FAFC; padding: 20px 32px; border-top: 1px solid #EDF2F7; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">
                © ${new Date().getFullYear()} SmartMess Campus Food Management System. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Try Nodemailer SMTP (Gmail / Custom SMTP)
    const transporter = getNodemailerTransporter();
    if (transporter) {
      try {
        const user = process.env.SMTP_USER || process.env.GMAIL_USER || config.smtpUser;
        const fromAddress = user ? `"Smart Campus Mess" <${user}>` : config.emailFrom;
        const info = await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject,
          html: htmlContent
        });
        console.log(`✉️ [Nodemailer SMTP] Real password reset email delivered to ${cleanEmail}. Message ID: ${info.messageId}`);
        return {
          success: true,
          provider: 'nodemailer',
          messageId: info.messageId,
          to: cleanEmail,
          message: `Password reset email dispatched to ${cleanEmail}. Please check your inbox.`
        };
      } catch (smtpErr) {
        console.error('❌ Nodemailer SMTP delivery error:', smtpErr.message);
        throw new Error(`Failed to deliver email via SMTP: ${smtpErr.message}`);
      }
    }

    // 2. Try Resend API
    const resend = getResendClient();
    if (resend) {
      try {
        const result = await resend.emails.send({
          from: config.emailFrom || 'Smart Campus Mess <onboarding@resend.dev>',
          to: cleanEmail,
          subject,
          html: htmlContent
        });

        if (result.error) {
          console.error('❌ Resend API delivery error:', result.error.message);
          throw new Error(`Resend email delivery failed: ${result.error.message}`);
        }

        console.log(`✉️ [Resend API] Real password reset email delivered to ${cleanEmail}. ID: ${result.data?.id}`);
        return {
          success: true,
          provider: 'resend',
          id: result.data?.id,
          to: cleanEmail,
          message: `Password reset email dispatched to ${cleanEmail}. Please check your inbox.`
        };
      } catch (resendErr) {
        console.error('❌ Resend API delivery error:', resendErr.message);
        throw new Error(`Failed to deliver email via Resend: ${resendErr.message}`);
      }
    }

    // 3. No email transport configured
    throw new Error(
      'Email service is not configured. To send real emails to inboxes, please add your Gmail/SMTP credentials (SMTP_USER & SMTP_PASS) or RESEND_API_KEY in backend/.env.'
    );
  }
};

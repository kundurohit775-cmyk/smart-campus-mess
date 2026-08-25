import { Resend } from 'resend';
import { config } from '../config/config.js';

let resendClient = null;
function getResendClient() {
  if (!config.resendApiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

/**
 * Reusable function to dispatch Email OTP via Resend API
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit one-time password
 * @param {string} purpose - 'registration' | 'login' | 'verification'
 */
export async function sendOtpEmail(toEmail, otp, purpose = 'verification') {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  const resend = getResendClient();

  const purposeText = purpose === 'register' ? 'Account Registration' : 'Account Sign-In';
  const subject = `Your Smart Campus Mess Verification Code: ${otp}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #ea580c, #f59e0b); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
        .content { padding: 32px 24px; }
        .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ea580c; font-family: monospace; margin: 0; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-text">🍽️ Smart Campus Mess</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Digital Token & Credit Management System</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">${purposeText}</span>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;">Verify Your Email Address</h2>
            <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.5;">
              Use the single-use verification code below to complete your ${purposeText.toLowerCase()} on Smart Campus Mess.
            </p>
          </div>

          <div class="otp-box">
            <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9a3412; margin: 0 0 8px 0;">Your 6-Digit OTP</p>
            <p class="otp-code">${otp}</p>
          </div>

          <div style="background: #f1f5f9; border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #334155; margin-bottom: 20px;">
            <p style="margin: 0 0 4px 0;">⏱️ <strong>Valid for ${config.otpExpiryMinutes} minutes</strong></p>
            <p style="margin: 0;">🔒 For your security, never share this code with anyone.</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Smart Campus Mess Platform • VIT Campus</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Your Smart Campus Mess verification code is: ${otp}\n\nValid for ${config.otpExpiryMinutes} minutes for ${purposeText.toLowerCase()}.\nDo not share this code with anyone.`;

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: config.emailFrom,
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: textContent
      });
      return {
        success: true,
        messageId: response?.data?.id,
        isSimulated: false
      };
    } catch (err) {
      console.error('❌ Resend email dispatch failed:', err);
      throw new Error(`Failed to dispatch verification email: ${err.message}`);
    }
  } else {
    // Development / Local simulation mode when RESEND_API_KEY is not configured
    console.log('----------------------------------------------------');
    console.log(`✉️ [EMAIL OTP SIMULATION]`);
    console.log(`   To: ${cleanEmail}`);
    console.log(`   Purpose: ${purposeText}`);
    console.log(`   Code: ${otp} (Valid for ${config.otpExpiryMinutes} min)`);
    console.log('----------------------------------------------------');
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
      isSimulated: true
    };
  }
}

export const emailService = {
  sendOtpEmail
};

import twilio from 'twilio';
import { config } from '../config/config.js';

let twilioClient = null;
if (config.twilioAccountSid && config.twilioAuthToken) {
  try {
    twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  } catch (err) {
    console.warn('⚠️ Twilio client init error:', err.message);
  }
}

export const smsService = {
  /**
   * Dispatches actual 6-digit OTP SMS via Twilio Verify / Messages API or MSG91
   * @param {string} phoneNumber - E.164 format (+91...)
   * @param {string} otpCode - 6 digit OTP string
   */
  async sendOtpSms(phoneNumber, otpCode) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const messageBody = `Your Smart Campus Mess login verification code is ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;

    // 1. Dispatch via Twilio Verify Service (Best for real mobile delivery)
    if (twilioClient && config.twilioVerifyServiceSid) {
      try {
        const verification = await twilioClient.verify.v2
          .services(config.twilioVerifyServiceSid)
          .verifications.create({
            to: formattedPhone,
            channel: 'sms'
          });
        console.log(`📲 [Twilio Verify SMS Dispatched] SID: ${verification.sid} to ${formattedPhone} (Status: ${verification.status})`);
        return { success: true, provider: 'twilio-verify', sid: verification.sid, status: verification.status };
      } catch (err) {
        console.error('❌ Twilio Verify delivery failed:', err.message);
        // Catch Twilio Trial limitation: Trial accounts can only send SMS to numbers verified in Twilio Console
        if (err.code === 21608 || err.code === 572002 || err.message?.includes('unverified')) {
          console.warn(`⚠️ [Twilio Trial Restriction] ${formattedPhone} is not verified in Twilio Console. (To send real SMS to this number, add it at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified or upgrade to paid). Generated OTP: ${otpCode}`);
          return {
            success: true,
            provider: 'twilio-trial-fallback',
            isTrialUnverified: true,
            devCode: otpCode,
            message: `OTP: ${otpCode} (Twilio Trial: ${formattedPhone} not verified in Twilio console)`
          };
        }
        throw new Error(`SMS delivery failed via Twilio Verify: ${err.message}`);
      }
    }

    // 2. Dispatch via Twilio Messages API
    if (twilioClient && config.twilioPhoneNumber) {
      try {
        const message = await twilioClient.messages.create({
          body: messageBody,
          from: config.twilioPhoneNumber,
          to: formattedPhone
        });
        console.log(`📲 [Twilio SMS Delivered] SID: ${message.sid} to ${formattedPhone}`);
        return { success: true, provider: 'twilio-sms', messageId: message.sid };
      } catch (err) {
        console.error('❌ Twilio Messages API delivery failed:', err.message);
        if (err.code === 21608 || err.code === 572002 || err.message?.includes('unverified')) {
          console.warn(`⚠️ [Twilio Trial Restriction] ${formattedPhone} is not verified in Twilio Console. Generated OTP: ${otpCode}`);
          return {
            success: true,
            provider: 'twilio-trial-fallback',
            isTrialUnverified: true,
            devCode: otpCode,
            message: `OTP: ${otpCode} (Twilio Trial: ${formattedPhone} not verified in Twilio console)`
          };
        }
        throw new Error(`SMS delivery failed via Twilio: ${err.message}`);
      }
    }

    // 3. Dispatch via MSG91 API
    if (config.msg91AuthKey) {
      try {
        const msg91Url = 'https://control.msg91.com/api/v5/otp';
        const mobileDigits = formattedPhone.replace(/\D/g, '');
        const response = await fetch(
          `${msg91Url}?template_id=${config.msg91TemplateId || ''}&mobile=${mobileDigits}&authkey=${config.msg91AuthKey}&otp=${otpCode}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const result = await response.json();
        if (result.type === 'error') {
          throw new Error(result.message || 'MSG91 delivery error');
        }
        console.log(`📲 [MSG91 SMS Delivered] Response:`, result);
        return { success: true, provider: 'msg91', result };
      } catch (err) {
        console.error('❌ MSG91 SMS delivery failed:', err.message);
        throw new Error(`SMS delivery failed via MSG91: ${err.message}`);
      }
    }

    throw new Error(
      'SMS Gateway is not configured. Please add TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN in backend/.env to send real SMS.'
    );
  },

  /**
   * Verifies code via Twilio Verify Service if configured
   */
  async checkTwilioVerify(phoneNumber, code) {
    if (twilioClient && config.twilioVerifyServiceSid) {
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        const check = await twilioClient.verify.v2
          .services(config.twilioVerifyServiceSid)
          .verificationChecks.create({
            to: formattedPhone,
            code: code.trim()
          });
        console.log(`🔍 [Twilio Verify Check] SID: ${check.sid} Status: ${check.status}`);
        return check.status === 'approved';
      } catch (err) {
        console.warn('Twilio verify check error:', err.message);
        return false;
      }
    }
    return false;
  },

  /**
   * Formats phone number into standard international format (+91 for India by default)
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9+]/g, '').trim();
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
    return cleaned;
  }
};

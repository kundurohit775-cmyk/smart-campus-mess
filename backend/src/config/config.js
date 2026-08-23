import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || 'f9b3c4a17e820d95c18a24e930f7b194d6e85c2107b34e12a9d8f7604b321e05',
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5050',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.BETTER_AUTH_SECRET || 'smart-campus-mess-secret-key-2026',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './mess_management.db',
  monthlyCreditLimit: 9000,
  lowCreditThreshold: 500,

  // Dedicated Chef & Admin Email Restrictions from Environment Variables
  chefEmail: (process.env.CHEF_EMAIL || '').trim().toLowerCase(),
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),

  // Twilio SMS & Verify Configuration
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',

  // MSG91 SMS Configuration
  msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
  msg91SenderId: process.env.MSG91_SENDER_ID || '',
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || ''
};

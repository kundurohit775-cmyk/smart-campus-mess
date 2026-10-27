import db from './src/db/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './src/config/config.js';

const TEST_ACCOUNTS = [
  { email: "warden.blocka@vitstudent.ac.in", password: "WardenA@2026!", block: "Block A" },
  { email: "warden.blockb@vitstudent.ac.in", password: "WardenB@2026!", block: "Block B" },
  { email: "warden.blockc@vitstudent.ac.in", password: "WardenC@2026!", block: "Block C" },
  { email: "warden.blockd@vitstudent.ac.in", password: "WardenD@2026!", block: "Block D" }
];

async function verifyLogins() {
  console.log('🧪 Simulating API Login for all 4 Warden Accounts...\n');

  for (const acc of TEST_ACCOUNTS) {
    const warden = await db.get('SELECT * FROM wardens WHERE email = ?', acc.email.toLowerCase());
    if (!warden) throw new Error(`Missing account: ${acc.email}`);

    const isMatch = await bcrypt.compare(acc.password, warden.password_hash);
    if (!isMatch) throw new Error(`Password mismatch for: ${acc.email}`);

    const token = jwt.sign(
      { id: warden.warden_id, email: warden.email, role: 'warden', name: warden.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const decoded = jwt.verify(token, config.jwtSecret);
    console.log(`✅ Login Success: ${acc.email}`);
    console.log(`   ID: ${warden.warden_id} | Role: ${decoded.role} | Block: ${warden.assigned_hostel_block} | JWT Token Generated (${token.substring(0, 20)}...)`);
  }

  console.log('\n🎉 ALL 4 WARDEN ACCOUNTS VERIFIED AND READY FOR USE! 🚀\n');
}

verifyLogins().then(() => process.exit(0)).catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

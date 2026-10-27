import db from './src/db/database.js';
import { migrateWardens } from './src/db/migrate_warden.js';
import { sickLeaveService } from './src/services/sickLeaveService.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/config.js';

async function runWardenTests() {
  console.log('🧪 Testing Dynamic Hostel Block Selection & Warden In-App Approval Flow...\n');

  try {
    // 1. Run Migration
    await migrateWardens();

    // 2. Fetch or create test student
    let student = await db.get("SELECT student_id, name, email, phone FROM students WHERE email LIKE '%@vitstudent.ac.in' LIMIT 1");
    if (!student) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Sick Test Student', 'sick_test_student@vitstudent.ac.in', '9876543219', 'hash', 'Room A-204', 'active')
      `);
      student = { student_id: res.lastInsertRowid, name: 'Sick Test Student', email: 'sick_test_student@vitstudent.ac.in', phone: '9876543219' };
    }
    const studentId = student.student_id;

    // 3. Fetch any Warden account
    const warden = await db.get("SELECT * FROM wardens LIMIT 1");
    if (!warden) {
      throw new Error("Expected at least one warden in database.");
    }
    console.log(`✅ Loaded Warden: ${warden.name} (${warden.email})`);

    // Clean up previous test requests for this student
    await db.run('DELETE FROM health_requests WHERE student_id = ?', studentId);

    // 4. Student submits Request 1 for Men's Hostel Block A
    const todayStr = new Date().toISOString().split('T')[0];
    const req1Result = await sickLeaveService.createRequest(studentId, {
      hostelName: "Men's Hostel Block A",
      roomNumber: "A-204",
      reason: "Viral fever - need dinner delivered to Room A-204",
      requestedDate: todayStr
    });
    const req1 = req1Result.request;
    console.log(`✅ Step 1: Created Request #${req1.request_id} in Men's Hostel Block A`);

    // 5. Student submits Request 2 for Men's Hostel Block B
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const req2Result = await sickLeaveService.createRequest(studentId, {
      hostelName: "Men's Hostel Block B",
      roomNumber: "B-108",
      reason: "Sprained ankle - need breakfast delivered to Room B-108",
      requestedDate: tomorrowStr
    });
    const req2 = req2Result.request;
    console.log(`✅ Step 2: Created Request #${req2.request_id} in Men's Hostel Block B`);

    // 6. Test Querying Scoped to Block A
    const blockARes = await db.query(`
      SELECT h.*, s.name as student_name
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE (LOWER(h.hostel_name) = LOWER($1) OR (LOWER(h.hostel_name) NOT LIKE '%ladies%' AND (LOWER(h.hostel_name) LIKE $2 OR LOWER(h.hostel_name) LIKE $3)))
      ORDER BY h.request_id DESC
    `, ["Men's Hostel Block A", "%block a%", "%block-a%"]);
    
    const blockAIds = blockARes.rows.map(r => r.request_id);
    if (!blockAIds.includes(req1.request_id) || blockAIds.includes(req2.request_id)) {
      throw new Error("Block A filter returned incorrect requests!");
    }
    console.log(`✅ Step 3: Selector 'Block A' returned only Block A requests (${blockARes.rows.length} found).`);

    // 7. Test Querying Scoped to Block B
    const blockBRes = await db.query(`
      SELECT h.*, s.name as student_name
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE (LOWER(h.hostel_name) = LOWER($1) OR (LOWER(h.hostel_name) NOT LIKE '%ladies%' AND (LOWER(h.hostel_name) LIKE $2 OR LOWER(h.hostel_name) LIKE $3)))
      ORDER BY h.request_id DESC
    `, ["Men's Hostel Block B", "%block b%", "%block-b%"]);
    
    const blockBIds = blockBRes.rows.map(r => r.request_id);
    if (!blockBIds.includes(req2.request_id) || blockBIds.includes(req1.request_id)) {
      throw new Error("Block B filter returned incorrect requests!");
    }
    console.log(`✅ Step 4: Selector 'Block B' returned only Block B requests (${blockBRes.rows.length} found).`);

    // 8. Warden Approves Block A Request
    await db.query(`
      UPDATE health_requests
      SET 
        status = 'approved',
        reviewed_by = $1,
        reviewed_at = NOW(),
        responded_at = NOW()
      WHERE request_id = $2
    `, [warden.warden_id, req1.request_id]);
    console.log(`✅ Step 5: Warden approved Request #${req1.request_id} for Block A`);

    // 9. Verify Student Delivery Unlock for today
    const studentStatus = await sickLeaveService.getStudentStatus(studentId, todayStr);
    if (!studentStatus.isApproved) {
      throw new Error("Student delivery was not unlocked after approval!");
    }
    console.log(`✅ Step 6: Student delivery unlocked for ${todayStr} (isApproved: ${studentStatus.isApproved})`);

    // 10. Clean up test health requests
    await db.run('DELETE FROM health_requests WHERE student_id = ?', studentId);
    console.log('✅ Step 7: Cleaned up test health requests.');

    console.log('\n🎉 ALL DYNAMIC BLOCK SELECTOR & WARDEN TESTS PASSED! 🚀\n');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  }
}

runWardenTests().then(() => process.exit(0));

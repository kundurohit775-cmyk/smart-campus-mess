import db from './src/db/database.js';
import { migrateWardens } from './src/db/migrate_warden.js';
import { sickLeaveService } from './src/services/sickLeaveService.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/config.js';

async function runWardenTests() {
  console.log('🧪 Starting Warden Role & In-App Approval Flow Automated Tests...\n');

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

    // 3. Fetch Block A Warden
    const warden = await db.get("SELECT * FROM wardens WHERE email = 'warden.blocka@vitstudent.ac.in'");
    if (!warden) {
      throw new Error("Expected Block A warden in database.");
    }
    console.log(`✅ Loaded Warden: ${warden.name} (${warden.assigned_hostel_block})`);

    // Clean up previous test requests for this student
    await db.run('DELETE FROM health_requests WHERE student_id = ?', studentId);

    // 4. Student submits sick leave request for Men's Hostel Block A
    const testDate1 = new Date().toISOString().split('T')[0];
    const req1Result = await sickLeaveService.createRequest(studentId, {
      hostelName: "Men's Hostel Block A",
      roomNumber: "A-204",
      reason: "High fever and viral fatigue, unable to walk to canteen",
      requestedDate: testDate1
    });
    const req1 = req1Result.request;
    console.log(`\n✅ Step 1: Student submitted Sick Leave Request #${req1.request_id} for ${testDate1}`);
    console.log(`   Status: ${req1.status}, Assigned Hostel: ${req1.hostel_name}`);

    // 5. Warden queries pending requests for their block
    const blockRequestsRes = await db.query(`
      SELECT h.*, s.name as student_name
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE (LOWER(h.hostel_name) = LOWER($1) OR LOWER(h.hostel_name) LIKE LOWER($2))
        AND h.status = 'pending'
      ORDER BY h.request_id DESC
    `, [warden.assigned_hostel_block, `%${warden.assigned_hostel_block.replace(/Hostel|Block/gi, '').trim()}%`]);

    const foundInQueue = blockRequestsRes.rows.some(r => r.request_id === req1.request_id);
    if (!foundInQueue) {
      throw new Error(`Request #${req1.request_id} not found in Warden's pending queue for ${warden.assigned_hostel_block}`);
    }
    console.log(`✅ Step 2: Request #${req1.request_id} visible in Warden's pending dispatch queue (${blockRequestsRes.rows.length} pending).`);

    // 6. Warden approves request #1 in-app
    await db.query(`
      UPDATE health_requests
      SET 
        status = 'approved',
        reviewed_by = $1,
        reviewed_at = NOW(),
        responded_at = NOW()
      WHERE request_id = $2
    `, [warden.warden_id, req1.request_id]);
    console.log(`✅ Step 3: Warden #${warden.warden_id} (${warden.name}) approved Request #${req1.request_id}`);

    // 7. Student checks status
    const studentStatus1 = await sickLeaveService.getStudentStatus(studentId, testDate1);
    console.log(`✅ Step 4: Student status verified:`);
    console.log(`   isApproved: ${studentStatus1.isApproved}`);
    console.log(`   deliveryUnlocked: ${studentStatus1.isApproved}`);
    console.log(`   status: ${studentStatus1.status}`);

    if (!studentStatus1.isApproved || studentStatus1.status !== 'approved') {
      throw new Error("Student delivery was not unlocked after warden approval!");
    }

    // 8. Submit Request #2 for tomorrow and test Warden Rejection with reason
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const req2Result = await sickLeaveService.createRequest(studentId, {
      hostelName: "Men's Hostel Block A",
      roomNumber: "A-204",
      reason: "Need breakfast in room tomorrow",
      requestedDate: tomorrowDate
    });
    const req2 = req2Result.request;
    console.log(`\n✅ Step 5: Student submitted second Request #${req2.request_id} for ${tomorrowDate}`);

    const rejectionReason = "Medical certificate / dispensary slip required for advance day delivery.";
    await db.query(`
      UPDATE health_requests
      SET 
        status = 'rejected',
        reviewed_by = $1,
        reviewed_at = NOW(),
        responded_at = NOW(),
        rejection_reason = $2
      WHERE request_id = $3
    `, [warden.warden_id, rejectionReason, req2.request_id]);
    console.log(`✅ Step 6: Warden rejected Request #${req2.request_id} with reason: "${rejectionReason}"`);

    // 9. Student checks rejected status
    const studentStatus2 = await sickLeaveService.getStudentStatus(studentId, tomorrowDate);
    console.log(`✅ Step 7: Student rejection response verified:`);
    console.log(`   status: ${studentStatus2.status}`);
    console.log(`   isApproved: ${studentStatus2.isApproved}`);
    console.log(`   rejectionReason: "${studentStatus2.request?.rejection_reason || studentStatus2.message}"`);

    if (studentStatus2.isApproved || studentStatus2.status !== 'rejected') {
      throw new Error("Expected rejected status for request #2!");
    }

    // 10. Clean up test records
    console.log('\n🧹 Cleaning up test health requests...');
    await db.run('DELETE FROM health_requests WHERE student_id = ?', studentId);
    console.log('✅ Cleaned up synthetic records.');

    console.log('\n🎉 ALL WARDEN AUTH & APPROVAL FLOW TESTS PASSED! 🚀\n');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  }
}

runWardenTests().then(() => process.exit(0));

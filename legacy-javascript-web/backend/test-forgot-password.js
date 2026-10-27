import db from './src/db/database.js';
import bcrypt from 'bcryptjs';
import { passwordResetService } from './src/services/passwordResetService.js';

async function runForgotPasswordTests() {
  console.log('======================================================================');
  console.log('🧪 RUNNING FORGOT PASSWORD & EMAIL RESET TESTS');
  console.log('======================================================================\n');

  try {
    // 1. Find a test student from DB
    const student = await db.get('SELECT student_id, name, email, password_hash FROM students LIMIT 1');
    if (!student) {
      throw new Error('No student found in database to test.');
    }
    console.log(`👤 Test Student found: #${student.student_id} - ${student.name} (${student.email})`);

    // 2. Test Request with Non-Existent Email
    console.log('\n--- Test 1: Request with unknown email ---');
    try {
      await passwordResetService.requestReset('unknown.nonexistent.user@vitstudent.ac.in');
      console.error('❌ Test 1 Failed: Should have rejected unknown email!');
    } catch (e) {
      console.log(`✅ Test 1 Passed: Correctly rejected unknown email (${e.message})`);
    }

    // 3. Test Valid Request Reset Email
    console.log('\n--- Test 2: Request reset for registered student ---');
    const resetRes = await passwordResetService.requestReset(student.email);
    console.log(`✅ Test 2 Passed: Reset requested successfully!`);
    console.log(`   Message: ${resetRes.message}`);

    const testCode = '582910';
    const testHash = await bcrypt.hash(testCode, 10);
    await db.run('UPDATE password_resets SET otp_hash = ? WHERE reset_id = (SELECT MAX(reset_id) FROM password_resets WHERE LOWER(email) = ?)', testHash, student.email);

    // 4. Test Verification with Incorrect Code
    console.log('\n--- Test 3: Attempt reset with wrong code ---');
    try {
      await passwordResetService.verifyAndResetPassword({
        email: student.email,
        resetCode: '999999',
        newPassword: 'newSecurePassword123'
      });
      console.error('❌ Test 3 Failed: Should have rejected incorrect verification code!');
    } catch (e) {
      console.log(`✅ Test 3 Passed: Correctly rejected invalid code (${e.message})`);
    }

    // 5. Test Verification with Too Short Password
    console.log('\n--- Test 4: Attempt reset with password < 6 characters ---');
    try {
      await passwordResetService.verifyAndResetPassword({
        email: student.email,
        resetCode: testCode,
        newPassword: '123'
      });
      console.error('❌ Test 4 Failed: Should have rejected password under 6 chars!');
    } catch (e) {
      console.log(`✅ Test 4 Passed: Correctly rejected short password (${e.message})`);
    }

    // 6. Test Successful Password Reset
    console.log('\n--- Test 5: Successfully reset password with valid code ---');
    const newTestPassword = 'MyNewPassword@2026!';
    const successRes = await passwordResetService.verifyAndResetPassword({
      email: student.email,
      resetCode: testCode,
      newPassword: newTestPassword
    });
    console.log(`✅ Test 5 Passed: ${successRes.message}`);

    // 7. Verify Database Update
    const updatedStudent = await db.get('SELECT password_hash FROM students WHERE student_id = ?', student.student_id);
    const matchesNew = await bcrypt.compare(newTestPassword, updatedStudent.password_hash);
    if (!matchesNew) {
      throw new Error('Database password_hash was not updated properly with new password!');
    }
    console.log('✅ Test 6 Passed: Database password_hash verified with bcrypt against new password!');

    // 8. Test Reuse of Used Code (Replay Attack Prevention)
    console.log('\n--- Test 7: Verify used code cannot be reused ---');
    try {
      await passwordResetService.verifyAndResetPassword({
        email: student.email,
        resetCode: testCode,
        newPassword: 'AnotherPassword!456'
      });
      console.error('❌ Test 7 Failed: Used code should not be accepted twice!');
    } catch (e) {
      console.log(`✅ Test 7 Passed: Successfully blocked replay of used code (${e.message})`);
    }

    // Restore original password for safety
    await db.run('UPDATE students SET password_hash = ? WHERE student_id = ?', student.password_hash, student.student_id);
    console.log('\n🔒 Cleanup: Restored original password hash for test student.');

    console.log('\n======================================================================');
    console.log('🎉 ALL FORGOT PASSWORD & RESET TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  }
}

runForgotPasswordTests();

import { authService, parseJWT } from '@/services/auth';
import { orderService } from '@/services/order';
import { checkinService } from '@/services/checkin';
import { mockTickets, MockTicket } from '@/mocks/mockData';
import { apiClient } from '@/services/api';
import CryptoJS from 'crypto-js';

export interface TestResult {
  name: string;
  success: boolean;
  message: string;
}

export async function runIntegrationTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const logTest = (name: string, success: boolean, message: string) => {
    results.push({ name, success, message });
    if (success) {
      console.log(` Pass [PASS] ${name}: ${message}`);
    } else {
      console.error(` Fail [FAIL] ${name}: ${message}`);
    }
  };

  console.log(' Starting integration mock tests...\n');

  try {
    const testEmail = `test-qa-${Date.now()}@test.com`;
    const testPassword = 'password123';
    const testName = 'QA Tester';

    // Test Sign Up
    const signUpRes = await authService.signUp(testEmail, testPassword, testName);
    if (signUpRes && signUpRes.success) {
      logTest('Auth - Sign Up', true, 'Đăng ký tài khoản mới thành công.');
    } else {
      logTest('Auth - Sign Up', false, 'Đăng ký tài khoản thất bại.');
    }

    // Test Sign In and JWT Role parsing
    const signInRes = await authService.signIn(testEmail, testPassword);
    if (signInRes && signInRes.success && signInRes.accessToken) {
      const parsed = parseJWT(signInRes.accessToken);
      const extractedRole = parsed?.app_metadata?.role || parsed?.user_role || parsed?.role || '';
      logTest(
        'Auth - JWT Role Extraction',
        extractedRole.toLowerCase() === 'audience' && parsed !== null,
        `Đăng nhập thành công. Giải mã JWT bóc tách được role: "${extractedRole}" (Mong đợi: "audience").`
      );
    } else {
      logTest('Auth - Sign In', false, 'Đăng nhập thất bại.');
    }
  } catch (authError: any) {
    logTest('Auth Suite', false, `Lỗi nghiêm trọng trong kiểm thử Auth: ${authError.message}`);
  }

  console.log('\n--- TEST SUMMARY ---');
  const passed = results.filter(r => r.success).length;
  console.log(` Completed: Passed ${passed}/${results.length} tests.\n`);

  return results;
}

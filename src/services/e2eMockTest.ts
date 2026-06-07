import { authService, parseJWT } from './auth';
import { orderService } from './order';
import { checkinService } from './checkin';
import { mockTickets, MockTicket } from '@/constants/mockData';
import { apiClient } from './api';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

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
      console.log(`🟢 [PASS] ${name}: ${message}`);
    } else {
      console.error(`🔴 [FAIL] ${name}: ${message}`);
    }
  };

  console.log('🏁 Starting E2E Integration Mock Tests...\n');

  // ==========================================
  // 1. KỊCH BẢN AUTH (PHASE 2)
  // ==========================================
  try {
    const testEmail = `test-qa-${Date.now()}@test.com`;
    const testPassword = 'password123';
    const testName = 'QA Tester';

    // Test 1.1: Sign Up
    const signUpRes = await authService.signUp(testEmail, testPassword, testName);
    if (signUpRes && signUpRes.success) {
      logTest('Auth - Sign Up', true, 'Đăng ký tài khoản mới thành công.');
    } else {
      logTest('Auth - Sign Up', false, 'Đăng ký tài khoản thất bại.');
    }

    // Test 1.2: Prevent Duplicate Email Registration
    try {
      const duplicateSignUpRes = await authService.signUp(testEmail, testPassword, testName);
      if (duplicateSignUpRes && !duplicateSignUpRes.success) {
        logTest('Auth - Block Duplicate Email', true, 'Đã chặn đăng ký trùng và báo lỗi: ' + duplicateSignUpRes.message);
      } else {
        logTest('Auth - Block Duplicate Email', false, 'Không chặn được đăng ký trùng email.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('đã được sử dụng')) {
        logTest('Auth - Block Duplicate Email', true, 'Chặn đăng ký trùng thành công: ' + errorMsg);
      } else {
        logTest('Auth - Block Duplicate Email', false, 'Lỗi không xác định khi chặn trùng: ' + errorMsg);
      }
    }

    // Test 1.3: Sign In and JWT Role parsing
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

  // ==========================================
  // 2. KỊCH BẢN ĐẶT VÉ & PHÒNG NGỰ THANH TOÁN (PHASE 3, 4, 8)
  // ==========================================
  const originalGet = apiClient.get;
  const originalPost = apiClient.post;
  
  try {
    const mockOrderId = `test-ord-uuid-${Date.now()}`;
    const mockPaymentId = `test-pay-uuid-${Date.now()}`;

    // Force non-mock path for Defensive Polling integration test
    orderService.setMockOverride(false);

    // Test 2.1: Defensive Polling Background Scraping
    // Mock apiClient to simulate a server that DOES NOT return payment_id in POST /orders,
    // and returns order list with payment_id in GET /orders.
    apiClient.post = async (url: string, data?: any, config?: any): Promise<any> => {
      if (url.includes('/orders')) {
        return {
          status: 201,
          data: {
            success: true,
            message: 'Order created without payment_id in initial response.',
            data: {
              order_id: mockOrderId,
              total_price: 3500000,
              payment_deadline: new Date(Date.now() + 600000).toISOString(),
            }
          }
        };
      }
      return originalPost.call(apiClient, url, data, config);
    };

    apiClient.get = async (url: string, config?: any): Promise<any> => {
      // Background list orders scrap request
      if (url === '/orders') {
        return {
          status: 200,
          data: {
            success: true,
            data: [
              {
                id: mockOrderId,
                order_id: mockOrderId,
                status: 'pending',
                payment_id: mockPaymentId,
                paymentId: mockPaymentId,
                payment: {
                  id: mockPaymentId,
                  payment_id: mockPaymentId
                }
              }
            ]
          }
        };
      }
      // Main polling payments request
      if (url === `/payments/${mockPaymentId}`) {
        return {
          status: 200,
          data: {
            success: true,
            data: {
              payment_id: mockPaymentId,
              order_id: mockOrderId,
              status: 'PENDING',
              amount: 3500000,
              payment_ref: 'MOCK-TXN-PENDING',
              processed_at: null
            }
          }
        };
      }
      return originalGet.call(apiClient, url, config);
    };

    // Trigger order creation - should fire background orders list call to scrape payment ID
    await orderService.createOrder(
      [{ concertId: 'concert-1', ticketTypeId: 'c1-svip', quantity: 1 }],
      'idempotency-test-key'
    );

    // Wait a brief moment for the background async scrap task to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Call getPaymentStatus using the orderId. It should resolve mockPaymentId and fetch details.
    const paymentStatus = await orderService.getPaymentStatus(mockOrderId);
    
    // Restore original mock override value before Test 2.2
    orderService.setMockOverride(null);

    logTest(
      'Defensive Polling - Background Payment ID Resolution',
      paymentStatus.paymentId === mockPaymentId,
      `Bóc tách ngầm thành công payment_id="${paymentStatus.paymentId}" từ GET /orders thay vì order_id.`
    );

    // Test 2.2: Mock Mode Auto-Success after 3 polls
    // Restore client to allow local mock mode logic in orderService
    apiClient.get = originalGet;
    apiClient.post = originalPost;

    const mockOrderForCount = `test-mock-count-id-${Date.now()}`;
    // Simulate 3 calls to getPaymentStatus (Mock Mode active is forced by process.env.EXPO_PUBLIC_USE_MOCK === 'true')
    // We can simulate it locally in the service. Let's make 3 sequential calls.
    const runMockCountTest = async () => {
      console.log('   Starting 3-step mock polling sequence...');
      const poll1 = await orderService.getPaymentStatus(mockOrderForCount);
      console.log(`   Poll #1 status: ${poll1.status} (delay 1-2s simulated)`);
      
      const poll2 = await orderService.getPaymentStatus(mockOrderForCount);
      console.log(`   Poll #2 status: ${poll2.status} (delay 1-2s simulated)`);
      
      const poll3 = await orderService.getPaymentStatus(mockOrderForCount);
      console.log(`   Poll #3 status: ${poll3.status} (delay 1-2s simulated)`);

      const pass = poll1.status === 'PENDING' && poll2.status === 'PENDING' && poll3.status === 'SUCCESS';
      logTest(
        'Mock Polling - 3-step Auto-Success Sequence',
        pass,
        'Trạng thái chuyển từ PENDING (lần 1, 2) sang SUCCESS ở lần thứ 3 thành công.'
      );
    };

    await runMockCountTest();

  } catch (orderError: any) {
    // Restore in case of failure
    apiClient.get = originalGet;
    apiClient.post = originalPost;
    orderService.setMockOverride(null);
    logTest('Order & Payment Polling Suite', false, `Lỗi kiểm thử Order/Payment: ${orderError.message}`);
  }

  // ==========================================
  // 3. KỊCH BẢN QUÉT QR SOÁT VÉ (PHASE 5, 6)
  // ==========================================
  try {
    const secretKey = process.env.EXPO_PUBLIC_QR_SECRET_KEY || 'ticketbox_secure_qr_secret_key_2026';
    const testRawQR = 'qa-raw-qr-token-99999';

    // Test 3.1: Client Decrypt AES-256 in memory
    const cipherText = CryptoJS.AES.encrypt(testRawQR, secretKey).toString();
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    logTest(
      'QR Security - Decryption',
      decrypted === testRawQR,
      `Giải mã thành công chuỗi AES-256 về raw QR token: "${decrypted}".`
    );

    // Test 3.2: Local SHA-256 Hashing compatibility
    const localJS_SHA256 = CryptoJS.SHA256(testRawQR).toString(CryptoJS.enc.Hex);
    const nativeExpo_SHA256 = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      testRawQR
    );

    logTest(
      'QR Security - SHA-256 Local Hashing',
      localJS_SHA256 === nativeExpo_SHA256,
      `Mã hash SHA-256 cục bộ khớp giữa thư viện JS và Module Native: "${nativeExpo_SHA256}".`
    );

    // Test 3.3: Verify QR check-in status (4 scenarios)
    const concertId = 'concert-test-qa';
    const ticketId = 'tkt-test-qa-status-1';
    
    // Clear and push custom QA tickets into mockTickets database
    const initialMockTickets = [...mockTickets];
    
    const validTicket: MockTicket = {
      ticket_id: ticketId,
      concert_id: concertId,
      concert_title: 'QA Concert Concert',
      event_date: new Date().toISOString(),
      venue: 'Hanoi Stadium',
      ticket_type: 'SVIP Zone',
      holder_name: 'QA Holder',
      qr_raw: testRawQR,
      qr_aes256: cipherText,
      used: false,
    };
    
    mockTickets.push(validTicket);

    // Scenario A: SUCCESS
    const hashVal = CryptoJS.SHA256(testRawQR).toString(CryptoJS.enc.Hex);
    const resSuccess = await checkinService.verifyQR(hashVal, concertId);
    logTest(
      'Check-in Verify - SUCCESS Scenario',
      resSuccess.success && resSuccess.result === 'SUCCESS',
      'Xác thực vé hợp lệ thành công.'
    );

    // Scenario B: ALREADY_USED
    const resAlreadyUsed = await checkinService.verifyQR(hashVal, concertId);
    logTest(
      'Check-in Verify - ALREADY_USED Scenario',
      !resAlreadyUsed.success && resAlreadyUsed.result === 'ALREADY_USED',
      `Vé báo đã sử dụng thành công (Quét lúc: ${resAlreadyUsed.usedAt}, Nhân viên soát vé: ${resAlreadyUsed.usedByStaff}).`
    );

    // Scenario C: WRONG_CONCERT
    const wrongRawQR = 'qa-wrong-concert-raw-token';
    const wrongCipher = CryptoJS.AES.encrypt(wrongRawQR, secretKey).toString();
    const wrongHash = CryptoJS.SHA256(wrongRawQR).toString(CryptoJS.enc.Hex);
    
    mockTickets.push({
      ticket_id: 'tkt-wrong-concert',
      concert_id: 'concert-other-different-id',
      concert_title: 'Other Concert',
      event_date: new Date().toISOString(),
      venue: 'Sai Gon Hall',
      ticket_type: 'VIP Zone',
      holder_name: 'QA Holder 2',
      qr_raw: wrongRawQR,
      qr_aes256: wrongCipher,
      used: false,
    });

    const resWrongConcert = await checkinService.verifyQR(wrongHash, concertId);
    logTest(
      'Check-in Verify - WRONG_CONCERT Scenario',
      !resWrongConcert.success && resWrongConcert.result === 'WRONG_CONCERT',
      'Phát hiện vé thuộc sự kiện khác thành công.'
    );

    // Scenario D: INVALID
    const fakeHash = CryptoJS.SHA256('fake-raw-qr-token').toString(CryptoJS.enc.Hex);
    const resInvalid = await checkinService.verifyQR(fakeHash, concertId);
    logTest(
      'Check-in Verify - INVALID Scenario',
      !resInvalid.success && resInvalid.result === 'INVALID',
      'Nhận diện vé giả mạo/không tồn tại thành công.'
    );

    // Restore database state
    mockTickets.length = 0;
    initialMockTickets.forEach(t => mockTickets.push(t));

  } catch (checkinError: any) {
    logTest('Check-in Verify Suite', false, `Lỗi kiểm thử Checkin: ${checkinError.message}`);
  }

  console.log('\n--- E2E TEST SUMMARY ---');
  const passed = results.filter(r => r.success).length;
  console.log(`📊 Completed: Passed ${passed}/${results.length} tests.\n`);

  return results;
}

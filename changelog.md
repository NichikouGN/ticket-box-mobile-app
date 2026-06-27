# Changelog: TicketBox Mobile App

Tài liệu này ghi nhận toàn bộ lịch sử cập nhật và nâng cấp tính năng của ứng dụng di động TicketBox Mobile App.

---

### v0.8.1: Stripe SSE, Deep Linking & ED25519 Security (2026-06-27)

#### Bổ sung mới
- Triển khai thành công cơ chế Deep Linking nhận kết quả từ cổng thanh toán Stripe:
  - Tích hợp `WebBrowser.openAuthSessionAsync` đóng cửa sổ tự động khi chuyển hướng về scheme `ticketboxmobileapp://payment-result`.
  - Đăng ký `Linking` listener toàn cục phòng thủ trong màn hình thanh toán.
- Thiết lập hoàn chỉnh quy trình lắng nghe sự kiện Server-Sent Events (SSE) thời gian thực thông qua `subscribeOrderSSE` duy trì Spinner cho tới khi trạng thái đơn đổi sang `COMPLETED`.
- Bổ sung xác thực chữ ký số offline phía Client sử dụng khoá công khai ED25519 tải trực tiếp từ `GET /checkin/public-key`.
- Tách biệt hoàn toàn thư mục Mock Data, E2E Tests và mock handlers sang thư mục độc lập `src/mocks/` phục vụ build Production tối giản.

#### Thay đổi & Sửa đổi
- Chuyển đổi mã QR từ cơ chế mã hóa AES-256 cũ sang hiển thị nguyên bản JSON đối tượng `{ ticket, signature }` đúng chuẩn ký số bất đối xứng của Backend.
- Điều chỉnh luồng gọi API danh sách vé `GET /tickets` và chi tiết vé `/tickets/:id` để hiển thị tương thích các UUID thô từ cơ sở dữ liệu.
- Xóa bỏ hoàn toàn đối tượng `ARTIST_BIOS` giả lập, thay thế bằng cơ chế tự động hiển thị `"Đang cập nhật thông tin nghệ sĩ."` nếu Backend API không phản hồi bio.
- Cập nhật định dạng tham số tạo đơn hàng `POST /orders` sử dụng cổng thanh toán mặc định `'stripe'`.

---

### v0.8.0: Staff Live Stats & E2E Integration Tests (2026-06-25)

#### Bổ sung mới
- Tích hợp bộ kiểm thử tích hợp tự động E2E Integration Tests tại tab Cá nhân (Profile Screen) hỗ trợ kiểm tra offline các chức năng cốt lõi.
- Xây dựng màn hình Thống kê soát vé thời gian thực (`(staff)/stats.tsx`) hỗ trợ hiển thị tổng số vé phát hành, vé đã check-in và biểu đồ trực quan.

---

### v0.7.0: Real-time User Wallet & Notification Center (2026-06-22)

#### Bổ sung mới
- Thiết kế ví vé cá nhân hiển thị danh sách vé đã mua và vé chưa sử dụng.
- Cấu hình layout và cấu trúc tích hợp trung tâm thông báo thời gian thực.

---

### v0.6.0: Ticket Booking Flow & Countdown Timers (2026-06-20)

#### Bổ sung mới
- Thiết lập màn hình đặt vé và giao diện đặt giữ chỗ tạm thời trong vòng 10 phút.
- Hỗ trợ gửi `Idempotency-Key` (UUID) khi tạo đơn hàng nhằm phòng tránh gửi trùng lặp.
- Thiết lập kịch bản Mock Payment Gateway hỗ trợ phát triển offline.

---

### v0.5.0: Concert Discovery & Seat Map Integration (2026-06-18)

#### Bổ sung mới
- Phát triển màn hình Danh sách sự kiện hỗ trợ phân trang, tìm kiếm và bộ lọc nhanh.
- Thiết kế màn hình chi tiết Concert tích hợp sơ đồ ghế ngồi SVG và các phân khu vé động.

---

### v0.1.0: Initial Release & Navigation Core (2026-06-05)

#### Bổ sung mới
- Khởi tạo khung dự án React Native Expo.
- Thiết lập cơ chế điều hướng phân cấp Expo Router (`(auth)`, `(user)`, `(staff)`).
- Tích hợp cơ chế lưu trữ bảo mật Token JWT qua `expo-secure-store`.

# Changelog: TicketBox Mobile App

Tài liệu này ghi nhận toàn bộ lịch sử cập nhật, nâng cấp tính năng của ứng dụng di động TicketBox Mobile App và định hướng các mục tiêu phát triển tiếp theo.

---

## Các công việc tiếp theo (Next Steps)

### 1. Phối hợp đồng bộ phía Backend
- **Gộp URL phản hồi của Stripe (Payment Service):**
  - Đợi backend gộp `success_url` và `cancel_url` của Stripe thành một đường dẫn duy nhất (ví dụ: `ticketboxmobileapp://payment-result`). Khi đó, phía Mobile App đã sẵn sàng tương thích (nhờ cơ chế bắt scheme-only `ticketboxmobileapp://`) và không cần thay đổi thêm mã nguồn nào.
- **Bổ sung liên kết dữ liệu tiểu sử nghệ sĩ (Concert Service):**
  - Hối thúc backend thực hiện left-join bảng `artists` để trả về trường `verified_bio` hoặc `bio` trong dữ liệu chi tiết concert của API `GET /concerts/:id` (hiện tại mobile đang hiển thị thông báo fallback).

### 2. Thực hiện kiểm thử tích hợp thực tế (E2E Integration Testing)
- **Kiểm thử trên thiết bị di động LAN:**
  - Cập nhật biến môi trường `EXPO_PUBLIC_API_URL` trong tệp `.env` trỏ về IP mạng LAN của máy tính chạy backend.
  - Tiến hành chạy toàn bộ luồng mua vé thực tế từ thiết bị di động kết nối mạng LAN với backend v0.6.1.
- **Kiểm thử soát vé tại cổng:**
  - Sử dụng camera của hai thiết bị di động thật để kiểm tra luồng quét mã QR ED25519 offline & online.

---

## Lịch sử phiên bản (Version History)

### v0.8.3: Khởi Tạo VIP Check-in & Phát Hiện Blocker API (2026-07-05)

#### Bổ sung mới
- **Cấu trúc Dữ liệu VIP Check-in (`src/types/vip.ts`):**
  - Định nghĩa kiểu dữ liệu `VipGuest`, `VipCheckInResponse`, và `VipListResponse` khớp với mô hình bảng dữ liệu `vip_guests` trong Backend v0.7.0.
- **Dịch vụ VIP Check-in Stub (`src/services/vip.ts`):**
  - Triển khai phương thức `vipService.checkInVip(concertId, vipGuestId)` gửi PATCH qua API Gateway để thực hiện check-in trực tuyến cho khách VIP.
- **Báo cáo Blocker Backend (`report.txt`):**
  - Bổ sung phát hiện Blocker: API thiếu route GET lấy danh sách VIP cho `STAFF` (chỉ có quyền `ORGANIZER`), ngăn cản việc xây dựng màn hình tìm kiếm.

---

### v0.8.2: Tích Hợp Luồng SSE 2 Giai Đoạn & Tránh Chặn WebBrowser (2026-06-28)

#### Bổ sung mới
- **Luồng SSE 2 Giai đoạn mới (Backend v0.6.1):**
  - Tách biệt hoàn toàn luồng kết nối SSE thành 2 giai đoạn độc lập:
    - Giai đoạn 1: Lắng nghe `GET /api/v1/orders/:orderId/stream/payment-url` để nhận `paymentUrl` (kết nối tự đóng sau khi gửi).
    - Giai đoạn 2: Lắng nghe `GET /api/v1/orders/:orderId/stream/order-confirm` để nhận trạng thái cuối (`COMPLETED`, `FAILED`, `EXPIRED`).
  - Đảm bảo thứ tự gọi nghiêm ngặt: Thiết lập kết nối `/stream/order-confirm` chạy nền **trước** khi người dùng kích hoạt mở cổng thanh toán nhằm tránh hiện tượng race condition khi webhook Stripe phản hồi quá nhanh.
- **Xử lý Timeout 2 Giai đoạn độc lập:**
  - **Timeout Giai đoạn 1 (30 giây)**: Nếu quá thời gian khởi tạo cổng Stripe, hiển thị thông báo lỗi cứng: *"Không thể khởi tạo thanh toán. Vui lòng thử lại."* kèm nút **"Thử lại"** cho phép kết nối lại.
  - **Timeout Giai đoạn 2 (3 phút)**: Nếu quá thời gian xử lý thanh toán, hiển thị thông báo mềm: *"Giao dịch đang xử lý lâu hơn dự kiến. Vé sẽ xuất hiện trong Ví vé khi hoàn tất."* và chuyển hướng an toàn về trang chủ.
- **Chuyển tiếp tổng giá vé qua Route Params:**
  - Cập nhật màn hình `booking/[id].tsx` truyền thêm `totalPrice` sang màn hình thanh toán qua route params, giúp hiển thị đúng số tiền cần trả cho người dùng.

#### Thay đổi & Sửa đổi
- **Yêu cầu tương tác người dùng (User Gesture) cho WebBrowser:**
  - Loại bỏ hoàn toàn cơ chế tự động mở trình duyệt khi nhận được `paymentUrl` (phòng ngừa chính sách OS chặn mở cửa sổ tự động không có tương tác).
  - Spinner khởi tạo sẽ biến mất sau khi nhận được URL thanh toán, hiển thị nút bấm rõ ràng **"Thanh toán qua Stripe ({totalPrice} VNĐ)"** để người dùng chủ động kích hoạt.
- **Cấu hình returnUrl tối giản:**
  - Thay đổi returnUrl trong `WebBrowser.openAuthSessionAsync` thành `ticketboxmobileapp://` (chỉ chứa scheme) để tự động nhận dạng và đóng trình duyệt cho cả 2 đường dẫn redirect (`payment-success` và `payment-cancelled`).
- **Loại bỏ hoàn toàn endpoint cũ:**
  - Xóa bỏ tất cả các tham chiếu tới endpoint `/stream` đơn lẻ cũ trong dịch vụ `orderService` và màn hình thanh toán.

---

### v0.8.1: Stripe SSE, Deep Linking & ED25519 Security (2026-06-27)

#### Bổ sung mới
- **Tích hợp Deep Linking cho luồng thanh toán:**
  - Sử dụng `WebBrowser.openAuthSessionAsync` mở liên kết thanh toán Stripe và chỉ định URL nhận lại quyền kiểm soát là `ticketboxmobileapp://payment-result`. Trình duyệt tích hợp sẽ tự động đóng lại khi phát hiện redirect url khớp scheme này.
  - Đăng ký bộ lắng nghe sự kiện deep link `Linking.addEventListener('url', ...)` phòng thủ tại màn hình `payment/[orderId].tsx` nhằm ghi nhận trạng thái quay trở lại app.
- **Triển khai Server-Sent Events (SSE) đồng bộ:**
  - Viết helper `subscribeOrderSSE` tại `src/services/order.ts` sử dụng `XMLHttpRequest` để phân tách thủ công các gói dữ liệu chunked từ stream kết nối.
  - Thiết lập giao diện Spinner chặn người dùng trên màn hình thanh toán cho tới khi SSE thông báo trạng thái `COMPLETED`.
- **Cơ chế soát vé bằng chữ ký số ED25519:**
  - Staff App tự động tải khoá công khai PEM qua `GET /checkin/public-key` khi khởi chạy và thực hiện kiểm tra tính toàn vẹn của chữ ký số offline trên bộ nhớ thiết bị.
  - Gửi yêu cầu xác thực trực tuyến qua `POST /api/v1/checkin/verify` sử dụng 4 tham số UUID thô nhằm phòng tránh gian lận.

#### Thay đổi & Sửa đổi
- **Chuyển đổi định dạng QR Code:** Loại bỏ hoàn toàn cơ chế giải mã AES-256 nội bộ. Chuyển đổi mã QR chứa nguyên văn chuỗi JSON đại diện cho đối tượng `{ ticket: { ticketId, userId, concertId, ticketTypeId }, signature }`.
- **Loại bỏ dữ liệu giả lập nghệ sĩ:** Xóa hoàn toàn đối tượng `ARTIST_BIOS` cứng tại Client. Cập nhật giao diện chi tiết Concert để hiển thị thông báo `"Đang cập nhật thông tin nghệ sĩ."` nếu Backend không trả dữ liệu bio.
- **Tách biệt module thử nghiệm:** Gom toàn bộ mock data và các kịch bản test vào thư mục độc lập `src/mocks/` để hệ thống tự động loại bỏ khi đóng gói Production.

---

### v0.8.0: Staff Live Stats & E2E Integration Tests (2026-06-25)

#### Bổ sung mới
- **Trình diễn thống kê soát vé trực quan:**
  - Xây dựng màn hình `(staff)/stats.tsx` hiển thị tiến độ check-in thời gian thực của sự kiện bao gồm: Tổng lượng phát hành, số vé đã quét và tỷ lệ phần trăm check-in tại cổng.
- **Hệ thống E2E Integration Tests:**
  - Thiết kế nút bấm kích hoạt bộ test tự động tại màn hình Tab Cá nhân (Profile Screen) để chạy thử nghiệm các tiến trình đăng nhập, mã hóa và soát vé cục bộ.

---

### v0.7.0: Real-time User Wallet & Notification Center (2026-06-22)

#### Bổ sung mới
- **Giao diện ví vé người dùng (User Wallet):**
  - Xây dựng màn hình hiển thị danh sách vé đã sở hữu dưới dạng thẻ trực quan.
  - Thiết kế màn hình chi tiết vé hiển thị mã QR cỡ lớn kèm mã định danh vé.
- **Bộ nhận thông báo thời gian thực:**
  - Xây dựng cấu trúc layout cho Trung tâm thông báo và chuẩn bị kết nối SSE lắng nghe sự kiện nhắc nhở concert từ `notification-service`.

---

### v0.4.0: Ticket Management & Check-in Integration (2026-06-20)

#### Bổ sung mới
- **Tích hợp module Quét mã vạch (Camera Scanner):**
  - Cấu hình quyền truy cập và hiển thị giao diện Camera sử dụng thư viện `expo-camera`.
  - Triển khai thuật toán tính toán mã băm SHA-256 cục bộ từ dữ liệu mã QR thu được để chuẩn bị đối chiếu.
- **Định nghĩa mô hình dữ liệu Vé:**
  - Xây dựng tệp định nghĩa kiểu dữ liệu `src/types/ticket.ts` khớp với cấu trúc bảng `tickets` của Backend (chỉ bao gồm các UUID định danh và trạng thái `UNUSED`/`USED`).

---

### v0.3.0: Order Creation & Payment Processing (2026-06-18)

#### Bổ sung mới
- **Khởi tạo và đặt giữ chỗ tạm thời (Ticket Reservation):**
  - Xây dựng dịch vụ `orderService.createOrder` cho phép gửi request khoá giữ chỗ trong vòng 10 phút.
  - Hỗ trợ cơ chế gửi `Idempotency-Key` dạng UUID trong HTTP Header để phòng tránh lỗi đặt vé trùng lặp khi mất mạng.
- **Màn hình đếm ngược giữ vé:**
  - Thiết kế đồng hồ đếm ngược thời gian thực trên màn hình thanh toán, tự động huỷ giao dịch và trả vé về hệ thống khi hết hạn.

---

### v0.2.0: Concert Discovery & Seat Map Integration (2026-06-06)

#### Bổ sung mới
- **Giao diện danh sách sự kiện (Concert Catalog):**
  - Thiết kế danh sách hiển thị các Concert đang ở trạng thái `PUBLISHED` kèm tính năng tìm kiếm và phân trang động.
- **Tích hợp sơ đồ ghế ngồi SVG:**
  - Nhập và hiển thị sơ đồ phân khu ghế ngồi tương tác SVG, hỗ trợ chọn phân khu để xem số lượng ghế trống và bảng giá chi tiết.

---

### v0.1.0: Initial Release & Navigation Core (2026-06-05)

#### Bổ sung mới
- **Kiến trúc điều hướng cốt lõi (Navigation Layout):**
  - Khởi tạo dự án và cấu hình Expo Router phân cấp các luồng màn hình theo vai trò người dùng: Khách vãng lai (`(auth)`), Khách hàng (`(user)`), và Nhân viên soát vé (`(staff)`).
- **Quản lý phiên làm việc bảo mật:**
  - Tích hợp `expo-secure-store` để lưu trữ token JWT (`accessToken`, `refreshToken`) trên bộ nhớ mã hóa của thiết bị di động.
  - Xây dựng Axios Client tự động đính kèm Token trong Header và bắt lỗi 401 để tự động gọi API Refresh Token.

# Actors and Clients - Phân Phối Người Dùng & Ứng Dụng

Tài liệu này xác định mối quan hệ giữa các nhóm người dùng (Actors), các nền tảng ứng dụng (Clients) và phân công phát triển của các đội ngũ lập trình (Teams).

---

## 1. Bản đồ Phân vai (Actor × Platform) & Tính năng Cốt lõi

| Nhóm người dùng (Actor) | Nền tảng (Client Platform) | Tính năng chính sử dụng (Core Features) |
| :--- | :--- | :--- |
| **Customer**<br>(Khách hàng / Audience) | **Mobile App** (React Native)<br>và **Web App** (React) | - Đăng ký, đăng nhập tài khoản và cập nhật thông tin cá nhân.<br>- Tìm kiếm, xem danh sách và chi tiết các Concert.<br>- Chọn hạng vé, thực hiện đặt vé (booking) bảo mật cao.<br>- Tiến hành thanh toán qua cổng Stripe/Momo (WebBrowser).<br>- Lưu trữ và quản lý vé trong Ví vé cá nhân (chỉ trên Mobile).<br>- Hiển thị mã QR bảo mật mã hóa AES-256 để soát vé.<br>- Nhận thông báo thời gian thực khi có cập nhật vé/đơn hàng. |
| **Staff**<br>(Nhân sự soát vé) | **Mobile App** (React Native) | - Đăng nhập tài khoản với quyền Staff được chỉ định.<br>- Sử dụng Camera để quét mã QR vé của khách hàng trực tuyến/ngoại tuyến.<br>- Xác thực chữ ký số mã QR dựa trên Public Key từ máy chủ.<br>- Đánh dấu vé đã qua cổng soát vé.<br>- Xem biểu đồ thống kê tỉ lệ check-in thực tế của sự kiện theo thời gian thực. |
| **Organizer**<br>(Ban tổ chức sự kiện) | **Web App** (React) | - Quản lý danh sách Concert (tạo mới, cập nhật, công bố, huỷ bỏ).<br>- Định cấu hình các loại vé, mức giá và sơ đồ ghế ngồi.<br>- Tải lên tài liệu PDF để tự động tạo Bio mô tả nghệ sĩ thông qua AI (Gemini).<br>- Nhập danh sách khách VIP từ tệp CSV để tự động phát hành vé mời.<br>- Phân quyền vai trò người dùng trong hệ thống (RBAC).<br>- Theo dõi báo cáo doanh thu, tồn kho và thống kê soát vé tổng quan. |

---

## 2. Phân công Phát triển Hệ thống (Team Allocation)

Kiến trúc phân rã của hệ thống TicketBox được phân bổ trách nhiệm phát triển cho 3 đội ngũ chuyên biệt như sau:

### 2.1 Mobile Team (Staff + Customer)
*   **Phạm vi:** Phát triển ứng dụng di động đa nền tảng (iOS & Android) bằng React Native Expo.
*   **Trách nhiệm chính:**
    *   **Phía Customer:** Xây dựng giao diện Ví vé (My Tickets), tích hợp cơ chế giải mã AES-256 in-memory để hiển thị mã QR, nhận thông báo thời gian thực (SSE), và tích hợp WebBrowser mở cổng thanh toán.
    *   **Phía Staff:** Tích hợp camera (`expo-camera`), xây dựng module quét mã QR và xác thực chữ ký số ngoại tuyến/trực tuyến, tích hợp giao diện biểu đồ thống kê soát vé.

### 2.2 Web Team (Customer + Organizer)
*   **Phạm vi:** Phát triển ứng dụng Web phản hồi nhanh bằng ReactJS, TypeScript và TailwindCSS.
*   **Trách nhiệm chính:**
    *   **Phía Customer:** Thiết kế giao diện duyệt Concert, hiển thị sơ đồ ghế ngồi, và luồng đặt vé thân thiện.
    *   **Phía Organizer:** Xây dựng cổng quản trị (Dashboard) cho ban tổ chức bao gồm các tính năng tải tài liệu PDF sinh AI Bio nghệ sĩ, upload tệp CSV khách VIP, phân quyền RBAC và hiển thị biểu đồ doanh thu.

### 2.3 Backend Team (Toàn bộ hệ thống)
*   **Phạm vi:** Thiết kế, xây dựng và vận hành toàn bộ hạ tầng Microservices, Data Layer và Message Broker.
*   **Trách nhiệm chính:**
    *   Phát triển và bảo mật API Gateway (Nginx).
    *   Xây dựng 6 microservices nghiệp vụ độc lập, quản lý kết nối an toàn liên dịch vụ (Internal API Key).
    *   Cấu hình cơ sở dữ liệu PostgreSQL và hạ tầng Caching Redis chịu tải.
    *   Vận hành và điều phối BullMQ xử lý hàng đợi bất đồng bộ (tạo vé, rollback tồn kho, gửi mail).

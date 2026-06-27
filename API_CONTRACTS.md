# API Contracts - Hợp Đồng API Toàn Hệ Thống

Tài liệu này tổng hợp toàn bộ hợp đồng giao tiếp (API Contracts) bao gồm giao tiếp từ Client tới Backend (qua API Gateway) và giao tiếp nội bộ giữa các microservices (Service-to-Service).

---

## 1. Giao tiếp từ Client tới Backend (Client-to-Backend Contracts)

Tất cả các API đối ngoại đều đi qua cổng API Gateway (Port 3000) tại tiền tố `/api/v1/`. Các API yêu cầu quyền hạn được xác thực thông qua header `Authorization: Bearer <JWT_TOKEN>`.

### 1.1 Hợp đồng API Xác thực & Người dùng (User Service)
| Actor | Client | HTTP Method & Gateway Path | Ý nghĩa nghiệp vụ | Yêu cầu xác thực |
| :--- | :---: | :--- | :--- | :---: |
| **Customer** | Web/Mobile | `POST /api/v1/auth/sign-up` | Đăng ký tài khoản khách hàng mới | Public |
| **All Actors** | Web/Mobile | `POST /api/v1/auth/sign-in` | Đăng nhập hệ thống, nhận Access/Refresh Token | Public |
| **All Actors** | Web/Mobile | `POST /api/v1/auth/refresh-token` | Làm mới Access Token khi hết hạn | Public |
| **All Actors** | Web/Mobile | `GET /api/v1/users/profile` | Lấy thông tin cá nhân của tài khoản hiện tại | JWT Bearer |
| **Organizer** | Web | `GET /api/v1/organizer/users/` | Xem danh sách toàn bộ người dùng hệ thống | JWT + `ORGANIZER` |
| **Organizer** | Web | `PATCH /api/v1/organizer/users/:targetId/role` | Nâng quyền/hạ quyền vai trò của người dùng | JWT + `ORGANIZER` |
| **Organizer** | Web | `PATCH /api/v1/organizer/users/:targetId/status` | Khoá hoặc kích hoạt lại tài khoản người dùng | JWT + `ORGANIZER` |

### 1.2 Hợp đồng API Sự kiện & Nghệ sĩ (Concert Service)
| Actor | Client | HTTP Method & Gateway Path | Ý nghĩa nghiệp vụ | Yêu cầu xác thực |
| :--- | :---: | :--- | :--- | :---: |
| **Customer** | Web/Mobile | `GET /api/v1/concerts/` | Xem danh sách concert đang mở bán (phân trang) | Public |
| **Customer** | Web/Mobile | `GET /api/v1/concerts/:id` | Xem chi tiết thông tin concert | Public |
| **Customer** | Web/Mobile | `GET /api/v1/concerts/:id/tickets` | Xem sơ đồ ghế SVG và thông tin các hạng vé | Public |
| **Customer** | Web/Mobile | `GET /api/v1/concerts/:id/stock` | Truy vấn số lượng vé còn trống thực tế | Public |
| **Organizer** | Web | `POST /api/v1/organizer/concerts/concerts` | Tạo mới concert ở trạng thái nháp | JWT + `ORGANIZER` |
| **Organizer** | Web | `PATCH /api/v1/organizer/concerts/concerts/:id` | Cập nhật thông tin concert | JWT + `ORGANIZER` |
| **Organizer** | Web | `PATCH /api/v1/organizer/concerts/concerts/:id/publish`| Công bố concert ra công chúng | JWT + `ORGANIZER` |
| **Organizer** | Web | `POST /api/v1/organizer/concerts/upload-pdf` | Tải lên tài liệu PDF để AI sinh Bio nghệ sĩ | JWT + `ORGANIZER` |
| **Organizer** | Web | `POST /api/v1/organizer/concerts/artists` | Tạo mới thông tin nghệ sĩ biểu diễn | JWT + `ORGANIZER` |

### 1.3 Hợp đồng API Đơn hàng & Vé (Order & Ticket Services)
| Actor | Client | HTTP Method & Gateway Path | Ý nghĩa nghiệp vụ | Yêu cầu xác thực |
| :--- | :---: | :--- | :--- | :---: |
| **Customer** | Web/Mobile | `POST /api/v1/orders` | Khởi tạo đơn hàng đặt vé (giữ chỗ tồn kho tức thì) | JWT Bearer |
| **Customer** | Mobile/Web | `GET /api/v1/orders/:orderId/stream` | Thiết lập luồng SSE nhận link và trạng thái đơn hàng | JWT Bearer |
| **Customer** | Mobile | `GET /api/v1/tickets` | Lấy danh sách vé đang sở hữu trong ví | JWT Bearer |
| **Customer** | Mobile | `GET /api/v1/tickets/tickets/:ticketId` | Lấy chi tiết vé & mã QR AES-256 giải mã in-memory | JWT Bearer |
| **Customer** | Mobile | `GET /api/v1/tickets/concerts/:concertId` | Lấy danh sách vé đã mua của một Concert cụ thể | JWT Bearer |
| **Staff** | Mobile | `GET /api/v1/checkin/publicKey` | Lấy khóa công khai để giải mã chữ ký số QR | JWT + `STAFF`/`ORG` |
| **Staff** | Mobile | `POST /api/v1/checkin/verify` | Soát vé (nhận SHA-256 của QR, băm và đánh dấu used) | JWT + `STAFF`/`ORG` |
| **Staff/Org** | Mobile/Web | `GET /api/v1/checkin/stats/:concertId` | Xem thống kê số liệu check-in thời gian thực | JWT + `STAFF`/`ORG` |

---

## 2. Giao tiếp nội bộ giữa các Services (Service-to-Service Contracts)

Các microservices giao tiếp trực tiếp với nhau thông qua mạng nội bộ bảo mật (mức độ ưu tiên cao, bypass Gateway) sử dụng REST API đồng bộ hoặc Message Broker/Redis Pub/Sub bất đồng bộ.

| Service gửi | Service nhận | Phương thức giao tiếp | Chi tiết Endpoint / Event Channel | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| **Order Service** | **Concert Service** | REST (Đồng bộ) | `POST /internal/concerts/:concertId/ticket-types` | Lấy thông tin giá tiền và tên hạng vé để tính tổng tiền đơn hàng |
| **Order Service** | **Concert Service** | REST (Đồng bộ) | `GET /internal/concerts/:concertId` | Lấy thông tin chi tiết concert phục vụ kiểm tra thông tin |
| **Order Service** | **Payment Service** | REST (Đồng bộ) | `POST /internal/payments` (Internal API Key) | Khởi tạo phiên thanh toán Stripe/Momo cho đơn hàng |
| **Order Service** | **Payment Service** | REST (Đồng bộ) | `GET /internal/payments/:paymentId` (Internal API Key) | Truy vấn trạng thái thanh toán hiện tại của giao dịch |
| **Payment Service** | **Order Service** | REST (Đồng bộ) | `PATCH /internal/orders/:orderId/payment-failed` | Báo sự cố thanh toán thất bại để giải phóng kho và huỷ đơn |
| **Payment Service** | **Order Service** | Event (Bất đồng bộ) | BullMQ Queue: `CLEANUP_EXPIRED_ORDER` (delay 15 mins) | Lập lịch tự động huỷ đơn hàng và rollback tồn kho nếu chưa trả tiền |
| **Order Service** | **Ticket Service** | Event (Bất đồng bộ) | BullMQ Event: `GENERATE_TICKETS` | Đẩy yêu cầu tạo vé mới kèm chữ ký số sau khi thanh toán thành công |
| **Order Service** | **Notification Service** | Event (Bất đồng bộ) | BullMQ Event: `NOTIFY_USER` | Đẩy thông tin yêu cầu gửi email xác nhận và thông báo in-app |
| **Ticket Service** | **Notification Service**| Event (Bất đồng bộ) | Redis Pub/Sub: `notification_updates` | Đẩy sự kiện thông báo vé phát hành thành công qua SSE tới client |
| **Order Service** | **Client** | SSE Stream | Redis Pub/Sub: `order_updates` | Đẩy liên kết thanh toán Stripe và trạng thái đơn hàng thời gian thực |

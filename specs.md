# **XV. Đặc tả hạ tầng hệ thống (System infrastructure)**

1. ## **API Gateway**

1. **Mô tả**  
   API Gateway (cổng `3000` ngoài Host machine) là điểm vào duy nhất (single entry point) của toàn bộ hệ thống TicketBox đối với client. API Gateway chịu trách nhiệm định tuyến (routing), giới hạn tốc độ (rate limiting) và xử lý CORS — giúp các service bên trong tránh được việc lặp lại các logic hạ tầng này.  
2. **Trách nhiệm**  
* **Xác thực JWT (Authentication):**  
  * API Gateway **không** trực tiếp thực hiện xác thực và giải mã chữ ký số JWT. Nó đóng vai trò làm Proxy trong suốt chuyển tiếp tiêu đề `Authorization: Bearer <token>` trực tiếp đến các microservice đích phía sau. 
  * Các microservice đích sẽ tự chịu trách nhiệm xác thực JWT qua lớp `authMiddleware` nội bộ của chính mình.
* **Rate Limiting (Token Bucket):**

Gateway áp dụng thuật toán Token Bucket (lưu trữ số dư token trong Redis) để giới hạn tốc độ request của các thiết bị. **Tất cả các bộ giới hạn đều khóa theo địa chỉ IP của Client (`req.ip`)**, không khóa theo User ID. Cấu hình thực tế như sau:

| Bộ giới hạn (Limiter) | Capacity (Dung lượng) | Refill Rate (Tốc độ nạp lại / giây) | Áp dụng cho Route |
| :---- | :---- | :---- | :---- |
| authLimiter | 5 | 0.1 (1 token mỗi 10 giây) | `/api/v1/auth/*` |
| userLimiter | 40 | 2 | `/api/v1/users/*` |
| concertLimiter | 40 | 2 | `/api/v1/concerts/*` |
| orderLimiter | 10 | 1 | `/api/v1/orders/*` |
| ticketLimiter | 200 | 25 | `/api/v1/tickets/*`, `/api/v1/checkin/*`, `/api/v1/staff/concerts/*` |
| organizerLimiter | 120 | 12 | `/api/v1/organizer/*` |
| notificationLimiter | 60 | 5 | `/api/v1/notifications/*` |

Khi vượt ngưỡng giới hạn, Gateway trả về status code `429 Too Many Requests` kèm JSON `{ success: false, message: "Rate limit exceeded" }` (Không trả về header `Retry-After`).

* **Routing (Định tuyến):**

Gateway định tuyến request đến các service đích thông qua thư viện `http-proxy-middleware` dựa trên tiền tố đường dẫn (Path Prefix):

| Path prefix | Service đích | Mô tả |
| :---- | :---- | :---- |
| `/api/v1/users` | `user-service` | API thông tin tài khoản người dùng |
| `/api/v1/auth` | `user-service` | API đăng nhập, đăng ký, refresh token |
| `/api/v1/organizer/users` | `user-service` | API quản lý tài khoản cho Organizer |
| `/api/v1/concerts` | `concert-service` | API hiển thị danh sách sự kiện |
| `/api/v1/organizer/concerts` | `concert-service` | API quản lý sự kiện cho Organizer |
| `/api/v1/organizer/artists` | `concert-service` | API quản lý nghệ sĩ cho Organizer |
| `/api/v1/staff/concerts` | `concert-service` | API kiểm tra danh sách VIP của Staff |
| `/api/v1/orders` | `order-service` | API tạo đơn hàng, mua vé |
| `/api/v1/tickets` | `ticket-service` | API hiển thị chi tiết vé của khách hàng |
| `/api/v1/checkin` | `ticket-service` | API soát vé và lấy khóa công khai soát vé |
| `/api/v1/notifications` | `notification-service` | API hiển thị thông báo, kết nối SSE |

*Lưu ý*: Đường dẫn `/api/v1/payments` không được khai báo qua API Gateway. Dịch vụ Payment Service được expose NodePort thẳng ra bên ngoài để Stripe Webhook kết nối trực tiếp. Ngoài ra, không có service Organizer hay Check-in độc lập; các chức năng này được chia vào `user-service`, `concert-service`, và `ticket-service`.

3. **Kịch bản lỗi**  
* **Service đích không phản hồi:** Gateway sẽ trả về lỗi kết nối (`504 Gateway Timeout` hoặc `502 Bad Gateway` mặc định từ middleware proxy) khi socket kết nối đến các pod dịch vụ nội bộ bị ngắt hoặc lỗi.

2. ## **Load Balancer (Kubernetes & Kind setup)**

1. **Mô tả**

Hệ thống được triển khai trên môi trường Kubernetes cục bộ sử dụng **Kind (Kubernetes in Docker)**. Kubernetes Service đóng vai trò làm Load Balancer nội bộ phân phối lưu lượng từ API Gateway đến các bản sao (Pods) của từng dịch vụ.

2. **Cấu hình**  
* **Thuật toán điều phối:** Mặc định sử dụng cơ chế của K8s Service (thông qua `kube-proxy` áp dụng iptables điều hướng ngẫu nhiên/Round-Robin).
* **Số lượng bản sao (Replica Count):**
  * Các dịch vụ API chính có **2 replicas** chạy song song: `api-gateway`, `user-service`, `concert-service`, `order-service`, `payment-service`, `ticket-service`, `notification-service`.
  * Các dịch vụ xử lý nền, Outbox relay, và Cron scheduler có **1 replica** để tránh xử lý trùng: `concert-relay`, `order-relay`, `order-cron`, `payment-relay`, `payment-cron`, `notification-relay`, `notification-cron`, `reminder-cron`, `redis`, `redis-insight`.
* **Cơ chế Health Check:**
  * Các microservice ứng dụng hiện **chưa cấu hình** các đầu dò `livenessProbe` hay `readinessProbe` trong deployment manifest.
  * Chỉ duy nhất dịch vụ **Redis** có cấu hình `livenessProbe` sử dụng lệnh `redis-cli ping` (chạy mỗi 10 giây, thời gian chờ 5 giây, thử lại tối đa 3 lần thất bại trước khi restart pod).
* **Exposed Ports & NodePorts:**
  Kind forward các cổng từ máy Host vào Node K8s theo sơ đồ:
  * Host Port `3000` $\rightarrow$ containerPort `30000` (API Gateway NodePort Service).
  * Host Port `3004` $\rightarrow$ containerPort `30040` (Payment Service NodePort Service cho Stripe Webhook).
  * Host Port `5540` $\rightarrow$ containerPort `30554` (Redis Insight Dashboard).
  * Host Port `6379` $\rightarrow$ containerPort `30637` (Redis Connection).
* **Sticky Session:** Không áp dụng (Hệ thống stateless sử dụng JWT).

3. ## **Message Queue (BullMQ + Redis)**

1. **Mô tả**

Hệ thống sử dụng **BullMQ** làm thư viện quản lý hàng đợi bất đồng bộ. Khác với đặc tả cũ, hệ thống đang dùng chung **một thực thể Redis duy nhất (`redis://redis:6379`)** phục vụ cho cả cơ chế lưu trữ hàng đợi (Queue) lẫn bộ nhớ đệm (Cache).

2. **Các queue và job type**

| Tên Queue | Job type | Producer | Consumer | Mô tả |
| :---- | :---- | :---- | :---- | :---- |
| **order-queue** | `PAYMENT_CREATED` | Outbox Relay (Payment) | Order Worker | Cập nhật thông tin thanh toán cho đơn hàng |
| | `CREATE_PAYMENT_FAILED` | Outbox Relay (Payment) | Order Worker | Cập nhật trạng thái đơn hàng khi thanh toán lỗi |
| | `CLEANUP_EXPIRED_ORDER` | Order Service | Order Worker | Hủy đơn hàng và hoàn trả lại số dư vé sau 10 phút |
| | `PAYMENT_SUCCESS` | Outbox Relay (Payment) | Order Worker | Thanh toán thành công, đổi trạng thái đơn hàng sang `PAID` |
| | `PAYMENT_EXPIRED` | Outbox Relay (Payment) | Order Worker | Hủy đơn hàng do thanh toán quá hạn |
| **payment-queue** | `CREATE_PAYMENT` | Outbox Relay (Order) | Payment Worker | Tạo bản ghi thanh toán mới và session Stripe |
| | `CLEANUP_EXPIRED_PAYMENT` | Outbox Relay (Order) | Payment Worker | Dọn dẹp bản ghi thanh toán đã hết hạn |
| | `LATE_WEBHOOK_RECEIVED` | Stripe Webhook Controller | Payment Worker | Hoàn tiền đơn hàng nếu webhook đến muộn khi đơn đã bị hủy |
| **ticket-queue** | `GENERATE_TICKETS` | Outbox Relay (Order) | Ticket Worker | Tạo bản ghi vé (unused) sau khi thanh toán thành công |
| **notification-queue**| `NOTIFY_USER` | Outbox Relay (Order) | Notification Worker | Sinh chuỗi sự kiện outbox gửi email và in-app |
| | `IN_APP_NOTIFICATION` | Outbox Relay (Notif) | Notification Worker | Lưu thông báo in-app mua vé thành công vào DB |
| | `EMAIL_NOTIFICATION` | Outbox Relay (Notif) | Notification Worker | Gửi email xác nhận mua vé qua Nodemailer |
| | `SET_24H_REMINDER` | Outbox Relay (Notif) | Notification Worker | Đặt lịch nhắc nhở 24h trước giờ diễn ra sự kiện |
| | `REMINDER_24H` | Cron Job | Notification Worker | Đẩy job gửi email + in-app nhắc nhở trước 24h |
| | `24H_IN_APP_NOTIFICATION` | Outbox Relay (Notif) | Notification Worker | Lưu thông báo in-app nhắc nhở 24h vào DB |
| | `24H_EMAIL_NOTIFICATION` | Outbox Relay (Notif) | Notification Worker | Gửi email nhắc nhở 24h qua Nodemailer |

*(Lưu ý: Các queue `import-queue` và `ai-bio-queue` đề cập ở bản đặc tả cũ không tồn tại trong mã nguồn hiện tại).*

3. **Cơ chế retry và cấu hình Job**

Các job được đẩy từ Outbox Relay vào BullMQ đều sử dụng cấu hình retry mặc định sau:
* **Max retry (Số lần thử lại tối đa):** 3 lần.
* **Delay strategy (Chiến lược trễ):** Exponential backoff (số nhân lũy tiến), thời gian bắt đầu trễ là **3 giây** (delay sẽ nhân đôi sau mỗi lần thất bại: 3s $\rightarrow$ 6s $\rightarrow$ 12s).

4. **Đảm bảo xử lý đúng một lần (Idempotency)**  
   BullMQ đảm bảo mỗi job được xử lý **at-least-once** — job có thể được retry nếu worker crash giữa chừng. Để tránh side effect trùng lặp (gửi email hai lần, chèn trùng vé), mỗi worker tự thực hiện kiểm tra trạng thái trong cơ sở dữ liệu trước khi xử lý:  
   * Worker nhận job $\rightarrow$ truy vấn cơ sở dữ liệu kiểm tra xem bản ghi kết quả của đơn hàng, vé hoặc idempotency_key đã tồn tại chưa.  
   * **Đã xử lý**: bỏ qua hoàn toàn và đánh dấu job hoàn thành.  
   * **Chưa xử lý**: thực hiện tác vụ, ghi dữ liệu mới vào DB (hoặc gửi thư), sau đó đánh dấu job hoàn thành.

5. **Monitoring (Giám sát)**  
   * Hệ thống ghi nhận chi tiết nhật ký thực thi của từng job thông qua logger bao gồm các thông số: `job_id`, `job_name`, `attemptsMade`, và lỗi cụ thể nếu thất bại.  
   * Trong phiên bản này, dashboard quản lý trực quan (Bull Board) **không được tích hợp** trong mã nguồn. Việc theo dõi trạng thái hàng đợi (chờ xử lý, thành công, thất bại) được thực hiện trực tiếp thông qua nhật ký của container hoặc kiểm tra các bản ghi trong bảng Outbox của PostgreSQL.  
   * Các job thất bại sau tất cả các lần thử lại sẽ được đưa vào trạng thái `failed` trong Redis để phục vụ rà soát thủ công.

6. **Kịch bản lỗi**  
   * **Redis Queue bị gián đoạn:**  
     * Các luồng nghiệp vụ không phụ thuộc hàng đợi (như xem thông tin sự kiện, đăng nhập) vẫn hoạt động bình thường.  
     * Các luồng bất đồng bộ sẽ tạm thời bị trì hoãn. Nhờ cấu hình Redis chạy chế độ ghi đè tệp tin `appendonly yes` (AOF), các job đã đẩy vào hàng đợi trước đó sẽ được bảo toàn khi Redis khởi động lại. Khi kết nối phục hồi, các Worker tự động tiếp tục xử lý các job còn tồn đọng.  
     * Ghi nhận cảnh báo lỗi mất kết nối Redis qua log.
   * **Worker bị crash giữa chừng:**  
     * Khi pod Worker bị sập, khóa lock của job trên Redis sẽ hết hạn sau thời gian timeout (mặc định 30 giây). BullMQ sẽ tự động giải phóng và đưa job quay lại hàng đợi để thực hiện thử lại.  
     * Pod Worker tự động được khởi chạy lại nhờ chính sách khôi phục của Kubernetes (`restartPolicy: Always`).

7. **Transactional Outbox Pattern**  
   Để tránh lỗi mất mát sự kiện khi ghi dữ liệu và gửi hàng đợi đồng thời, hệ thống sử dụng Transactional Outbox Pattern:  
   * **Bảng Outbox tương ứng từng Service**: `orders_outbox`, `payments_outbox`, `notifications_outbox`.  
   * **Cơ chế Relay**: Sử dụng tính năng `LISTEN` / `NOTIFY` của PostgreSQL. Khi có bản ghi mới chèn vào bảng outbox, một Trigger trong DB sẽ phát tín hiệu Notify (qua các kênh: `orders_outbox_channel`, `payments_outbox_channel`, `notifications_outbox_channel`). Các tiến trình relay chạy ngầm (Relay Daemons) nhận tín hiệu và lập tức đẩy job sang BullMQ.  
   * **Cơ chế Cron dự phòng**: Mỗi service có một job scheduler (`outboxCron.job.ts`) chạy định kỳ mỗi 30 giây để quét các bản ghi outbox có trạng thái `"FAILED"` hoặc `"PENDING"` quá hạn (`next_retry_at <= NOW()`) nhằm đẩy lại sự kiện, phòng trường hợp kết nối Pub/Sub của DB bị gián đoạn.


---

4. ## **Ràng buộc (Constraints)**

* **API Gateway là điểm vào duy nhất:** Mọi request từ client bắt buộc phải đi qua API Gateway. Các service bên trong được bảo vệ và không được expose port trực tiếp ra ngoài máy Host, **ngoại trừ** `payment-service` được cấu hình loại Service NodePort `30040` (Host Port `3004`) để tiếp nhận các cuộc gọi webhook trực tiếp từ Stripe.
* **Stateless API instances:** Tất cả các bản sao dịch vụ (API instances) tuyệt đối không được lưu trữ trạng thái phiên làm việc cục bộ. Tất cả session, cache, hàng đợi và dữ liệu cần chia sẻ đều phải lưu trữ tập trung tại Redis hoặc PostgreSQL. Đây là yêu cầu bắt buộc để Load Balancer hoạt động chính xác.
* **Redis Queue dùng chung với Redis Cache:** Thay vì tách biệt hai thực thể Redis độc lập như đặc tả cũ, hệ thống hiện dùng chung **một thực thể Redis duy nhất (`redis://redis:6379`)** cho cả lưu trữ hàng đợi BullMQ và bộ nhớ đệm ứng dụng. Do đó, cần thận trọng khi thao tác flush/clear dữ liệu để tránh làm mất các job trong hàng đợi.
* **Job payload tự đủ:** Mỗi job được đẩy vào queue phải chứa đầy đủ dữ liệu ngữ cảnh (ví dụ: `orderId`, `ticketId`) để Worker có thể xử lý độc lập mà không cần phải thực hiện gọi thêm API dây chuyền đến các service bên ngoài khác, giảm thiểu rủi ro nghẽn luồng.
* **Không bỏ qua job failed:** Các job gặp lỗi sau 3 lần retry sẽ tự động được chuyển sang trạng thái `failed` trên bộ nhớ Redis (đóng vai trò Dead Letter Queue) và không được xóa bỏ âm thầm. Quản trị viên phải có khả năng kiểm tra nguyên nhân lỗi và kích hoạt chạy lại thủ công.
* **Rate limiting áp dụng trước khi vào service:** Toàn bộ logic giới hạn tốc độ (Rate Limiting) phải được xử lý tập trung tại lớp API Gateway trước khi chuyển tiếp request vào các dịch vụ phía trong. Không cài đặt lại logic rate limit phân tán tại từng microservice lẻ.

5. ## **Tiêu chí chấp nhận (Acceptance Criteria)**

1. **API Gateway:**  
* Các yêu cầu (requests) đến tài nguyên bảo mật phải mang JWT hợp lệ để các microservice phía sau xác thực thông qua `authMiddleware` nội bộ (nếu không hợp lệ hoặc thiếu token sẽ bị microservice đích từ chối với mã lỗi `401`).
* Request vượt quá tần suất giới hạn phải nhận về mã trạng thái `429 Too Many Requests` đi kèm JSON báo lỗi `{ success: false, message: "Rate limit exceeded" }` (không đi kèm header `Retry-After`).
* Request được định tuyến chính xác đến các microservice đích tương ứng dựa trên Path Prefix đã cấu hình.
* Gateway phản hồi lỗi kết nối mạng (`502` / `504`) lập tức khi dịch vụ đích gặp sự cố ngừng hoạt động, không để client rơi vào trạng thái chờ phản hồi vô hạn.  
2. **Load Balancer:**  
* Lưu lượng truy cập (traffic) được phân phối đều đến các bản sao (Pods) đang khỏe mạnh của từng dịch vụ thông qua cơ chế phân phối ngẫu nhiên/Round-Robin của Kubernetes Service.
* Các Pod dịch vụ chính duy trì chạy ổn định ở cấu hình **2 replicas** song song, các tiến trình nền chạy ở cấu hình **1 replica**.
* Khi một instance (Pod) bị crash hoặc gặp lỗi, Kubernetes Service tự động ngắt định tuyến traffic đến Pod lỗi và chuyển hướng lưu lượng sang Pod còn lại, đồng thời tự động khởi động lại Pod lỗi nhờ chính sách khôi phục tự động của K8s.  
3. **Message Queue:**  
* Mỗi job trong hàng đợi được đảm bảo xử lý chính xác (sử dụng cơ chế at-least-once kết hợp với logic kiểm tra Idempotency tại cơ sở dữ liệu của Worker để tránh tác động phụ như gửi trùng email hoặc sinh trùng vé).
* Các job bị lỗi sau khi thử lại tối đa 3 lần xuất hiện đầy đủ trong danh sách trạng thái `failed` của Redis, không bị thất thoát thông tin.
* Khi Redis Queue gặp sự cố gián đoạn rồi phục hồi, các job đã tồn đọng trong queue được bảo toàn nguyên vẹn nhờ cơ chế ghi đè tệp tin `appendonly yes` (AOF) và tự động xử lý tiếp khi kết nối phục hồi.
* Worker bị sập đột ngột sẽ tự động giải phóng lock của job đang xử lý sau thời gian timeout (30 giây) để đưa job trở lại hàng đợi xử lý tiếp, và tiến trình Worker tự khởi chạy lại nhờ Kubernetes.
* Quản trị viên có khả năng theo dõi trạng thái các hàng đợi (đang chờ, thành công, thất bại) và xử lý lại thủ công các job lỗi thông qua log hệ thống và kiểm tra trực tiếp cơ sở dữ liệu/Redis (Dashboard Bull Board hiện chưa được hỗ trợ).

---

## Lịch sử cập nhật
- 2026-07-12: Cập nhật specs theo code thực tế v0.8.4.
  Thay đổi chính:
  * Điều chỉnh cơ chế xác thực JWT: Xác định rõ API Gateway **không** tự xử lý xác thực JWT mà chỉ làm Proxy chuyển tiếp cho các service đích tự xác thực.
  * Cập nhật chính xác cấu hình bộ giới hạn Token Bucket (đều khóa theo IP `req.ip`) và sơ đồ định tuyến Path Prefix của API Gateway.
  * Thay đổi thông tin Load Balancer sang kiến trúc hạ tầng thực tế chạy trên **Kind Kubernetes** (K8s Cluster), cập nhật bảng replica count, exposed ports, NodePorts, và làm rõ việc các service ứng dụng chưa định nghĩa Health check liveness/readiness probes.
  * Đồng bộ bảng Queue/Job BullMQ đúng thực tế code (bỏ các hàng đợi không tồn tại như `import-queue`, `ai-bio-queue`), làm rõ cơ chế Transactional Outbox Pattern sử dụng Postgres `LISTEN`/`NOTIFY` và Cron dự phòng.

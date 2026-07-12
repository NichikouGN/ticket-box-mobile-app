# **Hướng dẫn Khởi chạy Ứng dụng Di động TicketBox (Mobile Client)**

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình và khởi chạy ứng dụng di động TicketBox ở cả hai môi trường: **Máy ảo (Emulator)** và **Điện thoại thật (Real Device)** bằng **Development Build (Dev Client)**.

---

## **I. Chuẩn bị trước khi khởi chạy**

### **1. Yêu cầu hệ thống và mạng**
* **Chung mạng Wi-Fi**: Để điện thoại thật kết nối được tới máy tính chạy Backend và Metro Bundler, cả hai thiết bị bắt buộc phải kết nối chung vào **một mạng Wi-Fi nội bộ (LAN)**.
* **Tắt tường lửa (Firewall) hoặc Cho phép kết nối**: Đảm bảo tường lửa trên máy tính của bạn không chặn các cổng kết nối:
  * Cổng Metro Bundler: `8081`
  * Cổng Backend API Gateway: `3000`
  * Cổng Redirect Bridge: `5173`

### **2. Cài đặt các gói phụ thuộc (Dependencies)**
Di chuyển vào thư mục gốc của dự án di động (`ticket-box-mobile-app`) và chạy lệnh cài đặt:
```bash
npm install
```

### **3. Cấu hình biến môi trường (`.env`)**
Tạo hoặc cập nhật tệp tin `.env` tại thư mục gốc của dự án di động:
```env
# Thay "192.168.31.16" bằng địa chỉ IPv4 nội bộ mạng LAN của máy tính bạn (tìm qua lệnh ipconfig)
EXPO_PUBLIC_API_URL=http://192.168.31.16:3000/api/v1
```
* **Lưu ý**: Không cấu hình URL là `localhost` hoặc `127.0.0.1` vì thiết bị thật không thể tự phân giải địa chỉ này về máy tính của bạn. Dùng IP LAN giúp cả máy ảo và điện thoại thật cùng truy cập được.

---

## **II. Khởi động hệ thống Backend**
Trước khi chạy ứng dụng di động, hãy đảm bảo cụm máy chủ Backend đã được khởi chạy thành công:
1. Chạy cụm Backend (Docker Compose / Kind Kubernetes Cluster).
2. Chạy máy chủ chuyển hướng Bridge ở cổng `5173` để tiếp nhận liên kết Stripe:
   ```bash
   # Tại thư mục services/bridge của Backend code
   node index.js
   ```

---

## **III. Chạy trên Máy ảo (Android Emulator)**

1. **Khởi động Máy ảo**: Mở Android Studio, chạy máy ảo Android (AVD) của bạn.
2. **Khởi chạy Metro Bundler**:
   ```bash
   npx expo start
   ```
3. **Cài đặt & Mở App trên Máy ảo**:
   * Tại Terminal đang chạy Metro Bundler, nhấn phím **`a`** trên bàn phím.
   * Metro sẽ tự động biên dịch, cài đặt và mở phiên bản phát triển lên máy ảo Android của bạn.
4. **Kiểm thử**: Đăng nhập tài khoản **Khách hàng (User)** để thực hiện đặt vé và mua vé thử nghiệm.

---

## **IV. Chạy trên Điện thoại thật (Real Device) bằng Development Build**

Vì ứng dụng TicketBox sử dụng nhiều thư viện native tùy chỉnh (như Camera quét mã, biểu tượng Symbol native, lưu tệp hình ảnh,...), **Expo Go thông thường sẽ không hoạt động**. Chúng ta phải sử dụng **Development Build (Dev Client)**.

### **1. Biên dịch và cài đặt App (Tạo file APK)**
Bạn có hai phương pháp để có ứng dụng Dev Build trên điện thoại Android:

#### **Cách A: Tự biên dịch trực tiếp (Yêu cầu Android SDK trên máy tính)**
1. Kết nối điện thoại thật của bạn với máy tính qua cáp USB và bật chế độ **USB Debugging** (Gỡ lỗi USB).
2. Chạy lệnh để biên dịch và cài đặt trực tiếp file APK Dev Client lên điện thoại:
   ```bash
   npx expo run:android
   ```

#### **Cách B: Sử dụng EAS Build (Biên dịch trên Cloud của Expo - Không yêu cầu Android SDK)**
1. Cài đặt CLI của EAS: `npm install -g eas-cli`
2. Đăng nhập tài khoản Expo: `eas login`
3. Chạy lệnh build sinh file APK:
   ```bash
   eas build -p android --profile development
   ```
4. Quét mã QR do EAS cung cấp sau khi build xong để tải và cài đặt tệp APK Dev Build vào điện thoại của bạn.

### **2. Kết nối Điện thoại thật với Metro Bundler**
1. **Khởi chạy Metro Bundler ở chế độ mạng LAN**:
   ```bash
   npx expo start --dev-client --lan
   ```
2. **Mở ứng dụng trên điện thoại**:
   * Bật app **Development Build** (biểu tượng ứng dụng của dự án vừa cài đặt qua file APK).
   * Trên giao diện màn hình chờ của ứng dụng, chọn **Scan QR Code** và quét mã QR đang hiển thị trên màn hình Terminal của máy tính.
   * Ứng dụng sẽ tự động tải (fetch) gói JavaScript từ máy tính của bạn và khởi chạy.

---

## **V. Hướng dẫn Test Soát Vé đồng thời 2 thiết bị**

Để kiểm thử luồng mua vé và soát vé khép kín:

1. **Khách hàng (Máy ảo Android)**:
   * Đăng nhập tài khoản khách hàng thông thường.
   * Thực hiện đặt vé một sự kiện ca nhạc và tiến hành thanh toán qua Stripe.
   * Sau khi thanh toán thành công, truy cập tab **Vé của tôi (Tickets)**, mở vé lên để hiển thị mã QR Code có ký số bảo mật.
2. **Nhân viên soát vé (Điện thoại thật)**:
   * Đăng nhập tài khoản nhân viên soát vé (**Staff**).
   * Mở màn hình **Quét vé (Scanner)** trên điện thoại thật.
   * Hướng camera của điện thoại thật vào màn hình máy tính đang hiển thị mã QR trên máy ảo.
   * Hệ thống sẽ ngay lập tức đối chiếu dữ liệu với Backend trực tuyến và hiển thị trạng thái soát vé thành công (**✔️ VÉ HỢP LỆ** hoặc thông báo lỗi nếu vé đã quét trước đó).

---

## **VI. Các lỗi thường gặp và cách xử lý (Troubleshooting)**

* **Lỗi không kết nối được tới Metro Bundler (Màn hình đỏ/trắng trên điện thoại)**:
  * *Nguyên nhân*: Điện thoại và máy tính không chung mạng Wi-Fi, hoặc IP trong QR code không khớp với IP hiện tại của máy tính.
  * *Khắc phục*: Tắt và bật lại Wi-Fi trên cả hai thiết bị. Kiểm tra lại địa chỉ IP bằng `ipconfig` và chắc chắn khởi chạy Metro với tham số `--lan`.
* **Lỗi "Cannot find native module 'ExpoMediaLibraryNext'" khi lưu ảnh QR**:
  * *Nguyên nhân*: Thay đổi cấu hình thư viện ảnh từ cũ sang hướng đối tượng (class-based) mới cần mã nguồn native tương ứng, nhưng file APK cũ của bạn chưa được cập nhật.
  * *Khắc phục*: Cần chạy lại lệnh biên dịch và cài đặt APK mới: `npx expo run:android` hoặc chạy lại `eas build`.
* **Lỗi "Refused to connect" khi redirect sau thanh toán Stripe**:
  * *Nguyên nhân*: URL `FRONTEND_URL` trên Backend hoặc biến môi trường `EXPO_PUBLIC_API_URL` của mobile vẫn đang trỏ về `localhost` thay vì IP LAN máy tính.
  * *Khắc phục*: Thay đổi các biến môi trường này về dạng `http://<IP_MAY_TINH>...` và khởi động lại máy chủ.

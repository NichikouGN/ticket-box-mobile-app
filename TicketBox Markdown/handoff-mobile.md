# TicketBox — Mobile App Hand-off

## 1. Project Overview

**Goal:** Xây dựng nền tảng bán vé concert trực tuyến theo kiến trúc microservices, giải quyết các vấn đề thực tế: website sập khi mở bán, oversell vé, bot scalper, và quy trình soát vé thủ công.

**Nhóm:** 3 người
- 1 người: Backend (Node.js + Express, tất cả microservices)
- 1 người: Web Frontend (React/TS) — Organizer + User trên browser
- **1 người (bạn): Mobile App (React Native Expo) — Staff + User trên điện thoại**

---

## 2. Tech Stack

### Toàn hệ thống

| Thành phần | Công nghệ |
| :--- | :--- |
| Backend | Node.js + Express.js (Microservices) |
| Database | PostgreSQL (Supabase hosted) |
| Cache | Redis (instance riêng) |
| Message Queue | BullMQ + Redis (instance riêng) |
| AI | Gemini 2.5 API |
| Auth | JWT + RBAC |
| QR Generate | `qrcode` lib (backend) |
| Containerization | Docker |

### Mobile App (phần bạn đảm nhiệm)

| Thành phần | Công nghệ |
| :--- | :--- |
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | expo-router (file-based routing) |
| HTTP | axios |
| Auth storage | expo-secure-store |
| Camera / QR Scan | expo-camera + expo-barcode-scanner |
| QR Display | react-native-qrcode-svg + react-native-svg |
| QR Decrypt | crypto-js (AES-256 decrypt phía client) |
| Styling | NativeWind (Tailwind cho React Native) |

---

## 3. Kiến trúc hệ thống (tóm tắt)

```
Mobile App
    └── API Gateway (JWT auth, rate limiting, routing)
            ├── User Service       — auth, RBAC
            ├── Concert Service    — danh sách, chi tiết concert
            ├── Order Service      — đặt vé, quản lý đơn hàng
            ├── Ticket Service     — sinh vé + QR sau thanh toán
            ├── Check-in Service   — soát vé QR
            └── Notification Service — email + in-app
```

**Base URL:** `http://10.0.2.2:3000/api/v1` (emulator Android)
**Auth:** Mọi request protected cần header `Authorization: Bearer <JWT_Token>`

---

## 4. Roles & Permissions

| Role | Mô tả | Dùng trên |
|---|---|---|
| `audience` | Khán giả mua vé | Web + Mobile |
| `organizer` | Ban tổ chức quản lý concert | Web only |
| `staff` | Nhân sự soát vé tại cổng | Mobile only |

Mobile app phục vụ 2 role: `audience` và `staff`. Sau khi đăng nhập, app đọc `role` từ JWT payload để render đúng luồng.

---

## 5. Màn hình cần làm

### Luồng chung (Auth)
- **Login** — email + password, lưu JWT vào SecureStore
- **Register** — tạo tài khoản mới (role mặc định: audience)

### Luồng User (audience)
- **Danh sách concert** — GET /api/v1/concerts (có phân trang)
- **Chi tiết concert** — GET /api/v1/concerts/:id + GET /api/v1/concerts/:id/tickets
- **Chọn vé + đặt vé** — POST /api/v1/orders
- **Thanh toán mock** — UI chọn kịch bản success/fail, sau đó polling GET /api/v1/payments/:id
- **Danh sách vé đã mua** — GET /api/v1/tickets
- **Chi tiết vé + hiển thị QR** — GET /api/v1/tickets/:id, decrypt qr_aes256 → render QR

### Luồng Staff
- **Download danh sách hash** — GET /api/v1/checkin/checkin-list/:concert_id (lưu vào local storage)
- **Màn hình quét QR** — dùng camera, hash mã quét → POST /api/v1/checkin/verify
- **Kết quả soát vé** — hiển thị màu: xanh (SUCCESS), đỏ (ALREADY_USED/INVALID), vàng (WRONG_CONCERT)
- **Soát vé offline** — so sánh hash với local storage khi mất mạng
- **Sync offline** — POST /api/v1/checkin/sync khi có mạng trở lại
- **Thống kê soát vé** — GET /api/v1/checkin/stats/:concert_id

---

## 6. Cấu trúc thư mục

```
TicketBox-Mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (user)/
│   │   ├── concerts/
│   │   │   ├── index.tsx        # Danh sách concert
│   │   │   └── [id].tsx         # Chi tiết concert + chọn vé
│   │   ├── orders/
│   │   │   └── index.tsx        # Danh sách đơn hàng
│   │   └── tickets/
│   │       ├── index.tsx        # Danh sách vé
│   │       └── [id].tsx         # Chi tiết vé + hiển thị QR
│   ├── (staff)/
│   │   ├── scan.tsx             # Màn hình quét QR
│   │   ├── result.tsx           # Kết quả soát vé
│   │   └── stats.tsx            # Thống kê soát vé
│   └── _layout.tsx              # Root layout + auth guard
├── components/
│   ├── QRDisplay.tsx            # Hiển thị mã QR từ qr_aes256
│   ├── QRScanner.tsx            # Camera quét QR
│   └── CheckinResult.tsx        # Hiển thị kết quả soát vé
├── services/
│   ├── auth.service.ts          # Login, register, logout
│   ├── concert.service.ts       # Danh sách, chi tiết concert
│   ├── order.service.ts         # Đặt vé, xem đơn hàng
│   ├── ticket.service.ts        # Xem vé, hiển thị QR
│   └── checkin.service.ts       # Soát vé, sync offline
├── hooks/
│   ├── useAuth.ts               # Quản lý JWT, role
│   └── useOfflineQueue.ts       # Quản lý offline queue
├── constants/
│   └── api.ts                   # BASE_URL, endpoints
└── app.json
```

---

## 7. Chi tiết kỹ thuật quan trọng

### Auth flow
```typescript
// Sau khi login thành công
await SecureStore.setItemAsync('jwt_token', token);

// Mọi request API
const token = await SecureStore.getItemAsync('jwt_token');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Đọc role từ JWT payload (không cần gọi API)
const payload = JSON.parse(atob(token.split('.')[1]));
const role = payload.role; // 'audience' hoặc 'staff'
```

### QR Display (User xem vé)
```typescript
// Backend lưu qr_aes256 trong DB
// Client decrypt để lấy qr_raw rồi render QR
import CryptoJS from 'crypto-js';

const decryptQR = (qr_aes256: string, secretKey: string) => {
  const bytes = CryptoJS.AES.decrypt(qr_aes256, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8); // qr_raw
};
// Truyền qr_raw vào <QRCode value={qr_raw} />
```

### QR Scan (Staff soát vé)
```typescript
// Sau khi scan được qr_raw từ camera
import * as Crypto from 'expo-crypto';

const hashQR = async (qr_raw: string) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    qr_raw
  );
};
// Gửi qr_sha256 lên POST /checkin/verify
```

### Offline mode (Staff)
```typescript
// Download danh sách hash trước sự kiện
// Lưu vào AsyncStorage (không dùng SecureStore vì data lớn)
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem(
  `checkin_list_${concert_id}`,
  JSON.stringify(hashes)
);

// Khi mất mạng: tra cứu local thay vì gọi API
const list = JSON.parse(await AsyncStorage.getItem(`checkin_list_${concert_id}`));
const found = list.find(h => h.qr_sha256 === scanned_hash);
```

---

## 8. API endpoints Mobile cần dùng

| Method | Endpoint | Dùng cho |
|---|---|---|
| POST | /auth/login | Đăng nhập |
| POST | /auth/register | Đăng ký |
| GET | /concerts | Danh sách concert |
| GET | /concerts/:id | Chi tiết concert |
| GET | /concerts/:id/tickets | Loại vé + số lượng |
| POST | /orders | Đặt vé |
| GET | /orders | Danh sách đơn hàng |
| GET | /tickets | Danh sách vé đã mua |
| GET | /tickets/:id | Chi tiết vé + qr_aes256 |
| GET | /checkin/checkin-list/:concert_id | Download hash list (Staff) |
| POST | /checkin/verify | Xác thực QR (Staff) |
| POST | /checkin/sync | Sync offline records (Staff) |
| GET | /checkin/stats/:concert_id | Thống kê soát vé (Staff) |

---

## 9. Key Decisions đã chốt

- **Expo thay vì bare React Native** — đơn giản hơn cho thời gian 3 tuần, Expo Camera đủ dùng cho demo
- **`10.0.2.2` thay `localhost`** khi gọi API từ Android Emulator
- **SecureStore cho JWT**, AsyncStorage cho checkin list offline (data lớn hơn)
- **Offline mode dùng SHA-256 hash** để so sánh — không lưu qr_raw trên thiết bị
- **Sync dùng Redis SETNX** phía server để detect conflict — client chỉ cần gửi records và đọc kết quả
- **AES-256 decrypt phía client** để render QR — SECRET_KEY lấy từ env hoặc config

---

## 10. Thứ tự implement gợi ý

1. **Setup project** — expo init, cài thư viện, cấu trúc thư mục, constants/api.ts
2. **Auth** — login screen, JWT storage, route guard theo role
3. **User: Danh sách + Chi tiết concert** — màn hình đọc nhiều nhất
4. **User: Đặt vé + Thanh toán mock** — luồng quan trọng nhất
5. **User: Xem vé + hiển thị QR** — cần decrypt AES-256
6. **Staff: Download hash list + Quét QR online** — tính năng độc đáo nhất
7. **Staff: Offline mode + Sync** — làm sau cùng vì phức tạp nhất
8. **Staff: Thống kê** — đơn giản, làm cuối

---

## 11. Điểm cần sync với backend dev

- **SECRET_KEY cho AES-256** — cần thống nhất key hoặc cơ chế truyền key về client
- **JWT payload structure** — cần biết field nào chứa `role`, `user_id`
- **Base URL** — khi backend deploy lên staging thì cập nhật lại `API_URL`
- **Concert status flow** — `draft` → `upcoming` → `published` → `cancelled`, mobile chỉ hiển thị `published`

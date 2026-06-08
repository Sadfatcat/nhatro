# DEBUG — Contract Page

**Ngày:** 2026-06-08  
**Triệu chứng:** "Không tìm thấy tài nguyên yêu cầu" + "Không thể xem trước hợp đồng" khi mở modal Tạo hợp đồng và click Xem trước.

---

## Root Cause Analysis

### 1. Vấn đề là gì?

Toàn bộ `/api/contracts/*` routes trả **404** — kể cả `GET /api/contracts`, `POST /api/contracts/preview`, `GET /api/contracts/:id/download`.

### 2. Nguyên nhân?

Docker container chạy `dist/main.js` — file build cũ được compile từ trước khi `ContractsModule` được thêm vào `AppModule`. Thư mục `dist/modules/` **không có folder `contracts/`**, nên NestJS không load module này dù code source đã đúng.

```
dist/modules/
  accounts/   ✅
  auth/       ✅
  rooms/      ✅
  utilities/  ✅
  contracts/  ❌ MISSING
```

**Quy trình triển khai trong project này:**
```
tsc build → dist/ → docker restart (chạy dist/main.js)
```
Bước build bị bỏ qua → container restart vẫn chạy code cũ.

### 3. Cách giải quyết?

```bash
# Step 1: Build TypeScript → dist/
npm run build -w apps/api

# Step 2: Restart container để load dist/ mới
npm run docker:restart:api -w apps/api
```

Đúng lệnh `deploy` trong `package.json` của API đã có sẵn cả 2 bước:
```bash
npm run deploy -w apps/api   # = build + docker restart
```

---

## Test Results (sau khi fix)

| Test | Endpoint | Result |
|------|----------|--------|
| Preview contract | `POST /api/contracts/preview` | ✅ 200, trả tenant/room data |
| Create + generate DOCX | `POST /api/contracts` | ✅ 200, file sinh ra tại `uploads/contracts/{id}.docx` |
| File tồn tại trên disk | `docker exec ls uploads/contracts/` | ✅ 237KB `.docx` file |
| Download DOCX | `GET /api/contracts/:id/download` | ✅ 200, `Microsoft Word 2007+` |
| List contracts | `GET /api/contracts` | ✅ 200, trả đúng danh sách |
| Tenant bị block | `POST /api/contracts/preview` với TENANT token | ✅ 400 blocked đúng |

---

### 4. Bài học → Cập nhật skill `gen-api-link`

**Pattern phổ biến cần ghi nhớ:**

> Khi project dùng **Docker + compiled dist** (không phải `ts-node` hay watch mode), mọi thay đổi backend **bắt buộc phải build trước khi restart**. Chỉ restart container mà không build sẽ chạy code cũ.

**Rule bổ sung cho `gen-api-link`:**

Sau khi wire API xong, luôn hướng dẫn user deploy đúng cách tùy theo runtime:

| Runtime | Deploy command |
|---------|---------------|
| Docker + dist | `npm run build -w apps/api && npm run docker:restart:api -w apps/api` hoặc `npm run deploy -w apps/api` |
| ts-node / watch | Tự restart, không cần build |
| PM2 | `pm2 restart` sau build |

Khi verify API sau implement, **luôn check route đã registered chưa** trước khi test endpoint:
```bash
docker logs <api-container> | grep "Mapped.*contract"
# hoặc
curl /api/docs-json | python3 -c "import sys,json; [print(p) for p in json.load(sys.stdin)['paths'] if 'contract' in p]"
```

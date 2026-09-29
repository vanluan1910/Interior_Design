# D2 LUXURY - Nội Thất Gỗ Nghệ Nhân Cao Cấp

Cấu trúc dự án được phân chia rõ ràng thành 2 thư mục: **frontend** và **backend**.

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
Interior design/
├── frontend/                     # Ứng dụng giao diện khách hàng (Next.js 16 + Ant Design + Tailwind CSS)
│   ├── src/
│   │   ├── app/                  # Trang (App Router: /, /san-pham, /phong-khach, /danh-muc)
│   │   ├── components/           # Components UI (Header, Footer, CartDrawer, Modals,...)
│   │   ├── data/                 # Dữ liệu sản phẩm & danh mục
│   │   └── types/                # TypeScript Interfaces
│   ├── public/                   # Static assets & icons
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── backend/                      # Máy chủ API dịch vụ (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/          # Bộ điều khiển xử lý nghiệp vụ (products, bookings, orders)
│   │   ├── routes/               # API Endpoints (/api/products, /api/bookings, /api/orders)
│   │   ├── data/                 # Mock database
│   │   ├── types/                # Data types
│   │   └── server.ts             # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── package.json                  # Root Monorepo configuration
└── README.md
```

---

## 🚀 Hướng Dẫn Chạy Dự Án (Quick Start)

### 1. Khởi động Frontend (Next.js)
```bash
# Tại thư mục gốc:
npm run dev

# Hoặc:
npm run dev:frontend

# Hoặc chuyển vào thư mục frontend:
cd frontend
npm run dev
```
> Truy cập giao diện tại: **http://localhost:3000**

### 2. Khởi động Backend (Express API)
```bash
# Tại thư mục gốc:
npm run dev:backend

# Hoặc chuyển vào thư mục backend:
cd backend
npm install
npm run dev
```
> API Server chạy tại: **http://localhost:5000**
> Kiểm tra trạng thái: **http://localhost:5000/api/health**

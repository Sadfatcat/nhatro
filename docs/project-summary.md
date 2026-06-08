# Project Summary

## 1. Tổng Quan

Dự án là hệ thống **Quản lý Nhà Trọ** dạng monorepo, gồm frontend CMS và backend API.

Mục tiêu chính:
- Guest xem danh sách phòng công khai.
- Tenant xem phòng được gán, hợp đồng, hóa đơn, trạng thái thanh toán.
- Admin/Landlord quản lý phòng, tenant, tài khoản, điện nước, hợp đồng, hóa đơn.

## 2. Công Nghệ Sử Dụng

- Frontend: Angular standalone components, RxJS/signals, custom SCSS, ng-zorro-antd, Chart.js.
- Backend: NestJS, TypeScript, Prisma ORM.
- Database: PostgreSQL.
- Monorepo: npm workspaces.

## 3. Cấu Trúc Monorepo

- `apps/cms`: Angular frontend.
- `apps/api`: NestJS backend.
- `packages/shared-types`: shared domain/auth/permission types.
- `packages/shared-auth`: shared RBAC mapping, hiện đang lệch với CMS local permissions.
- `packages/shared-mocks`: mock users/dev login, đang là leftover cần cleanup.
- `packages/ui`: package UI dự phòng, hiện gần như rỗng.

## 4. Module Frontend

- Auth/Login: đăng nhập, hiện còn quick-login dev/mock.
- Main Layout: topbar, sidebar, footer.
- Rooms: danh sách phòng, CRUD phòng, public room listing.
- Accounts: quản lý tài khoản phòng và tài khoản chủ trọ.
- Dashboard: thống kê phòng, chart; invoice stats hiện là placeholder.
- Management Home: trang chủ admin/landlord, kanban ngày chốt điện nước, nhập chỉ số điện/nước, chart phòng.
- Tenant Home: trang tenant xem phòng/chỉ số điện nước của mình.
- Tenants/Landlords: hiện là placeholder pages.
- Unauthorized/404: trang lỗi.

## 5. Module Backend

- `AuthModule`: login bằng username/email.
- `AccountsModule`: tạo/quản lý tài khoản chủ trọ, tenant/phòng.
- `RoomsModule`: CRUD phòng.
- `UtilitiesModule`: điện nước, billing day, utility records.

Chưa thấy module thật cho `Contracts` và `Invoices`, dù frontend permissions/menu đã có.

## 6. Tổ Chức Code

Frontend:
- `core`: auth, guards, interceptors, services, permissions.
- `layout`: main/auth/sidebar layout.
- `modules`: các feature page.
- `shared`: component dùng chung, pipes, directives, form/display/filter/feedback.
- `styles`: theme, variables, mixins.

Backend:
- `src/modules/*`: module/controller/service theo NestJS.
- `src/prisma`: Prisma service/module.
- `prisma/schema.prisma`: schema database.
- `prisma/migrations`: database migrations.

## 7. RBAC / Role

- Guest: xem public room listing.
- Tenant: xem phòng được gán, contract/invoice/payment của mình.
- Admin/Landlord: quản lý phòng, tenant, contract, invoice, utility.

Hiện permission source đang bị phân tán giữa CMS local policy và `packages/shared-*`.

## 8. Trạng Thái Code Hiện Tại

- Frontend build pass.
- Có một số cleanup rõ ràng: unused imports/fields, Angular starter template, mock login, route chưa tồn tại, placeholder pages.
- Cần cẩn thận với shared components và permissions vì có thể dùng gián tiếp hoặc planned.

# Code Cleanup Audit

## 1. Summary

Codebase build FE thành công, nhưng còn nhiều dấu vết scaffold/mock/dev và một số route/menu đã khai báo trước nhưng chưa có page thật.

Các nhóm đáng chú ý nhất:
- **Mock login** vẫn nằm trong flow đăng nhập sản phẩm (`quickLogin`, `MOCK_USERS`, `MockAuthStorageService`).
- **Hàng chục shared components** (filter, navigation, display) được scaffold sẵn nhưng chưa có consumer.
- **Tất cả 5 custom pipes** chưa được dùng bất kỳ template nào.
- **Sidebar/topbar** có link trỏ tới route không tồn tại: `/contracts`, `/invoices`, `/utilities`, `/profile`, `/settings`.
- **Permission** được khai báo ở 3 nơi lệch nhau; có entry duplicate.
- **Hai component lớn** (`AccountsComponent` 361 dòng, `ManagementHomeComponent` 302 dòng) gom nhiều workflow vào một file.
- `utilities-data.service.ts` vừa được tạo nhưng chưa có consumer.

---

## 2. Safe Cleanup Items

- **File path:** `apps/cms/src/app/app.html`, `apps/cms/src/app/app.scss`
- **Code/component/function name:** Angular starter placeholder template/style
- **Problem:** File template/style cũ không được component root dùng.
- **Evidence:** `apps/cms/src/app/app.ts` dùng inline `template: '<router-outlet></router-outlet>'`; không có `templateUrl`/`styleUrls` reference nào trỏ về.
- **Suggested action:** Xóa cả 2 file.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/modules/dashboard/dashboard.component.ts`
- **Code/component/function name:** `ApiResponse` (import), `private api` (field), `monthKey()` (method)
- **Problem:** Khai báo/import/field không dùng.
- **Evidence:** `noUnusedLocals` báo TS6196/TS6133 tại lines 28, 44, 179. `monthKey()` được định nghĩa nhưng không có caller trong file.
- **Suggested action:** Xóa `ApiResponse` import, `private api`, và `monthKey()`.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/modules/home/tenant-home/tenant-home.component.ts`
- **Code/component/function name:** `elecChartInstance`, `waterChartInstance`
- **Problem:** Field chỉ được assign, không bao giờ đọc lại.
- **Evidence:** `noUnusedLocals` báo TS6133 tại lines 64–65. Không có `this.elecChartInstance` hay `this.waterChartInstance` nào khác trong file.
- **Suggested action:** Nếu không cần destroy/update chart, đổi thành local const trong ngAfterViewInit.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/modules/utilities/components/monthly-room-charge-dialog/monthly-room-charge-dialog.component.ts`
- **Code/component/function name:** `minThanValidator`
- **Problem:** Validator helper không được dùng; validation đang làm thủ công trong `validate()`.
- **Evidence:** `noUnusedLocals` báo TS6133 tại line 33. Không có call site nào trong file.
- **Suggested action:** Xóa helper hoặc dùng trực tiếp trong form validators.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/shared/components/feedback/confirm-dialog/confirm-dialog.service.ts`
- **Code/component/function name:** `from` (RxJS import)
- **Problem:** Import không được dùng.
- **Evidence:** `noUnusedLocals` báo TS6133 tại line 2. `from` không xuất hiện trong body file.
- **Suggested action:** Xóa `from` khỏi import.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/shared/components/navigation/paginator/paginator.component.ts`
- **Code/component/function name:** `Input` (Angular decorator import)
- **Problem:** Component đã migrate sang signal `input()` nhưng vẫn import decorator legacy `Input`.
- **Evidence:** `noUnusedLocals` báo TS6133 tại line 1.
- **Suggested action:** Xóa `Input` khỏi import.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/shared/components/overlay/form-dialog/form-dialog.component.ts`
- **Code/component/function name:** `inject` (Angular import)
- **Problem:** Import không được dùng trong file.
- **Evidence:** `noUnusedLocals` báo TS6133 tại line 3.
- **Suggested action:** Xóa `inject` khỏi import.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts`
- **Code/component/function name:** `'utilities:view'` (duplicate entries)
- **Problem:** Permission bị khai báo lặp 2 lần trong union type, `ALL_PERMISSIONS`, và `LANDLORD` permissions.
- **Evidence:** `'utilities:view'` xuất hiện ở lines 30 và 37, lines 70 và 77, lines 111 và 118.
- **Suggested action:** Giữ một entry duy nhất mỗi list.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/core/services/utilities-data.service.ts`
- **Code/component/function name:** `UtilitiesDataService`
- **Problem:** Service vừa tạo (untracked file) nhưng chưa có consumer nào inject.
- **Evidence:** `git status` hiển thị `?? apps/cms/src/app/core/services/utilities-data.service.ts`; `grep -r "UtilitiesDataService"` không trả về kết quả nào ngoài file định nghĩa.
- **Suggested action:** Inject vào component đích ngay, hoặc xóa nếu chưa cần.
- **Risk level:** Low

---

## 3. Needs Manual Check

- **File path:** `apps/cms/src/app/core/layout/navigation/side-items.ts`
- **Code/component/function name:** `/app/contracts`, `/app/invoices`, `/app/utilities` (menu items)
- **Problem:** Menu sidebar trỏ tới route chưa khai báo.
- **Evidence:** `side-items.ts` lines 60, 67, 74; `app.routes.ts` không có path `contracts`, `invoices`, `utilities`.
- **Why it needs manual check:** Có thể là planned modules. Xóa menu cần xác nhận với roadmap và RBAC.
- **Suggested action:** Ẩn menu tới khi có route/page, hoặc implement route sau khi xác nhận role.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/shared/components/layout/topbar/topbar.component.html`
- **Code/component/function name:** `routerLink="/profile"`, `routerLink="/settings"`
- **Problem:** User dropdown trỏ tới route không tồn tại.
- **Evidence:** Lines 70 và 73; `app.routes.ts` không khai báo `/profile` hay `/settings`.
- **Why it needs manual check:** Route có thể sẽ thêm sau.
- **Suggested action:** Ẩn item hoặc wire đúng route khi module profile/settings tồn tại.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/home/home.component.ts` (+ `.html`, `.scss`)
- **Code/component/function name:** `HomeComponent`
- **Problem:** Component home wrapper không thấy route hay import nào trỏ tới.
- **Evidence:** Static search chỉ thấy chính file định nghĩa; routes đang load trực tiếp `tenant-home` và `management-home`.
- **Why it needs manual check:** Có thể được giữ làm shared wrapper tương lai.
- **Suggested action:** Xác nhận roadmap; nếu không dùng, xóa cả 3 file.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/errors/page403.component.ts`
- **Code/component/function name:** `Page403Component`
- **Problem:** Route `/403` redirect sang `/unauthorized`, không load component này.
- **Evidence:** `app.routes.ts` line 95 redirect `/403` → `/unauthorized`; static search không thấy import `Page403Component`.
- **Why it needs manual check:** Có thể muốn giữ page 403 riêng.
- **Suggested action:** Xóa component hoặc đổi route `/403` load trực tiếp nó.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/shared/components/**` (toàn bộ thư mục)
- **Code/component/function name:** `DataTableComponent`, `InfoCardComponent`, `RoomStatusGridComponent`, `FilterBarComponent`, `SelectFilterComponent`, `StatusFilterComponent`, `MonthFilterComponent`, `YearPickerComponent`, `QuarterPickerComponent`, `DateRangeFilterComponent`, `DateRangePickerComponent`, `FormFieldComponent`, `FilterPanelComponent`, `SearchInputComponent`, `PageHeaderComponent`, `BreadcrumbComponent`, `TabsComponent`, `LoadingStateComponent`, `ErrorStateComponent`, `ModalComponent`, `RoleBadgeComponent`, `AppShellComponent`, `ClickOutsideDirective`
- **Problem:** Không thấy usage tĩnh ngoài file định nghĩa.
- **Evidence:** `grep` theo selector/class name chỉ trả về file định nghĩa.
- **Why it needs manual check:** Shared components có thể dùng gián tiếp hoặc đang là component library dự phòng theo kế hoạch.
- **Suggested action:** Chạy `npx knip` để xác nhận; xóa theo batch nhỏ sau khi confirm không còn trong roadmap.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/shared/pipes/` (toàn bộ 5 pipes)
- **Code/component/function name:** `CurrencyVnPipe`, `DateFormatPipe`, `SafeHtmlPipe`, `StatusLabelPipe`, `TruncatePipe`
- **Problem:** Không thấy import nào trong toàn bộ `apps/cms/src`.
- **Evidence:** `grep -r "import.*CurrencyVnPipe\|DateFormatPipe\|SafeHtmlPipe\|StatusLabelPipe\|TruncatePipe"` chỉ trả về file định nghĩa.
- **Why it needs manual check:** Pipes có thể sẽ được dùng khi module invoices/tenants được implement.
- **Suggested action:** Giữ nếu module đang planned; xóa nếu không có roadmap rõ.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/core/auth/guards/role.guard.ts`
- **Code/component/function name:** `roleGuard`
- **Problem:** Guard được định nghĩa nhưng không có route nào dùng.
- **Evidence:** `grep -r "roleGuard\|role\.guard"` không tìm thấy import nào; các route dùng `permissionGuard`.
- **Why it needs manual check:** Có thể là guard backup hoặc sẽ thay permissionGuard sau.
- **Suggested action:** Xóa nếu `permissionGuard` là guard chính thức duy nhất.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts`, `packages/shared-auth/src/role-permissions.ts`, `packages/shared-types/src/permission.types.ts`
- **Code/component/function name:** Permission type definitions
- **Problem:** Permission khai báo ở 3 nơi và đang lệch nhau.
- **Evidence:** CMS local có `management-home:view`, `accounts:rooms`, `utilities:record`, `utilities:set-billing-day`; `packages/shared-types` không có các này; app import local policy, không import `@nhatro/shared-auth`.
- **Why it needs manual check:** Permission là RBAC critical — sai là security bug.
- **Suggested action:** Chọn một source of truth, merge, rồi xóa bản duplicate.
- **Risk level:** Medium

---

- **File path:** `packages/ui/src/index.ts`
- **Code/component/function name:** `@nhatro/ui` package
- **Problem:** Package rỗng và không thấy import trong app.
- **Evidence:** `packages/ui/src/index.ts` chỉ có comment; static search không thấy `@nhatro/ui` trong app source.
- **Why it needs manual check:** README ghi là package dự phòng khi component cần dùng chung.
- **Suggested action:** Giữ nếu vẫn planned; nếu không, remove khỏi workspace.
- **Risk level:** Medium

---

## 4. Messy or Overcomplicated Code

- **File path:** `apps/cms/src/app/modules/home/management-home/management-home.component.ts` / `.html` / `.scss`
- **Problem:** Component quá lớn, gom nhiều workflow không liên quan.
- **Why it is messy:** TS 302 dòng, HTML 345 dòng, SCSS 590 dòng. Chứa cùng lúc: dashboard stats, kanban billing-day, modal chọn phòng, utility reading, price editing, chart lifecycle, API writes.
- **Suggested refactor:** Tách `BillingDayKanbanComponent`, `UtilityReadingDialogComponent`, `UtilityPriceEditorComponent`; extract chart builder vào utility function.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/accounts/accounts.component.ts` / `.html`
- **Problem:** Một component xử lý nhiều màn hình, form, và modal.
- **Why it is messy:** TS 361 dòng, HTML 335 dòng. Dùng chung cho `/accounts/rooms` và `/accounts/landlords`; chứa create room account, assign tenant, landlord CRUD, và 8+ modal flags.
- **Suggested refactor:** Tách page container, `RoomAccountTableComponent`, `LandlordAccountTableComponent`, mỗi dialog form thành component riêng.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/dashboard/dashboard.component.ts`
- **Problem:** Chart config và placeholder invoice stats nằm trực tiếp trong component.
- **Why it is messy:** Chart setup lặp inline; invoice data toàn `0`; có `private api` unused và comment "placeholder until invoice API is ready".
- **Suggested refactor:** Tách chart builder thành util hoặc shared component; ẩn invoice widget cho tới khi có API thật.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/home/tenant-home/tenant-home.component.ts`
- **Problem:** Chart instance lifecycle không rõ; data vẫn là placeholder.
- **Why it is messy:** `elecChartInstance`/`waterChartInstance` được assign nhưng không đọc/destroy. Chart data là `Array(6).fill(0)`.
- **Suggested refactor:** Nếu chart tĩnh thì dùng local const; nếu sẽ update bằng API thật, thêm `OnDestroy`.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/core/services/utilities-data.service.ts`
- **Problem:** Pipeline dùng anti-pattern `switchMap(async ...)` và `any`.
- **Why it is messy:** `async` mapping trong `switchMap` biến Observable thành Promise chain không cần thiết; `any` type bỏ qua type safety.
- **Suggested refactor:** `switchMap(res => of(res.data ?? []))` với type `ApiResponse<RoomWithUtility[]>`.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/shared/components/display/data-table/data-table.component.ts`
- **Problem:** Generic table component lớn nhưng hiện chưa có consumer.
- **Why it is messy:** `TemplateRef<any>` với `eslint-disable`; nhiều concern selection/sort/pagination/action trong một file.
- **Suggested refactor:** Chỉ refactor nếu quyết định giữ; nếu không có consumer, ưu tiên xóa.
- **Risk level:** Medium

---

## 5. Duplicate Logic / Duplicate Components

- **Related files:** `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts`, `packages/shared-auth/src/role-permissions.ts`, `packages/shared-types/src/permission.types.ts`
- **Duplicated behavior:** Permission lists và role mappings duy trì ở nhiều nơi, lệch nội dung.
- **Suggested shared abstraction:** Dùng `@nhatro/shared-auth` làm single source of truth, hoặc xóa packages nếu CMS local là nguồn chính.
- **Risk level:** Medium

---

- **Related files:** `apps/cms/src/app/modules/dashboard/dashboard.component.ts`, `apps/cms/src/app/modules/home/management-home/management-home.component.ts`
- **Duplicated behavior:** Room stats computation và doughnut chart setup gần giống nhau.
- **Suggested shared abstraction:** `room-stats.util.ts` hoặc `RoomStatusChartComponent`.
- **Risk level:** Medium

---

- **Related files:** `apps/cms/src/app/modules/dashboard/dashboard.component.ts`, `apps/cms/src/app/modules/home/tenant-home/tenant-home.component.ts`
- **Duplicated behavior:** Month label generation và Chart.js bar/line config inline lặp nhau.
- **Suggested shared abstraction:** Chart label utility function + shared chart config factory.
- **Risk level:** Low

---

- **Related files:** `apps/cms/src/app/modules/landlords/landlords.component.ts`, `apps/cms/src/app/modules/tenants/tenants.component.ts`
- **Duplicated behavior:** Cả hai là placeholder page shell gần giống nhau với inline template/style.
- **Suggested shared abstraction:** Nếu giữ placeholder, dùng shared `EmptyPageComponent`; nếu không, thay bằng real modules.
- **Risk level:** Low

---

## 6. Mock / Debug / Temporary Code Leftovers

- **File path:** `packages/shared-mocks/src/index.ts`, `apps/cms/src/app/modules/auth/login/login.component.ts`, `apps/cms/src/app/modules/auth/login/login.component.html`, `apps/cms/package.json`
- **Type of leftover:** Mock/dev login data và UI
- **Evidence:** `MOCK_USERS`, `MockUser`, `@nhatro/shared-mocks`, text "Đăng nhập nhanh (dev)", method `quickLogin()`.
- **Suggested action:** Xóa quick login UI và `shared-mocks` package sau khi xác nhận dev login replacement.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/core/auth/services/mock-auth-storage.service.ts`
- **Type of leftover:** Mock naming và localStorage key
- **Evidence:** Service name `MockAuthStorageService`, key `mock_auth_state`, đang được inject trong `AuthService` thật.
- **Suggested action:** Rename thành `AuthStorageService` / `SessionStorageService` sau khi xác nhận auth flow là thật.
- **Risk level:** Medium

---

- **File path:** `packages/shared-types/src/auth.types.ts`
- **Type of leftover:** `MockUser` interface trong shared types production
- **Evidence:** `MockUser` interface và `AuthState.user: MockUser | null`.
- **Suggested action:** Rename thành `AuthUser` hoặc `UserSession` sau khi xác nhận backend login response contract.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/dashboard/dashboard.component.ts`
- **Type of leftover:** Placeholder invoice stats (hardcoded zeros)
- **Evidence:** Comment `// Invoice stats — placeholder until invoice API is ready`; signals set `0`; income datasets là empty arrays.
- **Suggested action:** Ẩn invoice widgets hoặc wire API thật khi module invoice tồn tại.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/modules/home/management-home/management-home.component.ts`
- **Type of leftover:** Placeholder invoice amount
- **Evidence:** Comment `// Invoice stats placeholder`; `pendingAmount = signal(0)`.
- **Suggested action:** Xóa khỏi UI cho tới khi invoice API sẵn sàng.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/modules/home/tenant-home/tenant-home.component.html`
- **Type of leftover:** Room photo placeholder block
- **Evidence:** Comment `<!-- Room photo placeholder -->`.
- **Suggested action:** Thay bằng real room image field/API hoặc xóa block.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/app/modules/landlords/landlords.component.ts`, `apps/cms/src/app/modules/tenants/tenants.component.ts`
- **Type of leftover:** Placeholder pages với inline text
- **Evidence:** Inline text `Placeholder — chưa có dữ liệu.`
- **Suggested action:** Implement real API-backed pages hoặc ẩn route/nav cho tới khi sẵn sàng.
- **Risk level:** Medium

---

- **File path:** `apps/cms/src/app/app.html`
- **Type of leftover:** Angular starter scaffold
- **Evidence:** Placeholder comments, Angular logo/social links, `Hello, {{ title() }}`.
- **Suggested action:** Xóa cùng `app.scss` nếu xác nhận không dùng.
- **Risk level:** Low

---

- **File path:** `apps/cms/src/main.ts`
- **Type of leftover:** Console output
- **Evidence:** `.catch((err) => console.error(err))` trong bootstrap catch.
- **Suggested action:** Giữ hoặc wrap với environment check; không urgent.
- **Risk level:** Low

---

- **File path:** `apps/api/scripts/ensure-admin.js`
- **Type of leftover:** Console output trong script
- **Evidence:** `console.log('Admin account ready...')`.
- **Suggested action:** Giữ — log trong admin script là bình thường.
- **Risk level:** Low

---

## 7. Recommended Cleanup Plan

1. **Low-risk cleanup first (an toàn 100%, không cần review)**
   - Xóa `app.html`, `app.scss` (Angular scaffold không dùng)
   - Xóa unused imports: `from` trong confirm-dialog, `Input` trong paginator, `inject` trong form-dialog, `ApiResponse`/`private api` trong dashboard
   - Xóa `monthKey()` trong dashboard, `minThanValidator` trong monthly-room-charge-dialog
   - Sửa duplicate `'utilities:view'` trong `role-permissions.ts`
   - Inject `UtilitiesDataService` vào consumer hoặc xóa nếu chưa cần

2. **Manual-check items sau khi xác nhận roadmap**
   - Ẩn hoặc xóa sidebar/topbar links trỏ route không tồn tại (`/contracts`, `/invoices`, `/utilities`, `/profile`, `/settings`)
   - Quyết định giữ hay xóa: `Page403Component`, `HomeComponent`, `roleGuard`
   - Xóa hoặc giữ tất cả shared components/pipes chưa có consumer (cần confirm với roadmap)
   - Chọn một source of truth cho permissions và merge

3. **Refactor large/duplicated components sau cùng**
   - Split `ManagementHomeComponent` và `AccountsComponent`
   - Extract shared chart utilities sau khi route/RBAC cleanup xong
   - Cleanup mock auth layer (`MockAuthStorageService`, `MockUser`) sau khi auth flow thật được xác nhận

---

## 8. Commands Used / Suggested

```bash
# Tìm unused locals/params
npx tsc -p apps/cms/tsconfig.app.json --noEmit --noUnusedLocals --noUnusedParameters
npx tsc -p apps/api/tsconfig.json --noEmit --noUnusedLocals --noUnusedParameters

# Tìm console/debug/TODO/mock statements
rg -n "console\.|debugger\b|TODO|FIXME|HACK|mock|Mock|fake|Fake|placeholder" apps packages -g '!node_modules'

# Tìm route references
rg -n "loadComponent|path:\s*'|routerLink|navigate\(|navigateByUrl" apps/cms/src/app -g '*.ts' -g '*.html'

# Tìm mock auth references
rg -n "MockAuthStorageService|MOCK_USERS|MockUser|@nhatro/shared-mocks|quickLogin" . -g '!node_modules'

# Kiểm tra unused shared components
rg -n "FilterBarComponent|BreadcrumbComponent|TabsComponent|DataTableComponent" apps/cms/src -g '*.ts' -g '*.html'

# Kiểm tra unused pipes
rg -n "CurrencyVnPipe|DateFormatPipe|SafeHtmlPipe|StatusLabelPipe|TruncatePipe" apps/cms/src -g '*.ts' -g '*.html'

# Build check
npm run build

# Lint check (nếu có config)
npm run lint

# Recommended: dead exports scanner
npx knip
```

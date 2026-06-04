# Angular Frontend Sourcebase Architecture

> **Angular version:** 19+ (Standalone Components, Signals API)
> **Mục đích:** Tài liệu thiết kế kiến trúc, cấu trúc thư mục và các pattern phát triển chuẩn cho dự án.

---

## 1. Cấu trúc thư mục tổng quan

```
src/
├── app/
│   ├── core/                        # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── permission.guard.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       └── permission.model.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   ├── handlers/
│   │   │   └── error.handler.ts
│   │   └── services/
│   │       ├── api.service.ts
│   │       └── storage.service.ts
│   │
│   ├── shared/                      # Components, pipes, directives dùng chung
│   │   ├── components/
│   │   │   ├── table/
│   │   │   │   ├── table.component.ts
│   │   │   │   ├── table.component.html
│   │   │   │   ├── table.component.scss
│   │   │   │   └── table.model.ts
│   │   │   ├── filter/
│   │   │   │   ├── filter.component.ts
│   │   │   │   ├── filter.component.html
│   │   │   │   ├── filter.component.scss
│   │   │   │   └── filter.model.ts
│   │   │   ├── form-builder/
│   │   │   │   ├── form-builder.component.ts
│   │   │   │   ├── form-builder.component.html
│   │   │   │   ├── form-builder.component.scss
│   │   │   │   ├── form-schema.model.ts
│   │   │   │   └── validators/
│   │   │   │       ├── custom.validators.ts
│   │   │   │       └── async.validators.ts
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── footer/
│   │   │   │   ├── footer.component.ts
│   │   │   │   ├── footer.component.html
│   │   │   │   └── footer.component.scss
│   │   │   └── sidebar/
│   │   │       ├── sidebar.component.ts
│   │   │       ├── sidebar.component.html
│   │   │       └── sidebar.component.scss
│   │   ├── pipes/
│   │   │   ├── date-format.pipe.ts
│   │   │   ├── currency-vn.pipe.ts
│   │   │   ├── truncate.pipe.ts
│   │   │   ├── safe-html.pipe.ts
│   │   │   └── status-label.pipe.ts
│   │   └── directives/
│   │       ├── permission.directive.ts
│   │       └── click-outside.directive.ts
│   │
│   ├── features/                    # Các module nghiệp vụ (lazy-loaded)
│   │   └── [feature-name]/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── services/
│   │       ├── models/
│   │       └── [feature].routes.ts
│   │
│   ├── layout/                      # Shell layout
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   └── main-layout.component.html
│   │   └── auth-layout/
│   │       ├── auth-layout.component.ts
│   │       └── auth-layout.component.html
│   │
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.component.ts
│
├── assets/
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles/
    ├── _variables.scss              # Design tokens
    ├── _themes.scss                 # Dark/light theme
    ├── _mixins.scss
    ├── _typography.scss
    └── styles.scss                  # Global entry
```

---

## 2. SCSS — Design Tokens & Themes

### `styles/_variables.scss`

```scss
// ─── Breakpoints ────────────────────────────────
$breakpoints: (
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px,
);

// ─── Spacing ─────────────────────────────────────
$spacer: 8px;
$spacers: (0: 0, 1: $spacer, 2: $spacer * 2, 3: $spacer * 3, 4: $spacer * 4, 5: $spacer * 5);

// ─── Border radius ───────────────────────────────
$radius-sm:  4px;
$radius-md:  8px;
$radius-lg: 16px;

// ─── Typography ──────────────────────────────────
$font-family-base: 'Inter', sans-serif;
$font-size-base:   14px;
$line-height-base: 1.5;

// ─── Z-index ─────────────────────────────────────
$z-sidebar:  100;
$z-header:   200;
$z-modal:    300;
$z-toast:    400;
```

### `styles/_themes.scss`

```scss
// Light theme (default)
:root,
[data-theme='light'] {
  --color-primary:        #1677ff;
  --color-primary-hover:  #4096ff;
  --color-secondary:      #6c757d;

  --color-bg-base:        #ffffff;
  --color-bg-subtle:      #f5f5f5;
  --color-bg-card:        #ffffff;

  --color-text-primary:   #1a1a1a;
  --color-text-secondary: #6b7280;
  --color-text-muted:     #9ca3af;
  --color-text-inverse:   #ffffff;

  --color-border:         #e5e7eb;
  --color-border-focus:   #1677ff;

  --color-success:        #52c41a;
  --color-warning:        #faad14;
  --color-error:          #ff4d4f;
  --color-info:           #1677ff;

  --color-sidebar-bg:     #001529;
  --color-sidebar-text:   rgba(255,255,255,0.85);
  --color-header-bg:      #ffffff;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.1);

  --transition-base: 0.2s ease;
}

// Dark theme
[data-theme='dark'] {
  --color-primary:        #4096ff;
  --color-primary-hover:  #69b1ff;

  --color-bg-base:        #141414;
  --color-bg-subtle:      #1f1f1f;
  --color-bg-card:        #1f1f1f;

  --color-text-primary:   rgba(255,255,255,0.85);
  --color-text-secondary: rgba(255,255,255,0.55);
  --color-text-muted:     rgba(255,255,255,0.35);
  --color-text-inverse:   #141414;

  --color-border:         #303030;
  --color-border-focus:   #4096ff;

  --color-success:        #49aa19;
  --color-warning:        #d89614;
  --color-error:          #d32029;

  --color-sidebar-bg:     #0d0d0d;
  --color-sidebar-text:   rgba(255,255,255,0.85);
  --color-header-bg:      #1f1f1f;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.4);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.5);
}
```

---

## 3. Table Common Component

### Model — `table.model.ts`

```typescript
export interface TableColumn<T = any> {
  key:         string;
  label:       string;
  sortable?:   boolean;
  width?:      string;
  sticky?:     'start' | 'end';
  cellClass?:  string | ((row: T) => string);
  formatter?:  (value: any, row: T) => string;
  template?:   string;            // named ng-template ref
  hide?:       boolean;
}

export interface TableConfig<T = any> {
  columns:       TableColumn<T>[];
  data:          T[];
  rowKey:        keyof T;
  loading?:      boolean;
  pagination?:   PaginationConfig;
  selectable?:   boolean;
  actions?:      TableAction<T>[];
  emptyText?:    string;
}

export interface PaginationConfig {
  page:      number;
  pageSize:  number;
  total:     number;
  pageSizes?: number[];
}

export interface TableAction<T = any> {
  label:      string;
  icon?:      string;
  color?:     'primary' | 'danger' | 'warning';
  visible?:   (row: T) => boolean;
  disabled?:  (row: T) => boolean;
  action:     (row: T) => void;
}

export interface SortEvent {
  column:    string;
  direction: 'asc' | 'desc' | '';
}

export interface PageEvent {
  page:     number;
  pageSize: number;
}
```

### Component `table.component.ts`

```typescript
@Component({
  selector:    'app-table',
  standalone:  true,
  templateUrl: './table.component.html',
  styleUrls:   ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T extends Record<string, any>> {
  @Input() config!: TableConfig<T>;

  @Output() sortChange   = new EventEmitter<SortEvent>();
  @Output() pageChange   = new EventEmitter<PageEvent>();
  @Output() selectChange = new EventEmitter<T[]>();
  @Output() rowClick     = new EventEmitter<T>();

  selectedRows = signal<Set<any>>(new Set());
  sortState    = signal<SortEvent>({ column: '', direction: '' });

  visibleColumns = computed(() =>
    this.config.columns.filter(c => !c.hide).map(c => c.key)
  );

  onSort(column: string): void { /* toggle asc/desc/'' */ }
  onPageChange(page: number, pageSize: number): void { /* emit */ }
  toggleRow(row: T): void { /* update selectedRows signal */ }
  toggleAll(checked: boolean): void { /* select/deselect all */ }
  getCellValue(row: T, col: TableColumn<T>): string { /* apply formatter */ }
  getCellClass(row: T, col: TableColumn<T>): string { /* dynamic class */ }
}
```

---

## 4. Filter Common Component

### Model — `filter.model.ts`

```typescript
export type FilterFieldType =
  | 'text' | 'number' | 'select' | 'multiselect'
  | 'date' | 'daterange' | 'checkbox' | 'radio';

export interface FilterField {
  key:          string;
  label:        string;
  type:         FilterFieldType;
  placeholder?: string;
  options?:     { label: string; value: any }[];
  defaultValue?: any;
  width?:       'sm' | 'md' | 'lg' | 'full';    // grid span
}

export interface FilterConfig {
  fields:        FilterField[];
  collapsible?:  boolean;
  autoSearch?:   boolean;            // debounce search on change
  debounceMs?:   number;             // default 400ms
}

export type FilterValue = Record<string, any>;
```

### Component

```typescript
@Component({
  selector:    'app-filter',
  standalone:  true,
  templateUrl: './filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements OnInit {
  @Input() config!: FilterConfig;
  @Output() filterChange = new EventEmitter<FilterValue>();
  @Output() filterReset  = new EventEmitter<void>();

  form!: FormGroup;

  ngOnInit(): void { /* build FormGroup from config.fields */ }
  onSearch(): void  { this.filterChange.emit(this.form.value); }
  onReset(): void   { this.form.reset(); this.filterReset.emit(); }
}
```

---

## 5. Form Builder — JSON Schema Driven

### Schema — `form-schema.model.ts`

```typescript
export type FieldType =
  | 'text' | 'email' | 'password' | 'number' | 'tel'
  | 'textarea' | 'select' | 'multiselect' | 'radio'
  | 'checkbox' | 'date' | 'datetime' | 'file' | 'hidden';

export interface FieldValidation {
  required?:      boolean;
  minLength?:     number;
  maxLength?:     number;
  min?:           number;
  max?:           number;
  pattern?:       string;           // RegExp string
  email?:         boolean;
  custom?:        string;           // registered custom validator key
  asyncValidator?: string;          // registered async validator key
  messages?: Partial<Record<
    'required'|'minLength'|'maxLength'|'min'|'max'|
    'pattern'|'email'|'custom', string
  >>;
}

export interface FormFieldSchema {
  key:           string;
  type:          FieldType;
  label:         string;
  placeholder?:  string;
  defaultValue?: any;
  validation?:   FieldValidation;
  options?:      { label: string; value: any }[];
  disabled?:     boolean;
  hidden?:       boolean;
  width?:        'full' | 'half' | 'third';
  dependsOn?: {                     // conditional visibility
    field:  string;
    value:  any;
  };
  hint?:         string;
  beErrorKey?:   string;            // map BE error field → this control
}

export interface FormSchema {
  fields:        FormFieldSchema[];
  submitLabel?:  string;
  cancelLabel?:  string;
  layout?:       'vertical' | 'horizontal' | 'grid';
}
```

### Validators — `custom.validators.ts`

```typescript
// Client-side custom validators registry
export const CUSTOM_VALIDATORS: Record<string, ValidatorFn> = {
  noWhitespace: (ctrl) =>
    /^\S+$/.test(ctrl.value ?? '') ? null : { noWhitespace: true },

  vietnamesePhone: (ctrl) =>
    /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/.test(ctrl.value ?? '')
      ? null : { vietnamesePhone: true },

  strongPassword: (ctrl) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(ctrl.value ?? '')
      ? null : { strongPassword: true },
};

// Async validators (e.g. check unique email via API)
export const ASYNC_VALIDATORS: Record<string, (http: HttpClient) => AsyncValidatorFn> = {
  uniqueEmail: (http) => (ctrl) =>
    ctrl.value
      ? http.get<{ exists: boolean }>(`/api/check-email?email=${ctrl.value}`).pipe(
          debounceTime(300),
          map(res => res.exists ? { uniqueEmail: true } : null),
          catchError(() => of(null)),
        )
      : of(null),
};
```

### Component `form-builder.component.ts`

```typescript
@Component({
  selector:    'app-form-builder',
  standalone:  true,
  templateUrl: './form-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilderComponent implements OnInit {
  @Input() schema!:         FormSchema;
  @Input() beErrors:        Record<string, string[]> = {};  // server-side errors
  @Input() loading =        false;

  @Output() submitted  = new EventEmitter<Record<string, any>>();
  @Output() cancelled  = new EventEmitter<void>();

  form!: FormGroup;

  ngOnInit(): void   { this.buildForm(); }

  private buildForm(): void {
    // 1. Build controls with validators from schema
    // 2. Wire up dependsOn conditional show/hide
    // 3. Attach asyncValidators via ASYNC_VALIDATORS registry
  }

  // Patches backend validation errors into form controls
  applyBeErrors(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([key, msgs]) => {
      this.form.get(key)?.setErrors({ beError: msgs[0] });
    });
  }

  getError(key: string): string | null {
    const ctrl   = this.form.get(key);
    const schema = this.schema.fields.find(f => f.key === key);
    if (!ctrl?.errors || ctrl.pristine) return null;
    // Resolve error message: custom message → default message
    const msgs = schema?.validation?.messages ?? {};
    if (ctrl.errors['required'])    return msgs.required    ?? 'Trường này là bắt buộc';
    if (ctrl.errors['minLength'])   return msgs.minLength   ?? `Tối thiểu ${ctrl.errors['minLength'].requiredLength} ký tự`;
    if (ctrl.errors['maxLength'])   return msgs.maxLength   ?? `Tối đa ${ctrl.errors['maxLength'].requiredLength} ký tự`;
    if (ctrl.errors['pattern'])     return msgs.pattern     ?? 'Định dạng không hợp lệ';
    if (ctrl.errors['email'])       return msgs.email       ?? 'Email không hợp lệ';
    if (ctrl.errors['beError'])     return ctrl.errors['beError'];
    return 'Giá trị không hợp lệ';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted.emit(this.form.value);
  }
}
```

---

## 6. Guards — Phân quyền

### `auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

### `role.guard.ts`

```typescript
// Route data: { roles: ['admin', 'manager'] }
export const roleGuard: CanActivateFn = (route) => {
  const auth      = inject(AuthService);
  const router    = inject(Router);
  const required  = route.data['roles'] as string[] ?? [];
  const hasAccess = required.length === 0 || required.some(r => auth.hasRole(r));
  return hasAccess ? true : router.createUrlTree(['/403']);
};
```

### `permission.guard.ts`

```typescript
// Route data: { permissions: ['user:read', 'user:write'] }  — AND logic
export const permissionGuard: CanActivateFn = (route) => {
  const auth        = inject(AuthService);
  const router      = inject(Router);
  const required    = route.data['permissions'] as string[] ?? [];
  const hasAccess   = required.every(p => auth.hasPermission(p));
  return hasAccess ? true : router.createUrlTree(['/403']);
};
```

### `permission.directive.ts`

```typescript
// Usage: <button *appPermission="'user:delete'">Xóa</button>
@Directive({ selector: '[appPermission]', standalone: true })
export class PermissionDirective implements OnInit {
  @Input('appPermission') permission!: string | string[];

  private auth = inject(AuthService);
  private view = inject(ViewContainerRef);
  private tmpl = inject(TemplateRef);

  ngOnInit(): void {
    const perms = Array.isArray(this.permission) ? this.permission : [this.permission];
    const show  = perms.every(p => this.auth.hasPermission(p));
    show ? this.view.createEmbeddedView(this.tmpl) : this.view.clear();
  }
}
```

---

## 7. Interceptors & Error Handler

### `auth.interceptor.ts`

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authed);
};
```

### `error.interceptor.ts`

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      errorHandler.handle(err);
      return throwError(() => err);
    })
  );
};
```

### `loading.interceptor.ts`

```typescript
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(finalize(() => loading.hide()));
};
```

### `error.handler.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private toast  = inject(ToastService);
  private router = inject(Router);
  private auth   = inject(AuthService);

  handle(err: HttpErrorResponse): void {
    switch (err.status) {
      case 0:   this.toast.error('Không có kết nối mạng'); break;
      case 400: this.handleValidation(err); break;
      case 401: this.auth.logout(); this.router.navigate(['/login']); break;
      case 403: this.router.navigate(['/403']); break;
      case 404: this.toast.error('Không tìm thấy tài nguyên'); break;
      case 422: this.handleValidation(err); break;
      case 500: this.toast.error('Lỗi máy chủ, vui lòng thử lại'); break;
      default:  this.toast.error('Đã có lỗi xảy ra');
    }
  }

  private handleValidation(err: HttpErrorResponse): void {
    // err.error.errors: Record<string, string[]>
    // Emit to FormBuilder via a shared ValidationErrorService (Subject)
    const errors = err.error?.errors ?? {};
    inject(ValidationErrorService).push(errors);
    this.toast.warning('Dữ liệu không hợp lệ, vui lòng kiểm tra lại');
  }
}
```

---

## 8. Common Service Layer

### `api.service.ts` — Base HTTP wrapper

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(path, { params: this.buildParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(path, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(path, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(path, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(path);
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let p = new HttpParams();
    if (!params) return p;
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) p = p.set(k, String(v));
    });
    return p;
  }
}
```

### `auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api     = inject(ApiService);
  private storage = inject(StorageService);

  currentUser = signal<User | null>(null);
  token       = computed<string | null>(() => this.storage.get('access_token'));

  isAuthenticated = computed(() => !!this.token());

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions?.includes(permission) ?? false;
  }

  login(credentials: LoginDto): Observable<void> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(res => {
        this.storage.set('access_token', res.accessToken);
        this.currentUser.set(res.user);
      }),
      map(() => void 0),
    );
  }

  logout(): void {
    this.storage.remove('access_token');
    this.currentUser.set(null);
  }

  refreshProfile(): Observable<void> {
    return this.api.get<User>('/auth/me').pipe(
      tap(user => this.currentUser.set(user)),
      map(() => void 0),
    );
  }
}
```

### `storage.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T; }
    catch { return null; }
  }
  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  remove(key: string): void { localStorage.removeItem(key); }
  clear(): void { localStorage.clear(); }
}
```

### `theme.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);
  theme = signal<'light' | 'dark'>(this.storage.get('theme') ?? 'light');

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      this.storage.set('theme', this.theme());
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}
```

### `loading.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _count = signal(0);
  isLoading      = computed(() => this._count() > 0);

  show(): void { this._count.update(c => c + 1); }
  hide(): void { this._count.update(c => Math.max(0, c - 1)); }
}
```

---

## 9. Pipes

| Pipe | Selector | Mục đích |
|------|----------|----------|
| `DateFormatPipe` | `dateFormat` | Format date theo locale VN (`dd/MM/yyyy HH:mm`) |
| `CurrencyVnPipe` | `currencyVn` | Format tiền VNĐ (`1.000.000 ₫`) |
| `TruncatePipe` | `truncate` | Cắt chuỗi + dấu `...` |
| `SafeHtmlPipe` | `safeHtml` | Bypass DomSanitizer cho HTML string |
| `StatusLabelPipe` | `statusLabel` | Map status enum → label + class CSS |

```typescript
// Ví dụ StatusLabelPipe
@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  private map: Record<string, { label: string; class: string }> = {
    active:   { label: 'Hoạt động', class: 'badge--success' },
    inactive: { label: 'Không hoạt động', class: 'badge--gray' },
    pending:  { label: 'Chờ duyệt', class: 'badge--warning' },
    banned:   { label: 'Bị khóa', class: 'badge--danger' },
  };

  transform(value: string): { label: string; class: string } {
    return this.map[value] ?? { label: value, class: 'badge--default' };
  }
}
```

---

## 10. Layout: Header / Footer / Sidebar

### Header — features
- Logo + navigation
- User avatar + dropdown (profile, logout)
- Theme toggle (light/dark) qua `ThemeService`
- Notification bell
- Breadcrumb

### Sidebar — features
- Menu tree động từ config/API (hỗ trợ nested)
- Active state theo router URL
- Collapse/expand (lưu trạng thái vào storage)
- Ẩn menu dựa trên permission (`*appPermission`)

### Footer — features
- Copyright, version app
- Links: Privacy, Terms

---

## 11. App Config — `app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ])
    ),
    provideAnimationsAsync(),
  ],
};
```

---

## 12. Routing — phân quyền

```typescript
export const appRoutes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permissions: ['user:read'] },
        loadChildren: () => import('./features/users/users.routes'),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/admin/admin.routes'),
      },
    ],
  },
  { path: 'login',  component: LoginPage,   canActivate: [noAuthGuard] },
  { path: '403',    component: Page403 },
  { path: '404',    component: Page404 },
  { path: '**',     redirectTo: '404' },
];
```

---

## 13. Checklist phát triển

- [ ] Khởi tạo project với Angular 19+ CLI: `ng new <app> --standalone --routing --style=scss`
- [ ] Cài đặt UI library (NG-ZORRO / PrimeNG / Angular Material)
- [ ] Setup SCSS design tokens & themes
- [ ] Implement `core/` (interceptors, guards, services)
- [ ] Implement `shared/components/table`
- [ ] Implement `shared/components/filter`
- [ ] Implement `shared/components/form-builder` + validators
- [ ] Implement `shared/pipes`
- [ ] Implement `shared/directives/permission`
- [ ] Implement layout (header, sidebar, footer)
- [ ] Implement auth flow (login page, token refresh)
- [ ] Wire routing với guards
- [ ] Unit test các pipe & validators
- [ ] E2E test luồng login + phân quyền

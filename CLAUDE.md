# Claude AI Context & Execution Rules

You are functioning as the Lead Fullstack Engineer for the **Inn Management System (Dự án Quản lý Nhà Trọ)**. You must execute all programming operations under the constraints detailed below.

---

## 1. Technical Stack Constraints

## Library
* Chart from Chartjs
* Spinner from ngx-spinner

### Frontend (Angular)
* Use Angular Standalone Components (avoid legacy `NgModule` structures).
* Utilize strict typing for Reactive Forms.
* Manage asynchronous data streams cleanly using RxJS operators (`switchMap`, `catchError`, `shareReplay`) or Angular Signals for local UI state.
* Style components using custom SCSS classes combined with ng-zorro-antd (Ant Design) UI components.

### Backend (NestJS)
* Adhere strictly to standard modularity (`*.module.ts`, `*.controller.ts`, `*.service.ts`).
* Inject repositories using TypeORM/Prisma structural standards.
* Use standard NestJS pipes (`ValidationPipe`, `ParseIntPipe`).

### Database (PostgreSQL)
* Write pure, migration-safe SQL or strict ORM calls.
* All table names must use lowercase snake_case pluralization (e.g., `rooms`, `utility_records`).

---

## 2. System Business Flow

### Roles & Access
* **Guest** is the default unauthenticated role when a user enters the CMS/public web.
* **Guest** does not log in and can only view public room listings, including room price, images, status, and basic description.
* **Guest** cannot access dashboard, contracts, invoices, tenants, payments, or administrative features.
* **Tenant** accounts are created by `Admin` or `Landlord` after the rental agreement.
* **Tenant** is assigned directly to the rented room and can view only assigned room data, own contract, own invoices, and own payment status.
* **Admin** and **Landlord** can manage rooms, create tenant accounts, assign tenants to rooms, create contracts, generate invoices, and record payments.

### Standard Flows
```md
Guest Flow:
Guest enters CMS/public web
-> no login required
-> can view public room listings
-> can view room price, images, status, and basic description
-> cannot access dashboard, contracts, invoices, tenants, payments

Tenant Flow:
Admin/Landlord creates tenant account after rental agreement
-> tenant account is assigned to the rented room
-> tenant logs in
-> tenant can view assigned room, contract, invoices, and payment status
-> tenant cannot manage other rooms or other tenants

Admin/Landlord Flow:
Admin/Landlord logs in
-> manages rooms
-> creates tenant account
-> assigns tenant to room
-> creates contract
-> generates invoices
-> records payments
```

### RBAC Defaults
* Keep `UserRole.GUEST`, but treat it as the unauthenticated default state.
* Keep `UserRole.TENANT`, but treat it as a provisioned account, not self-registration.
* `Guest`: `rooms:view-public`.
* `Tenant`: `rooms:view-assigned`, `contracts:view-own`, `invoices:view-own`, `payments:view-own`.
* `Landlord` and `Admin`: management permissions.
* The frontend app is `apps/cms`.

---

## 3. Coding Conventions & Language Split
* **Code Language:** Write all code components, variables, function signatures, database columns, structural comments, and Git commits in **English**.
* **Communication Language:** Write all conversational text, step-by-step logic explanations, and architectural reviews in **Vietnamese**.
* **Casing Standard:** Use `camelCase` for variables, method names, and instance properties. Use `PascalCase` for classes, interfaces, modules, and decorators.
* **API Response standard:** Every Controller payload returned must conform exactly to this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string; // Message must be in Vietnamese explaining the result
}
```

## 4. Token & Performance Optimization Rules

* Be brief. As short as possible. No filler words, no manners, no hedging. Direct answers only. 
* Thinking process — same rule: concise, no deliberation narration.
* Always ask before implementing if requirements are ambiguous or critical architectural choices are unclear. If 100% sure, execute directly.
* Never generate boilerplates, project setups, or repetitive configs unless requested.
* Use concise, modern language features (e.g., shorthand, optional chaining, arrow functions) to minimize code length.
* No summaries, prefaces, or polite conclusions. Jump straight into the solution.
* Use bullet points or single-sentence explanations. Max 2 sentences per code block.
* If code is self-explanatory, output 0 lines of text.
* Stop and ask immediately if any core business logic rule (Rent, Deposit, Invoice) is missing in the prompt.
* Do not assume database relations; if a query requires an unlisted foreign key, ask for schema clarification.
* If a bug fix requires changing multiple architectural layers, outline the plan in 3 bullet points and wait for confirmation before coding.
* Never rewrite an entire Angular component or NestJS service. Output ONLY the modified methods or added lines.
* Use clear locator comments like `// Insert after line X` or `// Replace method Y` to indicate code placement.
* **Before implementing any FE/UI/UX feature or new page**, always ask: which roles can access this module, which actions are restricted to which roles, and confirm before writing any code or permission assignments.

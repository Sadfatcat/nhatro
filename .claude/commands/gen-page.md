Generate a production-ready Angular page for this project. Always read the project conventions first, then ask what the page needs before writing any code.

---

## Step 1 — Discover project conventions (always do this first)

Read these files:
- `CLAUDE.md` — stack constraints and coding rules
- One existing page component to extract patterns (look in `modules/` or `pages/`)
- `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts` — valid permissions
- `apps/cms/src/app/core/services/api.service.ts` — available HTTP methods

Extract:
- Component style: Standalone or NgModule?
- State: Signals, RxJS, or plain properties?
- CSS: custom SCSS + which UI library (ng-zorro, Material, PrimeNG...)?
- What shared components already exist (PageHeader, Paginator, FormBuilder, StatusBadge, EmptyState...)?

If `CLAUDE.md` exists → follow its rules strictly.

---

## Step 2 — Ask for page requirements

Ask the user:
1. **What is this page called?** (e.g. "Rooms", "Invoice Detail", "Monthly Report")
2. **What does this page do?** (e.g. "list and manage rooms", "show invoice breakdown", "visualize income by month")
3. **Who can access it?** (roles + which actions are restricted)
4. **What data does it show?** (entities, fields, relationships)
5. **Any interactions?** (filters, forms, modals, drag-drop, charts, tabs...)

Do NOT generate until all 5 are answered.

---

## Step 3 — Classify page type and plan layout

Based on the answers, classify into one or more of:

| Type | When to use | Key elements |
|---|---|---|
| **List/Table** | Managing a collection of records | FilterBar, Table, Paginator, CRUD modals |
| **Form** | Creating or editing a single record | FormBuilder, validation, submit/cancel |
| **Dashboard** | Overview with metrics and charts | InfoCards, Chart.js charts, computed signals |
| **Detail** | Viewing a single record in depth | Sections, tabs, read-only fields, action buttons |
| **Kanban** | Status-based workflow | CDK drag-drop columns, cards |
| **Mixed** | Combination of the above | Compose from the relevant patterns above |

State the classification to the user before generating. If mixed, describe which sections use which type.

---

## Step 4 — Generate 3 files in order: HTML → SCSS → TS

### HTML rules
Structure top to bottom:
```
1. PageHeader — title + action buttons (wrapped with *appPermission if restricted)
2. Main content area — based on page type:
   - List: FilterBar → Table → EmptyState → Paginator
   - Form: FormBuilder inside a card
   - Dashboard: InfoCards row → Charts row
   - Detail: header summary → tabbed sections
   - Kanban: CDK drop zones with cards
3. Modals/Dialogs — always at the bottom, outside main content
```

- Use existing shared components — never rebuild what already exists
- If a component doesn't exist → build inline and mark `<!-- TODO: extract to shared component -->`
- Use the project's UI library (ng-zorro: `nz-table`, `nz-select`, `nz-modal`...)
- All user-facing text in Vietnamese

### SCSS rules
- BEM-style class names matching the project's existing conventions
- Only add styles the UI library cannot cover
- `:host { display: block; }` always present

### TS rules
- Standalone component, `ChangeDetectionStrategy.OnPush` always
- Declare locally: `interface ApiResponse<T> { success: boolean; data: T | null; message: string; }`
- Status fields typed with enums from `@nhatro/shared-types`, never `string`
- All state via `signal()`, derived state via `computed()`
- Filter signals reset `page` to 1 on change
- nz-select cannot bind signals directly — mirror each filter signal to a plain property
- API calls: always pass `ApiResponse<T>` as generic, always use `finalize()` to reset loading
- Only use permission strings that exist in `ALL_PERMISSIONS`
- Delete always requires confirm modal — never on direct button click
- Toast messages in Vietnamese

---

## Step 5 — After generating

State clearly:
- Which API endpoints the page expects (so BE knows what to build)
- Which permissions are used (so role-permissions.ts can be checked)
- Any shared components that don't exist yet and need to be created

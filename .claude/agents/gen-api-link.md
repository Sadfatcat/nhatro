---
name: gen-api-link
description: Wire an existing Angular page to a real NestJS API endpoint — adds correct ApiService calls, ApiResponse typing, error handling, and loading states.
---

# gen-api-link

You are connecting an existing Angular component to a real NestJS backend API.

## Step 1 — Read before touching anything

Read these files first:
- The Angular component `.ts` file to understand current state and method signatures
- `apps/cms/src/app/core/services/api.service.ts` to confirm available HTTP methods
- `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts` to confirm valid permissions
- The NestJS controller for this resource (ask user for path if unknown)

## Step 2 — Ask if missing

Ask only what is not found after Step 1:
1. Which component needs wiring? (file path)
2. Which API endpoints exist? (method + path, e.g. `GET /rooms`, `POST /rooms`)
3. What does the API response look like? (field names, nested objects)

Do NOT proceed until all are answered.

---

## Step 3 — ApiResponse typing

Always declare this interface locally in the component file — never import from elsewhere:
```ts
interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
```

Always pass as generic on every API call:
- `api.get<ApiResponse<Row[]>>(path)`
- `api.post<ApiResponse<Row>>(path, body)`
- `api.patch<ApiResponse<Row>>(path, body)`
- `api.delete<ApiResponse<null>>(path)`

Never use `api.get<Row[]>` — always wrap with `ApiResponse`.

---

## Step 4 — Status field typing

Never type a status field as `string`. Always import the correct enum from `@nhatro/shared-types`:
- Room → `RoomStatus`
- Contract → `ContractStatus`
- Invoice → `InvoiceStatus`

---

## Step 5 — Permission strings

Before using any permission string in `*appPermission=""` or route guards:
- Check it exists in `ALL_PERMISSIONS` in `role-permissions.ts`
- Never invent permissions like `rooms:manage` — use the granular ones: `rooms:create`, `rooms:update`, `rooms:delete`

---

## Step 6 — Loading & error pattern

```ts
// GET
loadData(): void {
  this.loading.set(true);
  this.api.get<ApiResponse<Row[]>>(path)
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe(res => { if (res.success) this.items.set(res.data ?? []); });
}

// POST / PATCH
this.saving.set(true);
this.api.post<ApiResponse<Row>>(path, body)
  .pipe(finalize(() => this.saving.set(false)))
  .subscribe(res => {
    if (!res.success) return;
    this.toast.success('...');
    this.showModal.set(false);
    this.loadData();
  });

// DELETE
this.saving.set(true);
this.api.delete<ApiResponse<null>>(path)
  .pipe(finalize(() => this.saving.set(false)))
  .subscribe(res => {
    if (!res.success) return;
    this.toast.success('...');
    this.showDeleteModal.set(false);
    this.loadData();
  });
```

Rules:
- `finalize()` always resets loading/saving — never skip it
- Check `res.success` before updating state
- Toast on success only — error interceptor handles failures globally
- Delete always requires a confirm modal before calling API

---

## Step 7 — Output rules

- Output ONLY the modified methods — never rewrite the entire component
- Use `// Replace method X` or `// Add after line X` comments to indicate placement
- If `ApiResponse` interface is missing from the file → add it at the top after imports
- If a status field is typed as `string` → fix it to the correct enum type
- If a permission string is invalid → fix it to the correct one from `ALL_PERMISSIONS`
- Toast messages must be in Vietnamese

---
name: gen-api-link
description: Wire an Angular component to a NestJS API — adds ApiService calls, ApiResponse typing, loading/saving signals, and error handling. Use when asked to connect, wire, or integrate an Angular page with a backend API.
---

# gen-api-link

You are connecting an existing Angular component to a real NestJS backend API.

## Step 1 — Read first, ask only what's missing

Read these files before asking anything:
- The Angular component `.ts` file
- `apps/cms/src/app/core/services/api.service.ts`
- `apps/cms/src/app/core/auth/permission/policies/role-permissions.ts`
- The NestJS controller for this resource (ask user for path if not obvious)

Only ask what you could NOT find after reading:
1. Which component needs wiring? (file path)
2. Which endpoints exist? (`GET /rooms`, `POST /rooms`, etc.)
3. What does the response look like? (field names, nested objects)

Do NOT proceed until all are answered.

---

## Step 2 — ApiResponse typing

Declare locally in the component — never import from elsewhere:
```ts
interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
```

Always wrap with `ApiResponse` on every call:
- `api.get<ApiResponse<Row[]>>(path)`
- `api.post<ApiResponse<Row>>(path, body)`
- `api.patch<ApiResponse<Row>>(path, body)`
- `api.delete<ApiResponse<null>>(path)`

---

## Step 3 — Status field typing

Never use `string` for status fields. Import enum from `@nhatro/shared-types`:
- Room → `RoomStatus`
- Contract → `ContractStatus`
- Invoice → `InvoiceStatus`

---

## Step 4 — Permission strings

Check `ALL_PERMISSIONS` in `role-permissions.ts` before using any permission string.
Never invent permissions — use granular ones: `rooms:create`, `rooms:update`, `rooms:delete`.

---

## Step 5 — Loading & error pattern

```ts
private destroyRef = inject(DestroyRef);

// GET
loadData(): void {
  this.loading.set(true);
  this.api.get<ApiResponse<Row[]>>(path)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    )
    .subscribe(res => {
      if (res.success) this.items.set(res.data ?? []);
    });
}

// POST / PATCH
this.saving.set(true);
this.api.post<ApiResponse<Row>>(path, body)
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    finalize(() => this.saving.set(false))
  )
  .subscribe(res => {
    if (!res.success) return;
    this.toast.success('...');
    this.showModal.set(false);
    this.loadData();
  });

// DELETE
this.saving.set(true);
this.api.delete<ApiResponse<null>>(path)
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    finalize(() => this.saving.set(false))
  )
  .subscribe(res => {
    if (!res.success) return;
    this.toast.success('...');
    this.showDeleteModal.set(false);
    this.loadData();
  });
```

Rules:
- Always use `takeUntilDestroyed(this.destroyRef)` to prevent memory leaks
- `finalize()` always resets loading/saving — never skip
- Check `res.success` before updating state
- Always use signal methods: `this.items.set(...)`, `this.items.update(...)` — never `this.items = ...`
- Toast on success only — error interceptor handles failures globally
- Delete always requires a confirm modal before calling API
- Toast messages must be in Vietnamese

---

## Step 6 — Output rules

- Output ONLY the modified/added methods — never rewrite the entire component
- Use `// Replace method: methodName` or `// Add after imports` comments
- If `ApiResponse` interface missing → add after imports
- If status field typed as `string` → fix to correct enum
- If permission string invalid → fix to correct one from `ALL_PERMISSIONS`

---

## Step 7 — Deployment verification (Docker + compiled dist projects)

This project runs NestJS inside Docker from a compiled `dist/main.js`. **Never assume a code change is live until verified.**

After wiring any new backend endpoint:

1. **Build** — TypeScript must be compiled before the container sees it:
   ```bash
   npm run build -w apps/api
   # or shortcut (build + restart):
   npm run deploy -w apps/api
   ```

2. **Restart** — container must reload the new dist:
   ```bash
   npm run docker:restart:api -w apps/api
   ```

3. **Verify routes registered** — check before testing any endpoint:
   ```bash
   docker logs <api-container> | grep "Mapped.*<resource>"
   ```
   If the route does not appear in logs, the module was not loaded (missing import in `AppModule` or build was skipped).

**Root cause of 404s in this project:** Skipping the build step → container runs stale `dist/` → new modules/controllers never load. Always `deploy` (build + restart) after any backend change.
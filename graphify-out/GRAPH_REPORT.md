# Graph Report - apps  (2026-08-05)

## Corpus Check
- 135 files · ~117,207 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 975 nodes · 1394 edges · 81 communities (55 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.77)
- Token cost: 175,574 input · 0 output

## Community Hubs (Navigation)
- Contracts Controller API
- Accounts Controller API
- Login & Form Builder UI
- Accounts Management Component
- Frontend API Service
- Contracts List Component
- Data Table Component
- Angular Workspace Config
- Rooms Controller API
- API Runtime Dependencies
- Management Home Component
- API Dev Dependencies
- Angular Build Config
- App Bootstrap & Routing
- Error Pages (404/Unauthorized)
- Contract Detail Component
- Auth Controller API
- Utilities Controller API
- API TypeScript Config
- Filter Panel Component
- Angular Core Dependencies
- RBAC Auth Types & Policy
- Client Storage Services
- Room Charge Dialog & Money Display
- Main Layout Component
- NestJS App Module Bootstrap
- Contracts/Utilities Service Layer
- Permission Directive
- Management Home Toast/Billing
- Rooms List Component
- Angular CLI Dev Tooling
- Accounts Row Types
- Contract Detail Row Types
- Permission-Gated Templates
- Route Guards
- Frontend Auth Service
- Room Charge Dialog Logic
- Search Input Component
- Rooms List Row Types
- Room Status Grid Component
- Utilities Service
- Modal Component
- NestJS CLI Config
- CMS npm Scripts
- Auth Storage Service
- Role Badge Component
- Confirm Dialog Service
- Date Range Picker Component
- Form Field Component
- Click Outside Directive
- Admin Seed Script
- CMS Package Metadata
- Info Card Component
- Error State Component
- Month Picker Component
- App Shell Component
- API Docker Compose Setup
- Loading State Component
- Page Header Component
- Home/Dashboard Templates
- Form Overlay Templates
- Layout Shell Templates
- Angular Common Dep
- Angular Compiler Dep
- Angular Core Dep
- Angular Forms Dep
- Angular Platform-Browser Dep
- Display Component Templates
- Chart.js Dependency
- ng-zorro-antd Dependency
- Shared Types Package Dep
- Prod Environment Config
- CMS README Doc
- Main Layout Template
- Room Charge Dialog Template
- Room Status Grid Template
- Loading State Template
- Search Input Template
- Village Photo Asset
- Brand Logo Asset
- App Bootstrap HTML Shell

## God Nodes (most connected - your core abstractions)
1. `AccountsComponent` - 37 edges
2. `ContractsComponent` - 32 edges
3. `ManagementHomeComponent` - 27 edges
4. `DataTableComponent` - 24 edges
5. `FormBuilderComponent` - 24 edges
6. `AuthService` - 20 edges
7. `ContractDetailComponent` - 20 edges
8. `ContractsService` - 18 edges
9. `ApiService` - 18 edges
10. `AccountsService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `API README (backend intro doc)` --conceptually_related_to--> `API Docker Compose config`  [AMBIGUOUS]
  api/README.md → api/docker-compose.yml
- `RoomsListComponent template` --semantically_similar_to--> `AccountsComponent template`  [INFERRED] [semantically similar]
  cms/src/app/modules/rooms/rooms-list/rooms-list.component.html → cms/src/app/modules/accounts/accounts.component.html
- `DashboardComponent template` --semantically_similar_to--> `TenantHomeComponent template`  [INFERRED] [semantically similar]
  cms/src/app/modules/dashboard/dashboard.component.html → cms/src/app/modules/home/tenant-home/tenant-home.component.html
- `ManagementHomeComponent template` --semantically_similar_to--> `TenantHomeComponent template`  [INFERRED] [semantically similar]
  cms/src/app/modules/home/management-home/management-home.component.html → cms/src/app/modules/home/tenant-home/tenant-home.component.html
- `FormBuilderComponent template` --semantically_similar_to--> `FilterPanelComponent template`  [INFERRED] [semantically similar]
  cms/src/app/shared/components/form/form-builder/form-builder.component.html → cms/src/app/shared/components/form/filter-panel/filter-panel.component.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Permission-directive gated UI actions (appPermission)** — apps_cms_src_app_modules_accounts_accounts_component_view, apps_cms_src_app_modules_contracts_contract_detail_contract_detail_component_view, apps_cms_src_app_modules_contracts_contracts_component_view, apps_cms_src_app_modules_rooms_rooms_list_rooms_list_component_view, apps_cms_src_app_core_auth_permission_directives_permission_directive_permissiondirective [INFERRED 0.85]
- **Canvas-based Chart.js KPI dashboards** — apps_cms_src_app_modules_dashboard_dashboard_component_view, apps_cms_src_app_modules_home_management_home_management_home_component_view, apps_cms_src_app_modules_home_tenant_home_tenant_home_component_view [INFERRED 0.75]
- **Shared generic display/feedback component library** — apps_cms_src_app_shared_components_display_data_table_data_table_component_view, apps_cms_src_app_shared_components_display_info_card_info_card_component_view, apps_cms_src_app_shared_components_feedback_empty_state_empty_state_component_view, apps_cms_src_app_shared_components_feedback_loading_state_loading_state_component_view [INFERRED 0.75]
- **NG-Zorro Modal + Reactive Form Overlay Pattern** — apps_cms_src_app_shared_components_overlay_modal_modal_component, apps_cms_src_app_shared_components_overlay_form_dialog_form_dialog_component, apps_cms_src_app_shared_components_form_form_field_form_field_component [INFERRED 0.80]
- **CMS Main Layout Composition (Shell/Topbar/PageHeader)** — apps_cms_src_app_shared_components_layout_app_shell_app_shell_component, apps_cms_src_app_shared_components_layout_topbar_topbar_component, apps_cms_src_app_shared_components_navigation_page_header_page_header_component [INFERRED 0.70]

## Communities (81 total, 26 thin omitted)

### Community 0 - "Contracts Controller API"
Cohesion: 0.06
Nodes (48): ApiResponse, ContractsController, ok(), requireAdmin(), requireManagement(), roleFromToken(), ApiTags, Body (+40 more)

### Community 1 - "Accounts Controller API"
Cohesion: 0.08
Nodes (22): AccountsController, ApiTags, Body, Controller, Delete, Get, Param, Patch (+14 more)

### Community 2 - "Login & Form Builder UI"
Cohesion: 0.09
Nodes (15): LoginComponent, Component, FormBuilderComponent, Component, Input, Output, DependsOn, FieldOption (+7 more)

### Community 4 - "Frontend API Service"
Cohesion: 0.08
Nodes (10): ApiService, Injectable, ChartMode, DashboardComponent, Component, ViewChild, TenantHomeComponent, Component (+2 more)

### Community 6 - "Data Table Component"
Cohesion: 0.08
Nodes (12): CellContext, DataTableComponent, Component, Input, Output, PageChangeEvent, PaginationConfig, SortEvent (+4 more)

### Community 7 - "Angular Workspace Config"
Cohesion: 0.06
Nodes (30): cli, analytics, packageManager, prefix, projectType, root, schematics, sourceRoot (+22 more)

### Community 8 - "Rooms Controller API"
Cohesion: 0.10
Nodes (17): ApiResponse, ok(), RoomsController, ApiTags, Body, Controller, Delete, Get (+9 more)

### Community 9 - "API Runtime Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, bcryptjs, class-transformer, class-validator, docxtemplater, @nestjs/common, @nestjs/config, @nestjs/core (+21 more)

### Community 10 - "Management Home Component"
Cohesion: 0.10
Nodes (3): ManagementHomeComponent, Component, ViewChild

### Community 11 - "API Dev Dependencies"
Cohesion: 0.08
Nodes (24): devDependencies, prisma, @types/express, @types/multer, @types/node, name, private, scripts (+16 more)

### Community 12 - "Angular Build Config"
Cohesion: 0.09
Nodes (25): build, serve, builder, configurations, defaultConfiguration, options, architect, development (+17 more)

### Community 13 - "App Bootstrap & Routing"
Cohesion: 0.11
Nodes (13): App, appConfig, routes, Component, ErrorHandlerService, Injectable, authInterceptor(), errorInterceptor() (+5 more)

### Community 14 - "Error Pages (404/Unauthorized)"
Cohesion: 0.12
Nodes (10): Page404Component, Component, Component, UnauthorizedComponent, LoadingService, Injectable, TopbarComponent, Component (+2 more)

### Community 16 - "Auth Controller API"
Cohesion: 0.16
Nodes (11): AuthController, ApiTags, Body, Controller, Post, AuthService, Injectable, LoginDto (+3 more)

### Community 17 - "Utilities Controller API"
Cohesion: 0.17
Nodes (10): ApiResponse, ok(), ApiTags, Body, Controller, Get, Param, Patch (+2 more)

### Community 18 - "API TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+10 more)

### Community 19 - "Filter Panel Component"
Cohesion: 0.16
Nodes (9): FilterPanelComponent, Component, Input, Output, FilterConfig, FilterField, FilterFieldType, FilterOption (+1 more)

### Community 20 - "Angular Core Dependencies"
Cohesion: 0.13
Nodes (15): @angular/animations, @angular/cdk, @angular/router, dependencies, @angular/animations, @angular/cdk, @angular/router, @nhatro/shared-auth (+7 more)

### Community 21 - "RBAC Auth Types & Policy"
Cohesion: 0.28
Nodes (6): ALL_PERMISSIONS, Permission, ROLE_PERMISSIONS, RoutePermissionData, PermissionService, Injectable

### Community 22 - "Client Storage Services"
Cohesion: 0.17
Nodes (5): StorageService, Injectable, Theme, ThemeService, Injectable

### Community 23 - "Room Charge Dialog & Money Display"
Cohesion: 0.15
Nodes (8): RoomChargeResult, MoneyDisplayComponent, Component, Input, FormDialogComponent, Component, Input, Output

### Community 24 - "Main Layout Component"
Cohesion: 0.22
Nodes (6): MainLayoutComponent, Component, MenuItem, NAV_ITEMS, FooterComponent, Component

### Community 25 - "NestJS App Module Bootstrap"
Cohesion: 0.19
Nodes (8): AppModule, Module, AccountsModule, Module, AuthModule, Module, Module, UtilitiesModule

### Community 26 - "Contracts/Utilities Service Layer"
Cohesion: 0.18
Nodes (6): RecordDto, PrismaModule, Module, PrismaService, Injectable, Global

### Community 27 - "Permission Directive"
Cohesion: 0.18
Nodes (9): PermissionDirective, Directive, Input, ApiResponse, ContractRoom, ContractRow, ContractTenant, PreviewData (+1 more)

### Community 28 - "Management Home Toast/Billing"
Cohesion: 0.18
Nodes (5): ApiResponse, BillingDay, ReadingInput, ToastService, Injectable

### Community 30 - "Angular CLI Dev Tooling"
Cohesion: 0.18
Nodes (11): @angular/build, @angular/cli, @angular/compiler-cli, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, prettier (+3 more)

### Community 31 - "Accounts Row Types"
Cohesion: 0.22
Nodes (7): AccountsResponse, LandlordRow, RoomRow, TenantInfo, PaginatorComponent, Component, Output

### Community 32 - "Contract Detail Row Types"
Cohesion: 0.22
Nodes (7): ApiResponse, ContractRow, AnyStatus, STATUS_MAP, StatusBadgeComponent, Component, Input

### Community 33 - "Permission-Gated Templates"
Cohesion: 0.28
Nodes (9): LoginComponent template, appPermission structural directive, AccountsComponent template, ContractDetailComponent template, ContractsComponent template, RoomsListComponent template, EmptyStateComponent template, FilterPanelComponent template (+1 more)

### Community 34 - "Route Guards"
Cohesion: 0.33
Nodes (6): authGuard(), defaultAppRouteGuard(), noAuthGuard(), permissionGuard(), AuthLayoutComponent, Component

### Community 36 - "Room Charge Dialog Logic"
Cohesion: 0.28
Nodes (4): MonthlyRoomChargeDialogComponent, Component, Input, Output

### Community 37 - "Search Input Component"
Cohesion: 0.22
Nodes (4): SearchInputComponent, Component, Input, Output

### Community 38 - "Rooms List Row Types"
Cohesion: 0.29
Nodes (6): ApiResponse, RoomRow, TenantInfo, EmptyStateComponent, Component, Input

### Community 39 - "Room Status Grid Component"
Cohesion: 0.25
Nodes (5): RoomStatusGridComponent, STATUS_STYLE, Component, Input, Output

### Community 41 - "Modal Component"
Cohesion: 0.29
Nodes (4): ModalComponent, Component, Input, Output

### Community 42 - "NestJS CLI Config"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 43 - "CMS npm Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 45 - "Role Badge Component"
Cohesion: 0.33
Nodes (4): ROLE_MAP, RoleBadgeComponent, Component, Input

### Community 46 - "Confirm Dialog Service"
Cohesion: 0.40
Nodes (3): ConfirmDialogService, ConfirmOptions, Injectable

### Community 47 - "Date Range Picker Component"
Cohesion: 0.33
Nodes (5): DateRange, DateRangePickerComponent, Component, Input, Output

### Community 48 - "Form Field Component"
Cohesion: 0.33
Nodes (3): FormFieldComponent, Component, Input

### Community 49 - "Click Outside Directive"
Cohesion: 0.33
Nodes (4): ClickOutsideDirective, Directive, Output, HostListener

### Community 50 - "Admin Seed Script"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 51 - "CMS Package Metadata"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 52 - "Info Card Component"
Cohesion: 0.40
Nodes (4): InfoCardComponent, InfoCardConfig, Component, Input

### Community 53 - "Error State Component"
Cohesion: 0.40
Nodes (4): ErrorStateComponent, Component, Input, Output

### Community 54 - "Month Picker Component"
Cohesion: 0.40
Nodes (4): MonthPickerComponent, Component, Input, Output

### Community 55 - "App Shell Component"
Cohesion: 0.40
Nodes (4): AppShellComponent, Component, Input, Output

### Community 56 - "API Docker Compose Setup"
Cohesion: 0.67
Nodes (4): API Docker Compose config, api service (nhatro-api), postgres service (nhatro-postgres), API README (backend intro doc)

### Community 57 - "Loading State Component"
Cohesion: 0.50
Nodes (3): LoadingStateComponent, Component, Input

### Community 58 - "Page Header Component"
Cohesion: 0.50
Nodes (3): PageHeaderComponent, Component, Input

### Community 59 - "Home/Dashboard Templates"
Cohesion: 1.00
Nodes (3): DashboardComponent template, ManagementHomeComponent template, TenantHomeComponent template

### Community 60 - "Form Overlay Templates"
Cohesion: 0.67
Nodes (3): FormFieldComponent Template, FormDialogComponent Template, ModalComponent Template

### Community 61 - "Layout Shell Templates"
Cohesion: 0.67
Nodes (3): AppShellComponent Template, TopbarComponent Template, PageHeaderComponent Template

## Ambiguous Edges - Review These
- `API README (backend intro doc)` → `API Docker Compose config`  [AMBIGUOUS]
  api/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **190 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `API README (backend intro doc)` and `API Docker Compose config`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AccountsComponent` connect `Accounts Management Component` to `Accounts Row Types`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `ApiService` connect `Frontend API Service` to `Contract Detail Row Types`, `Rooms List Row Types`, `RBAC Auth Types & Policy`, `Permission Directive`, `Management Home Toast/Billing`, `Accounts Row Types`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `ContractsComponent` connect `Contracts List Component` to `Permission Directive`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contracts Controller API` be split into smaller, more focused modules?**
  _Cohesion score 0.05693693693693694 - nodes in this community are weakly interconnected._
- **Should `Accounts Controller API` be split into smaller, more focused modules?**
  _Cohesion score 0.07591836734693877 - nodes in this community are weakly interconnected._
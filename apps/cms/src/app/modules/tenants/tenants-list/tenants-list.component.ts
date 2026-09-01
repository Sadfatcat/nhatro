import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig, TableAction } from '../../../shared/components/display/data-table/data-table.model';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { FormBuilderComponent } from '../../../shared/components/form/form-builder/form-builder.component';
import { FormSchema } from '../../../shared/components/form/form-builder/form-schema.model';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { PermissionService } from '../../../core/permission/services/permission.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

type TenantRow = {
  tenantId:   string;
  fullName:   string;
  phone:      string | null;
  roomNumber: string | null;
  price:      number | null;
} & Record<string, unknown>;

interface TenantDetail {
  id:                   string;
  fullName:             string;
  phone:                string | null;
  email:                string | null;
  dateOfBirth:           string | null;
  hometown:             string | null;
  nationalId:           string | null;
  tenantIdDate:         string | null;
  nationalIdIssuePlace: string | null;
}

@Component({
  selector:        'app-tenants-list',
  standalone:      true,
  templateUrl:     './tenants-list.component.html',
  styleUrls:       ['./tenants-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule, NzModalModule,
    DataTableComponent, MoneyDisplayComponent, FormBuilderComponent, PermissionDirective,
  ],
})
export class TenantsListComponent implements OnInit {
  @ViewChild('roomTpl',  { static: true }) roomTpl!:  TemplateRef<unknown>;
  @ViewChild('priceTpl', { static: true }) priceTpl!: TemplateRef<unknown>;

  private api         = inject(ApiService);
  private toast       = inject(ToastService);
  private permissions = inject(PermissionService);

  readonly today = new Date();

  loading      = signal(false);
  saving       = signal(false);
  items        = signal<TenantRow[]>([]);
  showCreateModal = signal(false);
  showEditModal = signal(false);
  editInitialValues = signal<Record<string, unknown> | null>(null);
  showDeleteModal = signal(false);
  selected     = signal<TenantRow | null>(null);

  filterSearch      = signal('');
  filterSearchValue = '';

  filteredItems = computed(() => {
    const search = this.filterSearch().trim().toLowerCase();
    if (!search) return this.items();
    return this.items().filter(t =>
      t.fullName.toLowerCase().includes(search) ||
      (t.phone ?? '').toLowerCase().includes(search) ||
      (t.roomNumber ?? '').toLowerCase().includes(search)
    );
  });

  editSchema: FormSchema = {
    submitLabel: 'Lưu thay đổi',
    fields: [
      { key: 'fullName',             type: 'text',  label: 'Họ tên',              validation: { required: true } },
      { key: 'phone',                type: 'tel',   label: 'Số điện thoại',       span: 12 },
      { key: 'email',                type: 'email', label: 'Email',               span: 12, validation: { email: true }, hint: 'Dùng để nhận thông báo hoá đơn qua email.' },
      { key: 'dateOfBirth',          type: 'date', label: 'Ngày sinh',           span: 12 },
      { key: 'hometown',             type: 'text', label: 'Quê quán' },
      { key: 'nationalId',           type: 'text', label: 'Số CCCD',             span: 12 },
      { key: 'tenantIdDate',         type: 'text', label: 'Ngày cấp CCCD',       span: 12 },
      { key: 'nationalIdIssuePlace', type: 'text', label: 'Nơi cấp CCCD' },
    ],
  };

  createSchema: FormSchema = {
    submitLabel: 'Thêm người thuê',
    fields: [
      { key: 'fullName',             type: 'text',  label: 'Họ tên',              validation: { required: true } },
      { key: 'phone',                type: 'tel',   label: 'Số điện thoại',       span: 12 },
      { key: 'email',                type: 'email', label: 'Email',               span: 12, validation: { email: true }, hint: 'Dùng để nhận thông báo hoá đơn qua email.' },
      { key: 'dateOfBirth',          type: 'date', label: 'Ngày sinh',           span: 12 },
      { key: 'hometown',             type: 'text', label: 'Quê quán' },
      { key: 'nationalId',           type: 'text', label: 'Số CCCD',             span: 12 },
      { key: 'tenantIdDate',         type: 'text', label: 'Ngày cấp CCCD',       span: 12 },
      { key: 'nationalIdIssuePlace', type: 'text', label: 'Nơi cấp CCCD' },
    ],
  };

  ngOnInit(): void { this.loadData(); }

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { roomNumber: this.roomTpl, price: this.priceTpl };
  }

  get tableConfig(): TableConfig<TenantRow> {
    return {
      rowKey:    'tenantId',
      data:      this.filteredItems(),
      loading:   this.loading(),
      emptyText: 'Chưa có người thuê nào.',
      columns: [
        { key: 'fullName',   label: 'Tên' },
        { key: 'phone',      label: 'Số điện thoại' },
        { key: 'roomNumber', label: 'Phòng đang thuê' },
        { key: 'price',      label: 'Giá', align: 'right' },
      ],
      actions: this.rowActions,
    };
  }

  get rowActions(): TableAction<TenantRow>[] {
    return [
      { label: 'Cập nhật', icon: 'edit',   visible: () => this.permissions.hasPermission('tenants:update'), action: row => this.openEdit(row) },
      { label: 'Xoá',      icon: 'delete', color: 'danger', visible: () => this.permissions.hasPermission('tenants:delete'), action: row => this.openDelete(row) },
    ];
  }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<{ tenantId: string; fullName: string; phone: string | null; rooms: { roomNumber: string; price: number }[] }[]>>('/tenants')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.items.set(res.data.map(t => ({
          tenantId:   t.tenantId,
          fullName:   t.fullName,
          phone:      t.phone,
          roomNumber: t.rooms.length ? t.rooms.map(r => r.roomNumber).join(', ') : 'Không thuê phòng',
          price:      t.rooms.length ? t.rooms.reduce((sum, r) => sum + r.price, 0) : null,
        })));
      });
  }

  onCreate(value: Record<string, unknown>): void {
    this.saving.set(true);
    this.api.post<ApiResponse<unknown>>('/tenants', value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã thêm người thuê mới.');
        this.showCreateModal.set(false);
        this.loadData();
      });
  }

  openEdit(row: TenantRow): void {
    this.selected.set(row);
    this.saving.set(true);
    this.api.get<ApiResponse<TenantDetail>>(`/tenants/${row.tenantId}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        const d = res.data;
        this.editInitialValues.set({
          fullName:             d.fullName,
          phone:                d.phone,
          email:                d.email,
          dateOfBirth:          d.dateOfBirth,
          hometown:             d.hometown,
          nationalId:           d.nationalId,
          tenantIdDate:         d.tenantIdDate,
          nationalIdIssuePlace: d.nationalIdIssuePlace,
        });
        this.showEditModal.set(true);
      });
  }

  onEdit(value: Record<string, unknown>): void {
    const id = this.selected()?.tenantId;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/tenants/${id}`, value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã cập nhật thông tin người thuê.');
        this.showEditModal.set(false);
        this.loadData();
      });
  }

  openDelete(row: TenantRow): void {
    this.selected.set(row);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selected()?.tenantId;
    this.saving.set(true);
    this.api.delete<ApiResponse<null>>(`/tenants/${id}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã xoá người thuê.');
          this.showDeleteModal.set(false);
          this.loadData();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Không xoá được người thuê.');
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { PaginatorComponent } from '../../../shared/components/navigation/paginator/paginator.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { EmptyStateComponent } from '../../../shared/components/feedback/empty-state/empty-state.component';
import { FormBuilderComponent } from '../../../shared/components/form/form-builder/form-builder.component';
import { PermissionDirective } from '../../../core/auth/permission/directives/permission.directive';
import { FormSchema } from '../../../shared/components/form/form-builder/form-schema.model';
import { RoomStatus } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

const PAGE_SIZE = 10;

interface TenantInfo {
  tenantId:  string;
  fullName:  string;
  phone:     string | null;
}

interface RoomRow {
  roomId:     string;
  roomNumber: string;
  floor:      number;
  price:      number;
  status:     RoomStatus;
  tenant:     TenantInfo | null;
}

@Component({
  selector:        'app-rooms-list',
  standalone:      true,
  templateUrl:     './rooms-list.component.html',
  styleUrls:       ['./rooms-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzSelectModule, NzInputModule, NzButtonModule, NzIconModule, NzModalModule,
    PaginatorComponent, StatusBadgeComponent,
    MoneyDisplayComponent, EmptyStateComponent, FormBuilderComponent, PermissionDirective,
  ],
})
export class RoomsListComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  readonly PAGE_SIZE = PAGE_SIZE;

  // State
  loading = signal(false);
  saving  = signal(false);
  items   = signal<RoomRow[]>([]);

  // Filters
  filterSearch  = signal('');
  filterFloor   = signal<number | null>(null);
  filterStatus  = signal<string | null>(null);
  filterSort    = signal<'room-desc' | 'room-asc' | 'price-asc' | 'price-desc'>('room-desc');

  // Mirror props for nz-select ngModel
  filterSearchValue = '';
  filterFloorValue:  number | null = null;
  filterStatusValue: string | null = null;
  filterSortValue:   string = 'room-desc';

  // Pagination
  page = signal(1);

  // Modals
  showCreateModal = signal(false);
  showEditModal   = signal(false);
  showDeleteModal = signal(false);
  selectedItem    = signal<RoomRow | null>(null);

  // Edit schema — chỉ cho sửa status và price
  editSchema: FormSchema = {
    submitLabel: 'Lưu thay đổi',
    fields: [
      { key: 'roomNumber', type: 'text',   label: 'Số phòng',   disabled: true },
      { key: 'floor',      type: 'number', label: 'Tầng',       disabled: true, span: 12 },
      { key: 'price',      type: 'number', label: 'Giá thuê',   validation: { required: true, min: 0 }, span: 12 },
      {
        key: 'status', type: 'select', label: 'Trạng thái', validation: { required: true },
        options: [
          { label: 'Còn trống', value: 'AVAILABLE' },
          { label: 'Đang thuê', value: 'OCCUPIED' },
          { label: 'Bảo trì',   value: 'MAINTENANCE' },
        ],
      },
    ],
  };

  // Computed
  floorOptions = computed(() => {
    const floors = [...new Set(this.items().map(r => r.floor))].sort((a, b) => a - b);
    return floors.map(f => ({ label: `Tầng ${f}`, value: f }));
  });

  filteredItems = computed(() => {
    let rows     = this.items();
    const search = this.filterSearch().toLowerCase();
    const floor  = this.filterFloor();
    const status = this.filterStatus();
    const sort   = this.filterSort();
    if (search) rows = rows.filter(r => r.roomNumber.toLowerCase().includes(search));
    if (floor  !== null) rows = rows.filter(r => r.floor  === floor);
    if (status !== null) rows = rows.filter(r => r.status === status);
    rows = [...rows].sort((a, b) => {
      if (sort === 'room-asc')   return a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true });
      if (sort === 'room-desc')  return b.roomNumber.localeCompare(a.roomNumber, 'vi', { numeric: true });
      if (sort === 'price-asc')  return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return 0;
    });
    return rows;
  });

  pagedItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredItems().slice(start, start + PAGE_SIZE);
  });

  // Form schemas
  createSchema: FormSchema = {
    submitLabel: 'Thêm phòng',
    fields: [
      { key: 'roomNumber', type: 'text', label: 'Số phòng', placeholder: '101', addonBefore: 'P-', validation: { required: true } },
      { key: 'floor',      type: 'number', label: 'Tầng',     validation: { required: true, min: 1 }, span: 12 },
      { key: 'price',      type: 'number', label: 'Giá thuê', validation: { required: true, min: 0 }, span: 12 },
      {
        key: 'status', type: 'select', label: 'Trạng thái', validation: { required: true },
        options: [
          { label: 'Còn trống', value: 'AVAILABLE' },
          { label: 'Đang thuê', value: 'OCCUPIED' },
          { label: 'Bảo trì',   value: 'MAINTENANCE' },
        ],
      },
    ],
  };

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<RoomRow[]>>('/rooms').pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success) this.items.set(res.data ?? []); });
  }

  onSearchChange(value: string): void {
    this.filterSearch.set(value);
    this.page.set(1);
  }

  onFloorChange(value: number | null): void {
    this.filterFloor.set(value);
    this.page.set(1);
  }

  onStatusChange(value: string | null): void {
    this.filterStatus.set(value);
    this.page.set(1);
  }

  onCreate(value: Record<string, unknown>): void {
    this.saving.set(true);
    this.api.post<ApiResponse<RoomRow>>('/rooms', value).pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Thêm phòng thành công');
        this.showCreateModal.set(false);
        this.loadData();
      });
  }

  editInitialValues = signal<Record<string, unknown> | null>(null);

  openEdit(item: RoomRow): void {
    this.selectedItem.set(item);
    this.editInitialValues.set({
      roomNumber: item.roomNumber,
      floor:      item.floor,
      price:      item.price,
      status:     item.status,
    });
    this.showEditModal.set(true);
  }

  onEdit(value: Record<string, unknown>): void {
    const id = this.selectedItem()?.roomId;
    this.saving.set(true);
    this.api.patch<ApiResponse<RoomRow>>(`/rooms/${id}`, value).pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Cập nhật phòng thành công');
        this.showEditModal.set(false);
        this.loadData();
      });
  }

  onDelete(item: RoomRow): void {
    this.selectedItem.set(item);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selectedItem()?.roomId;
    this.saving.set(true);
    this.api.delete<ApiResponse<null>>(`/rooms/${id}`).pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Xoá phòng thành công');
        this.showDeleteModal.set(false);
        this.loadData();
      });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { PaginatorComponent } from '../../../shared/components/navigation/paginator/paginator.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { EmptyStateComponent } from '../../../shared/components/feedback/empty-state/empty-state.component';
import { FormBuilderComponent } from '../../../shared/components/form/form-builder/form-builder.component';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { FormSchema } from '../../../shared/components/form/form-builder/form-schema.model';
import { RoomStatus } from '@nhatro/shared-types';
import { LayoutService } from '../../../core/services/layout.service';

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

interface TenantOption {
  tenantId:   string;
  fullName:   string;
  roomNumber: string | null;
}

@Component({
  selector:        'app-rooms-list',
  standalone:      true,
  templateUrl:     './rooms-list.component.html',
  styleUrls:       ['./rooms-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzSelectModule, NzInputModule, NzButtonModule, NzIconModule, NzModalModule, NzTooltipModule,
    PaginatorComponent, StatusBadgeComponent,
    MoneyDisplayComponent, EmptyStateComponent, FormBuilderComponent, PermissionDirective,
  ],
})
export class RoomsListComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  layout = inject(LayoutService);

  readonly PAGE_SIZE = PAGE_SIZE;

  // State
  readonly today = new Date();

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
  showCreateModal   = signal(false);
  showEditModal     = signal(false);
  showPasswordModal = signal(false);
  showAssignModal   = signal(false);
  showDeleteModal   = signal(false);
  selectedItem      = signal<RoomRow | null>(null);
  newPassword       = '';

  // Xoá phòng — đếm ngược 10s trước khi cho bấm xoá
  readonly DELETE_COUNTDOWN_SECONDS = 10;
  deleteCountdown = signal(this.DELETE_COUNTDOWN_SECONDS);
  private deleteCountdownTimer: ReturnType<typeof setInterval> | null = null;

  // Cung cấp phòng
  assignRoomId   = signal<string | null>(null);
  assignTenantId = signal<string | null>(null);
  tenantOptions  = signal<TenantOption[]>([]);
  vacantRooms    = computed(() => this.items().filter(r => r.status === 'AVAILABLE'));

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

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.subscribe(params => {
      if (params.has('assign')) {
        this.openAssignModal();
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });
  }

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

  openPasswordModal(item: RoomRow): void {
    this.selectedItem.set(item);
    this.newPassword = '';
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.newPassword = '';
  }

  confirmChangePassword(): void {
    const id = this.selectedItem()?.roomId;
    if (!id || this.newPassword.length < 6) {
      this.toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    this.saving.set(true);
    this.api.patch<ApiResponse<null>>(`/rooms/${id}/password`, { password: this.newPassword })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã đổi mật khẩu phòng.');
        this.closePasswordModal();
      });
  }

  // ── Cung cấp phòng ─────────────────────────────────────────────────────────
  openAssignModal(): void {
    this.assignRoomId.set(null);
    this.assignTenantId.set(null);
    this.showAssignModal.set(true);
    this.api.get<ApiResponse<{ tenantId: string; fullName: string; rooms: { roomNumber: string }[] }[]>>('/tenants')
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.tenantOptions.set(res.data.map(t => ({
          tenantId:   t.tenantId,
          fullName:   t.fullName,
          roomNumber: t.rooms.length ? t.rooms.map(r => r.roomNumber).join(', ') : null,
        })));
      });
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }

  confirmAssignRoom(): void {
    const roomId   = this.assignRoomId();
    const tenantId = this.assignTenantId();
    if (!roomId || !tenantId) return;
    this.saving.set(true);
    this.api.post<ApiResponse<unknown>>('/contracts', {
      roomId,
      tenantId,
      startDate: new Date().toISOString().slice(0, 10),
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  res => {
          if (!res.success) return;
          this.toast.success('Đã cung cấp phòng thành công.');
          this.closeAssignModal();
          this.loadData();
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không cung cấp được phòng.'),
      });
  }

  // ── Xoá phòng ────────────────────────────────────────────────────────────
  openDelete(row: RoomRow): void {
    this.selectedItem.set(row);
    this.showDeleteModal.set(true);
    this.deleteCountdown.set(this.DELETE_COUNTDOWN_SECONDS);
    this.deleteCountdownTimer = setInterval(() => {
      const next = this.deleteCountdown() - 1;
      this.deleteCountdown.set(next);
      if (next <= 0 && this.deleteCountdownTimer) {
        clearInterval(this.deleteCountdownTimer);
        this.deleteCountdownTimer = null;
      }
    }, 1000);
  }

  closeDelete(): void {
    this.showDeleteModal.set(false);
    if (this.deleteCountdownTimer) {
      clearInterval(this.deleteCountdownTimer);
      this.deleteCountdownTimer = null;
    }
  }

  confirmDelete(): void {
    const id = this.selectedItem()?.roomId;
    if (!id || this.deleteCountdown() > 0) return;
    this.saving.set(true);
    this.api.delete<ApiResponse<null>>(`/rooms/${id}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã xoá phòng.');
          this.closeDelete();
          this.loadData();
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không xoá được phòng.'),
      });
  }

  ngOnDestroy(): void {
    if (this.deleteCountdownTimer) clearInterval(this.deleteCountdownTimer);
  }
}

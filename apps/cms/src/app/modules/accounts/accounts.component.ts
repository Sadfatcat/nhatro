import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../shared/components/display/money-display/money-display.component';
import { PaginatorComponent } from '../../shared/components/navigation/paginator/paginator.component';
import { PermissionDirective } from '../../core/auth/permission/directives/permission.directive';

const PAGE_SIZE = 10;

interface TenantInfo {
  tenantId:     string;
  userId:       string;
  fullName:     string;
  phone:        string | null;
  dateOfBirth:  string | null;
  hometown:     string | null;
  nationalId:   string | null;
  tenantIdDate: string | null;
  username:     string | null;
  email:        string;
  isActive:     boolean;
}

interface RoomRow {
  roomId:     string;
  roomNumber: string;
  floor:      number;
  price:      number;
  status:     string;
  tenant:     TenantInfo | null;
}

interface LandlordRow {
  userId:     string;
  landlordId: string | null;
  username:   string;
  fullName:   string;
  phone:      string | null;
  isActive:   boolean;
  createdAt:  string;
  roomCount:  number;
  role:       'LANDLORD' | 'ADMIN';
}

interface AccountsResponse { rooms: RoomRow[]; landlords: LandlordRow[]; }

@Component({
  selector:        'app-accounts',
  standalone:      true,
  templateUrl:     './accounts.component.html',
  styleUrls:       ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule, PermissionDirective,
    NzIconModule, NzInputModule, NzInputNumberModule,
    NzModalModule, NzSelectModule, NzTableModule, NzTabsModule, NzTagModule, NzTooltipModule,
    MoneyDisplayComponent, PaginatorComponent,
  ],
})
export class AccountsComponent implements OnInit {
  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  // ── Core state ─────────────────────────────────────────────────────────────
  loading   = signal(false);
  saving    = signal(false);
  activeTab = signal(0);
  allRooms     = signal<RoomRow[]>([]);
  landlords = signal<LandlordRow[]>([]);

  // ── Filters ────────────────────────────────────────────────────────────────
  filterFloor  = signal<number | null>(null);
  filterSort   = signal<'asc' | 'desc'>('asc');
  filterStatus = signal<string | null>(null);
  filterSearch = signal('');

  // Plain props for ngModel two-way binding (nz-select can't bind signals directly)
  filterFloorValue:  number | null = null;
  filterStatusValue: string | null = null;
  filterSortValue:   'asc' | 'desc' = 'asc';
  filterSearchValue = '';

  floorOptions = computed(() => {
    const floors = [...new Set(this.allRooms().map(r => r.floor))].sort((a, b) => a - b);
    return floors.map(f => ({ label: `Tầng ${f}`, value: f }));
  });

  filteredRooms = computed(() => {
    let rows = this.allRooms();
    const floor  = this.filterFloor();
    const status = this.filterStatus();
    const q      = this.filterSearch().toLowerCase();
    if (floor  !== null) rows = rows.filter(r => r.floor  === floor);
    if (status !== null) rows = rows.filter(r => r.status === status);
    if (q) rows = rows.filter(r =>
      r.roomNumber.toLowerCase().includes(q) ||
      (r.tenant?.fullName.toLowerCase().includes(q) ?? false),
    );
    rows = [...rows].sort((a, b) =>
      this.filterSort() === 'asc'
        ? a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true })
        : b.roomNumber.localeCompare(a.roomNumber, 'vi', { numeric: true }),
    );
    return rows;
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  roomPage = signal(1);
  pagedRooms = computed(() => {
    const start = (this.roomPage() - 1) * PAGE_SIZE;
    return this.filteredRooms().slice(start, start + PAGE_SIZE);
  });

  // ── Selected room ──────────────────────────────────────────────────────────
  selectedRoom = signal<RoomRow | null>(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  createAccountModal = signal(false);
  assignRoomModal    = signal(false);
  tenantInfoModal    = signal(false);
  priceModal         = signal(false);
  statusModal        = signal(false);
  landlordModal      = signal(false);
  changeRoleModal    = signal(false);
  selectedLandlord   = signal<LandlordRow | null>(null);
  newRole: 'LANDLORD' | 'ADMIN' = 'LANDLORD';
  deleteModal        = signal(false);
  changePasswordModal = signal(false);

  // ── Form: Đổi mật khẩu ────────────────────────────────────────────────────
  changePasswordForm = { userId: '', newPassword: '' };

  // ── Form: Tạo tài khoản phòng ──────────────────────────────────────────────
  createAccountForm = { roomId: '', username: '', password: '' };
  availableRooms    = computed(() =>
    this.allRooms()
      .filter(r => !r.tenant)
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }))
  );

  // ── Form: Cấp phòng ────────────────────────────────────────────────────────
  assignRoomForm = {
    roomId: '', username: '', password: '',
    fullName: '', phone: '', dateOfBirth: '', hometown: '', nationalId: '', tenantIdDate: '',
  };

  // ── Form: Thông tin người thuê ─────────────────────────────────────────────
  tenantForm = { fullName: '', phone: '', dateOfBirth: '', hometown: '', nationalId: '', tenantIdDate: '' };

  // ── Giá / trạng thái ───────────────────────────────────────────────────────
  newPrice  = 0;
  newStatus = 'AVAILABLE';

  priceFormatter = (v: number) => v ? v.toLocaleString('vi-VN') : '';
  priceParser    = (v: string) => Number(v.replace(/\D/g, ''));

  // ── Landlord ───────────────────────────────────────────────────────────────
  landlordForm = { username: '', password: '', fullName: '', phone: '' };

  constructor() { this.load(); }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('accounts/landlords')) this.activeTab.set(1);
    else this.activeTab.set(0);
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    const path = index === 1 ? '/app/accounts/landlords' : '/app/accounts/rooms';
    this.router.navigate([path]);
  }

  load(): void {
    this.loading.set(true);
    this.api.get<AccountsResponse>('/accounts')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  data => { this.allRooms.set(data.rooms); this.landlords.set(data.landlords); this.roomPage.set(1); },
        error: ()   => this.toast.error('Không tải được danh sách tài khoản.'),
      });
  }

  resetFilters(): void {
    this.filterFloor.set(null);
    this.filterStatus.set(null);
    this.filterSort.set('asc');
    this.filterSearch.set('');
    this.filterFloorValue  = null;
    this.filterStatusValue = null;
    this.filterSortValue   = 'asc';
    this.filterSearchValue = '';
    this.roomPage.set(1);
  }

  // ── Tạo tài khoản phòng ────────────────────────────────────────────────────
  openCreateAccountModal(): void {
    this.createAccountForm = { roomId: '', username: '', password: '' };
    this.createAccountModal.set(true);
  }
  closeCreateAccountModal(): void { this.createAccountModal.set(false); }

  submitCreateAccount(): void {
    const { roomId, username, password } = this.createAccountForm;
    if (!roomId || !username || !password) { this.toast.error('Vui lòng điền đầy đủ thông tin.'); return; }
    this.saving.set(true);
    this.api.post('/accounts/rooms', { roomId, username, password, fullName: username })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã tạo tài khoản.'); this.closeCreateAccountModal(); this.load(); },
        error: () => this.toast.error('Không tạo được tài khoản.'),
      });
  }

  // ── Cấp phòng (assign) ────────────────────────────────────────────────────
  openAssignRoomModal(): void {
    this.assignRoomForm = { roomId: '', username: '', password: '', fullName: '', phone: '', dateOfBirth: '', hometown: '', nationalId: '', tenantIdDate: '' };
    this.assignRoomModal.set(true);
  }
  closeAssignRoomModal(): void { this.assignRoomModal.set(false); }

  submitAssignRoom(): void {
    const f = this.assignRoomForm;
    if (!f.roomId || !f.username || !f.password || !f.fullName) { this.toast.error('Vui lòng điền các trường bắt buộc.'); return; }
    this.saving.set(true);
    this.api.post('/accounts/rooms', {
      roomId:      f.roomId,
      username:    f.username,
      password:    f.password,
      fullName:    f.fullName,
      phone:        f.phone        || undefined,
      dateOfBirth:  f.dateOfBirth  || undefined,
      hometown:     f.hometown     || undefined,
      nationalId:   f.nationalId   || undefined,
      tenantIdDate: f.tenantIdDate || undefined,
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cấp phòng thành công.'); this.closeAssignRoomModal(); this.load(); },
        error: () => this.toast.error('Không cấp phòng được.'),
      });
  }

  // ── Thông tin người thuê ──────────────────────────────────────────────────
  openTenantInfoModal(row: RoomRow): void {
    this.selectedRoom.set(row);
    const t = row.tenant!;
    this.tenantForm = {
      fullName:     t.fullName,
      phone:        t.phone        ?? '',
      dateOfBirth:  t.dateOfBirth  ? t.dateOfBirth.slice(0, 10) : '',
      hometown:     t.hometown     ?? '',
      nationalId:   t.nationalId   ?? '',
      tenantIdDate: t.tenantIdDate ?? '',
    };
    this.tenantInfoModal.set(true);
  }
  closeTenantInfoModal(): void { this.tenantInfoModal.set(false); this.selectedRoom.set(null); }

  saveTenantInfo(): void {
    const room = this.selectedRoom();
    if (!room) return;
    this.saving.set(true);
    this.api.patch(`/accounts/rooms/${room.roomId}/tenant-info`, {
      fullName:     this.tenantForm.fullName     || undefined,
      phone:        this.tenantForm.phone        || undefined,
      dateOfBirth:  this.tenantForm.dateOfBirth  || null,
      hometown:     this.tenantForm.hometown     || null,
      nationalId:   this.tenantForm.nationalId   || null,
      tenantIdDate: this.tenantForm.tenantIdDate || null,
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật thông tin.'); this.closeTenantInfoModal(); this.load(); },
        error: () => this.toast.error('Không cập nhật được.'),
      });
  }

  // ── Giá ───────────────────────────────────────────────────────────────────
  openPriceModal(row: RoomRow): void { this.selectedRoom.set(row); this.newPrice = row.price; this.priceModal.set(true); }
  closePriceModal(): void { this.priceModal.set(false); this.selectedRoom.set(null); }

  updatePrice(): void {
    const room = this.selectedRoom();
    if (!room) return;
    this.saving.set(true);
    this.api.patch(`/accounts/rooms/${room.roomId}/price`, { price: this.newPrice })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật giá.'); this.closePriceModal(); this.load(); },
        error: () => this.toast.error('Không cập nhật được giá.'),
      });
  }

  // ── Trạng thái ────────────────────────────────────────────────────────────
  openStatusModal(row: RoomRow): void { this.selectedRoom.set(row); this.newStatus = row.status; this.statusModal.set(true); }
  closeStatusModal(): void { this.statusModal.set(false); this.selectedRoom.set(null); }

  updateStatus(): void {
    const room = this.selectedRoom();
    if (!room) return;
    this.saving.set(true);
    this.api.patch(`/accounts/rooms/${room.roomId}/status`, { status: this.newStatus })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật trạng thái.'); this.closeStatusModal(); this.load(); },
        error: () => this.toast.error('Không cập nhật được.'),
      });
  }

  // ── Chủ nhà ───────────────────────────────────────────────────────────────
  openLandlordModal(): void { this.landlordForm = { username: '', password: '', fullName: '', phone: '' }; this.landlordModal.set(true); }
  closeLandlordModal(): void { this.landlordModal.set(false); }

  createLandlordAccount(): void {
    this.saving.set(true);
    this.api.post('/accounts/landlords', this.landlordForm)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã tạo tài khoản chủ nhà.'); this.closeLandlordModal(); this.load(); },
        error: () => this.toast.error('Không tạo được tài khoản chủ nhà.'),
      });
  }

  // ── Xoá người thuê ────────────────────────────────────────────────────────
  openDeleteModal(row: RoomRow): void { this.selectedRoom.set(row); this.deleteModal.set(true); }
  closeDeleteModal(): void { this.deleteModal.set(false); this.selectedRoom.set(null); }

  confirmDeleteTenant(): void {
    const tenantId = this.selectedRoom()?.tenant?.tenantId;
    if (!tenantId) return;
    this.saving.set(true);
    this.api.delete(`/accounts/tenants/${tenantId}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã xoá tài khoản người thuê.'); this.closeDeleteModal(); this.load(); },
        error: () => this.toast.error('Không xoá được tài khoản.'),
      });
  }

  // ── Đổi vai trò ──────────────────────────────────────────────────────────
  openChangeRoleModal(row: LandlordRow): void {
    this.selectedLandlord.set(row);
    this.newRole = row.role === 'ADMIN' ? 'LANDLORD' : 'ADMIN';
    this.changeRoleModal.set(true);
  }
  closeChangeRoleModal(): void { this.changeRoleModal.set(false); this.selectedLandlord.set(null); }

  submitChangeRole(): void {
    const user = this.selectedLandlord();
    if (!user) return;
    this.saving.set(true);
    this.api.patch(`/accounts/users/${user.userId}/role`, { role: this.newRole })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật vai trò.'); this.closeChangeRoleModal(); this.load(); },
        error: () => this.toast.error('Không đổi được vai trò.'),
      });
  }

  // ── Đổi mật khẩu ─────────────────────────────────────────────────────────
  openChangePasswordModal(row: RoomRow): void {
    this.changePasswordForm = { userId: row.tenant?.userId ?? '', newPassword: '' };
    this.changePasswordModal.set(true);
  }

  openChangePasswordForUser(userId: string): void {
    this.changePasswordForm = { userId, newPassword: '' };
    this.changePasswordModal.set(true);
  }
  closeChangePasswordModal(): void { this.changePasswordModal.set(false); }

  submitChangePassword(): void {
    const { userId, newPassword } = this.changePasswordForm;
    if (!userId || !newPassword) { this.toast.error('Vui lòng nhập mật khẩu mới.'); return; }
    this.saving.set(true);
    this.api.patch(`/accounts/users/${userId}/password`, { password: newPassword })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã đổi mật khẩu thành công.'); this.closeChangePasswordModal(); },
        error: () => this.toast.error('Không đổi được mật khẩu.'),
      });
  }
}

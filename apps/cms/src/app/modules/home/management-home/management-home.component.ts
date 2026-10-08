import {
  AfterViewInit, Component,
  computed, ElementRef, inject, OnInit, signal, ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { filter, finalize, switchMap } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/feedback/confirm-dialog/confirm-dialog.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/auth.types';
import { ApiResponse, RoomWithUtility, UtilityReading } from '@nhatro/shared-types';
import { LayoutService } from '../../../core/services/layout.service';
import { MonthPickerComponent } from '../../../shared/components/form/month-picker/month-picker.component';
import { currentBillingPeriod, monthKeyDirect, periodToDate } from '../../../shared/utils/billing-period';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

type ReadingInput = { currElec: number; currWater: number };

@Component({
  selector:        'app-management-home',
  standalone:  true,
  templateUrl: './management-home.component.html',
  styleUrls:   ['./management-home.component.scss'],
  providers:   [ConfirmDialogService], // needs the NzModalService provided by NzModalModule below
  imports:     [CommonModule, DatePipe, FormsModule, NzIconModule, NzInputModule, NzInputNumberModule, NzModalModule, NzDividerModule, NzButtonModule, MonthPickerComponent],
})
export class ManagementHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef<HTMLCanvasElement>;

  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  readonly auth  = inject(AuthService);
  layout = inject(LayoutService);

  readonly isAdmin = computed(() => this.auth.hasRole(UserRole.ADMIN));

  goToTenantHome(): void {
    this.router.navigateByUrl('/app/home');
  }

  readonly today        = new Date();

  // ── State ─────────────────────────────────────────────────────────────────
  loading = signal(false);
  saving  = signal(false);
  rooms   = signal<RoomWithUtility[]>([]);

  // ── Invoice stats placeholder ─────────────────────────────────────────────
  pendingAmount = signal(0);

  // ── Utility prices ────────────────────────────────────────────────────────
  prices          = signal({ electricityPerKwh: 3500, waterPerM3: 30000 });
  editPrices      = signal(false);
  draftElecPrice  = signal(3500);
  draftWaterPrice = signal(30000);

  openPriceEdit(): void {
    this.draftElecPrice.set(this.prices().electricityPerKwh);
    this.draftWaterPrice.set(this.prices().waterPerM3);
    this.editPrices.set(true);
  }

  savePrices(): void {
    this.prices.set({ electricityPerKwh: this.draftElecPrice(), waterPerM3: this.draftWaterPrice() });
    this.editPrices.set(false);
  }

  // ── Room stats ────────────────────────────────────────────────────────────
  totalRooms       = computed(() => this.rooms().length);
  occupiedCount    = computed(() => this.rooms().filter(r => r.status === 'OCCUPIED').length);
  availableCount   = computed(() => this.rooms().filter(r => r.status === 'AVAILABLE').length);
  maintenanceCount = computed(() => this.rooms().filter(r => r.status === 'MAINTENANCE').length);
  occupancyRate    = computed(() =>
    this.totalRooms() ? Math.round(this.occupiedCount() / this.totalRooms() * 100) : 0
  );

  // ── Closing list — rooms waiting to be chốt ───────────────────────────────
  private compareRoomNumber = (a: RoomWithUtility, b: RoomWithUtility) =>
    a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true });

  closingRooms = computed(() =>
    this.rooms().filter(r => r.inClosingList && r.status === 'OCCUPIED').sort(this.compareRoomNumber));

  roomsWithoutReadingCount = computed(() => this.closingRooms().filter(r => !this.isChot(r.roomId)).length);
  canCompleteClosing       = computed(() => this.closingRooms().length > 0 && this.roomsWithoutReadingCount() === 0);

  readonly PAGE_SIZE = 5;
  page       = signal(1);
  totalPages = computed(() => Math.ceil(this.closingRooms().length / this.PAGE_SIZE));
  roomsOnPage = computed(() =>
    this.closingRooms().slice((this.page() - 1) * this.PAGE_SIZE, this.page() * this.PAGE_SIZE));

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages(), p + 1)); }

  // ── Add-room modal ────────────────────────────────────────────────────────
  showAddModal    = signal(false);
  addSearchQuery  = signal('');
  selectedRoomIds = signal<Set<string>>(new Set());

  addSearchValue = ''; // mirror for ngModel

  availableRooms = computed(() => {
    if (!this.showAddModal()) return [];
    const query = this.addSearchQuery().toLowerCase();
    return this.rooms()
      .filter(r =>
        r.status === 'OCCUPIED' &&
        !r.inClosingList &&
        (query === '' || r.roomNumber.toLowerCase().includes(query))
      )
      .sort(this.compareRoomNumber);
  });

  openAddModal(): void {
    this.selectedRoomIds.set(new Set());
    this.addSearchQuery.set('');
    this.addSearchValue = '';
    this.showAddModal.set(true);
  }

  toggleRoomSelect(roomId: string): void {
    this.selectedRoomIds.update(set => {
      const n = new Set(set);
      n.has(roomId) ? n.delete(roomId) : n.add(roomId);
      return n;
    });
  }

  isRoomSelected(roomId: string): boolean {
    return this.selectedRoomIds().has(roomId);
  }

  isAllSelected = computed(() => {
    const rooms = this.availableRooms();
    return rooms.length > 0 && rooms.every(r => this.selectedRoomIds().has(r.roomId));
  });

  toggleSelectAll(): void {
    const rooms = this.availableRooms();
    if (this.isAllSelected()) {
      this.selectedRoomIds.set(new Set());
    } else {
      this.selectedRoomIds.set(new Set(rooms.map(r => r.roomId)));
    }
  }

  confirmAddToClosingList(): void {
    const ids = [...this.selectedRoomIds()];
    if (ids.length === 0) return;
    this.updateClosingList(ids, true, () => this.showAddModal.set(false));
  }

  removeFromClosingList(roomId: string): void {
    this.updateClosingList([roomId], false);
  }

  private updateClosingList(roomIds: string[], add: boolean, onDone?: () => void): void {
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>('/utilities/closing-list', { roomIds, add })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          onDone?.();
          this.loadData(true);
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không cập nhật được danh sách phòng cần chốt.'),
      });
  }

  completeClosing(): void {
    const roomCount = this.closingRooms().length;
    this.confirmDialog.confirm({
      title:   `Hoàn tất chốt ${roomCount} phòng?`,
      content: 'Hoá đơn của các phòng này sẽ được gom thành một đợt trong "Xem chốt theo ngày" và danh sách chốt được làm trống.',
      okText:  'Hoàn tất chốt',
    }).pipe(
      filter(confirmed => confirmed),
      switchMap(() => {
        this.saving.set(true);
        return this.api.post<ApiResponse<unknown>>('/closing-batches', {}).pipe(finalize(() => this.saving.set(false)));
      }),
    ).subscribe({
      next: res => {
        if (!res.success) return;
        this.toast.success(`Đã hoàn tất chốt ${roomCount} phòng.`);
        this.loadData();
      },
      error: err => this.toast.error(err?.error?.message ?? 'Không hoàn tất chốt được.'),
    });
  }

  // ── Reading modal ─────────────────────────────────────────────────────────
  activeModalRoomId = signal<string | null>(null);
  activeModalMonth  = signal<Date>(new Date());
  activeModalPrev   = signal<{ prevElec: number; prevWater: number }>({ prevElec: 0, prevWater: 0 });
  modalLoading      = signal(false);
  inputMap          = signal<Map<string, ReadingInput>>(new Map());

  activeModalRoom = computed(() => {
    const id = this.activeModalRoomId();
    return id ? this.rooms().find(r => r.roomId === id) ?? null : null;
  });

  isChot(roomId: string): boolean {
    const room = this.rooms().find(r => r.roomId === roomId);
    if (!room?.utilityRecord) return false;
    return room.utilityRecord.billingMonth === currentBillingPeriod(new Date());
  }

  openModal(roomId: string): void {
    const currentPeriodDate = periodToDate(currentBillingPeriod(new Date()));
    this.activeModalMonth.set(currentPeriodDate);
    this.activeModalRoomId.set(roomId);
    this.loadReadingForMonth(roomId, currentPeriodDate);
  }

  closeModal(): void { this.activeModalRoomId.set(null); }

  onModalMonthChange(month: Date | null): void {
    const roomId = this.activeModalRoomId();
    if (!roomId || !month) return;
    this.activeModalMonth.set(month);
    this.loadReadingForMonth(roomId, month);
  }

  private loadReadingForMonth(roomId: string, month: Date): void {
    this.modalLoading.set(true);
    this.api.get<ApiResponse<{ utilityRecord: UtilityReading | null }>>(`/utilities/${roomId}`, { month: monthKeyDirect(month) })
      .pipe(finalize(() => this.modalLoading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        const rec = res.data.utilityRecord;
        this.inputMap.update(m => {
          const n = new Map(m);
          n.set(roomId, { currElec: rec?.currElec ?? 0, currWater: rec?.currWater ?? 0 });
          return n;
        });
        this.activeModalPrev.set({ prevElec: rec?.prevElec ?? 0, prevWater: rec?.prevWater ?? 0 });
      });
  }

  getInput(roomId: string): ReadingInput {
    return this.inputMap().get(roomId) ?? { currElec: 0, currWater: 0 };
  }

  patchInput(roomId: string, patch: Partial<ReadingInput>): void {
    this.inputMap.update(m => {
      const n = new Map(m); n.set(roomId, { ...this.getInput(roomId), ...patch }); return n;
    });
  }

  saveReading(): void {
    const roomId = this.activeModalRoomId();
    if (!roomId) return;
    const inp = this.getInput(roomId);
    this.saving.set(true);
    this.api.post<ApiResponse<unknown>>(`/utilities/${roomId}/record`, {
      currElec:     inp.currElec,
      currWater:    inp.currWater,
      billingMonth: monthKeyDirect(this.activeModalMonth()),
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã chốt số điện nước.');
          this.closeModal();
          this.loadData(true);
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không lưu được chỉ số.'),
      });
  }

  elecUsed  = computed(() => {
    const id = this.activeModalRoomId(); if (!id) return 0;
    const inp = this.getInput(id);
    return Math.max(0, inp.currElec - this.activeModalPrev().prevElec);
  });
  waterUsed = computed(() => {
    const id = this.activeModalRoomId(); if (!id) return 0;
    const inp = this.getInput(id);
    return Math.max(0, inp.currWater - this.activeModalPrev().prevWater);
  });
  elecAmount  = computed(() => this.elecUsed()  * this.prices().electricityPerKwh);
  waterAmount = computed(() => this.waterUsed() * this.prices().waterPerM3);

  // ── Reading helpers ───────────────────────────────────────────────────────
  latestReadings = computed(() => {
    const map = new Map<string, RoomWithUtility>();
    this.rooms().forEach(r => { if (r.utilityRecord) map.set(r.roomId, r); });
    return map;
  });

  chotReadingOf(roomId: string) {
    const room = this.rooms().find(r => r.roomId === roomId);
    if (!room?.utilityRecord) return null;
    const key = currentBillingPeriod(new Date());
    return room.utilityRecord.billingMonth === key ? room.utilityRecord : null;
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    this.api.get<ApiResponse<{ pendingAmount: number }>>('/invoices/stats/dashboard')
      .subscribe(res => {
        if (res.success && res.data) this.pendingAmount.set(res.data.pendingAmount);
      });
  }

  loadData(keepPage = false): void {
    this.loading.set(true);
    this.api.get<ApiResponse<RoomWithUtility[]>>('/utilities')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.rooms.set(res.data);
        this.page.set(keepPage ? Math.min(this.page(), this.totalPages() || 1) : 1);
        this.rebuildDonut();
      });
  }

  // ── Chart ─────────────────────────────────────────────────────────────────
  private donutChart: Chart | null = null;

  private rebuildDonut(): void {
    if (!this.donutChart) return;
    this.donutChart.data.datasets[0].data = [this.occupiedCount(), this.availableCount(), this.maintenanceCount()];
    this.donutChart.update();
  }

  ngAfterViewInit(): void {
    this.donutChart = new Chart(this.donutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Đang thuê', 'Phòng trống', 'Bảo trì'],
        datasets: [{
          data:            [this.occupiedCount(), this.availableCount(), this.maintenanceCount()],
          backgroundColor: ['#16898F', '#A2BFD5', '#ba1a1a'],
          borderWidth:     3,
          borderColor:     '#fff8f4',
          hoverOffset:     6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} phòng` } },
        },
      },
    });

    // Chart.js can capture a stale container width when the mobile app-shell
    // layout (100dvh flex + internal scroll) settles a frame after view init.
    requestAnimationFrame(() => this.donutChart?.resize());
  }
}

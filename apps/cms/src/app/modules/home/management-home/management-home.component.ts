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
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/auth.types';
import { RoomWithUtility } from '@nhatro/shared-types';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
type BillingDay = 15 | 30;
type ReadingInput = { prevElec: number; currElec: number; prevWater: number; currWater: number };

@Component({
  selector:        'app-management-home',
  standalone:  true,
  templateUrl: './management-home.component.html',
  styleUrls:   ['./management-home.component.scss'],
  imports:     [CommonModule, DatePipe, FormsModule, NzIconModule, NzInputModule, NzInputNumberModule, NzModalModule, NzDividerModule, NzButtonModule],
})
export class ManagementHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef<HTMLCanvasElement>;

  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  readonly auth  = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.hasRole(UserRole.ADMIN));

  goToTenantHome(): void {
    this.router.navigateByUrl('/app/home');
  }

  readonly today        = new Date();
  readonly billingDays: BillingDay[] = [15, 30];

  // ── State ─────────────────────────────────────────────────────────────────
  loading = signal(false);
  saving  = signal(false);
  rooms   = signal<RoomWithUtility[]>([]);

  // ── Invoice stats placeholder ─────────────────────────────────────────────
  pendingAmount = signal(0);

  // ── Utility prices ────────────────────────────────────────────────────────
  prices          = signal({ electricityPerKwh: 4000, waterPerM3: 15000 });
  editPrices      = signal(false);
  draftElecPrice  = signal(4000);
  draftWaterPrice = signal(15000);

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

  // ── Kanban — grouped by billingDay from real data ─────────────────────────
  private toNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
  private sortRooms = (a: RoomWithUtility, b: RoomWithUtility) => this.toNum(a.roomNumber) - this.toNum(b.roomNumber);

  rooms15 = computed(() => this.rooms().filter(r => r.billingDay === 15 && r.status === 'OCCUPIED').sort(this.sortRooms));
  rooms30 = computed(() => this.rooms().filter(r => r.billingDay === 30 && r.status === 'OCCUPIED').sort(this.sortRooms));

  rooms15Ids = signal<string[]>([]);
  rooms30Ids = signal<string[]>([]);

  readonly PAGE_SIZE = 5;
  page15 = signal(1);
  page30 = signal(1);

  totalPages15 = computed(() => Math.ceil(this.rooms15().length / this.PAGE_SIZE));
  totalPages30 = computed(() => Math.ceil(this.rooms30().length / this.PAGE_SIZE));

  roomsForDay(day: BillingDay): RoomWithUtility[] {
    const rooms = day === 15 ? this.rooms15() : this.rooms30();
    const page  = day === 15 ? this.page15()  : this.page30();
    return rooms.slice((page - 1) * this.PAGE_SIZE, page * this.PAGE_SIZE);
  }

  prevPage(day: BillingDay): void {
    if (day === 15) this.page15.update(p => Math.max(1, p - 1));
    else            this.page30.update(p => Math.max(1, p - 1));
  }

  nextPage(day: BillingDay): void {
    const total = day === 15 ? this.totalPages15() : this.totalPages30();
    if (day === 15) this.page15.update(p => Math.min(total, p + 1));
    else            this.page30.update(p => Math.min(total, p + 1));
  }

  // ── Add-room modal ────────────────────────────────────────────────────────
  showAddModal    = signal<BillingDay | null>(null);
  addSearchQuery  = signal('');
  selectedRoomIds = signal<Set<string>>(new Set());

  addSearchValue = ''; // mirror for ngModel

  availableRooms = computed(() => {
    const day = this.showAddModal();
    if (!day) return [];
    const taken = [...this.rooms15Ids(), ...this.rooms30Ids()];
    const query = this.addSearchQuery().toLowerCase();
    return this.rooms()
      .filter(r =>
        r.status === 'OCCUPIED' &&
        !taken.includes(r.roomId) &&
        (query === '' || r.roomNumber.toLowerCase().includes(query))
      )
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }));
  });

  openAddModal(day: BillingDay): void {
    this.selectedRoomIds.set(new Set());
    this.addSearchQuery.set('');
    this.addSearchValue = '';
    this.showAddModal.set(day);
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

  confirmAddToDay(): void {
    const day = this.showAddModal();
    const ids = [...this.selectedRoomIds()];
    if (!day || ids.length === 0) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>('/utilities/bulk/billing-day', { roomIds: ids, billingDay: day })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.showAddModal.set(null);
        this.loadData();
      });
  }

  removeFromDay(roomId: string): void {
    this.rooms15Ids.update(ids => ids.filter(id => id !== roomId));
    this.rooms30Ids.update(ids => ids.filter(id => id !== roomId));
    const room = this.rooms().find(r => r.roomId === roomId);
    if (room?.status === 'OCCUPIED') {
      this.api.patch<ApiResponse<unknown>>(`/utilities/${roomId}/billing-day`, { billingDay: 0 }).subscribe();
    }
  }


  // ── Reading modal ─────────────────────────────────────────────────────────
  activeModalRoomId = signal<string | null>(null);
  inputMap          = signal<Map<string, ReadingInput>>(new Map());

  activeModalRoom = computed(() => {
    const id = this.activeModalRoomId();
    return id ? this.rooms().find(r => r.roomId === id) ?? null : null;
  });

  isChot(roomId: string): boolean {
    const room = this.rooms().find(r => r.roomId === roomId);
    if (!room?.utilityRecord) return false;
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return room.utilityRecord.billingMonth === key;
  }

  openModal(roomId: string): void {
    const room = this.rooms().find(r => r.roomId === roomId);
    const rec  = room?.utilityRecord;
    const init: ReadingInput = rec
      ? { prevElec: rec.currElec, currElec: rec.currElec, prevWater: rec.currWater, currWater: rec.currWater }
      : { prevElec: 0, currElec: 0, prevWater: 0, currWater: 0 };
    this.inputMap.update(m => { const n = new Map(m); n.set(roomId, init); return n; });
    this.activeModalRoomId.set(roomId);
  }

  closeModal(): void { this.activeModalRoomId.set(null); }

  getInput(roomId: string): ReadingInput {
    return this.inputMap().get(roomId) ?? { prevElec: 0, currElec: 0, prevWater: 0, currWater: 0 };
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
    this.api.post<ApiResponse<unknown>>(`/utilities/${roomId}/record`, inp)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã chốt số điện nước.');
        this.closeModal();
        this.loadData(true);
      });
  }

  elecUsed  = computed(() => {
    const id = this.activeModalRoomId(); if (!id) return 0;
    const inp = this.getInput(id);
    return Math.max(0, inp.currElec - inp.prevElec);
  });
  waterUsed = computed(() => {
    const id = this.activeModalRoomId(); if (!id) return 0;
    const inp = this.getInput(id);
    return Math.max(0, inp.currWater - inp.prevWater);
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
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return room.utilityRecord.billingMonth === key ? room.utilityRecord : null;
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadData(); }

  loadData(keepPage = false): void {
    const savedPage15 = this.page15();
    const savedPage30 = this.page30();
    this.loading.set(true);
    this.api.get<ApiResponse<RoomWithUtility[]>>('/utilities')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.rooms.set(res.data);
        const toNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
        const sort = (a: RoomWithUtility, b: RoomWithUtility) => toNum(a.roomNumber) - toNum(b.roomNumber);
        this.rooms15Ids.set(res.data.filter(r => r.billingDay === 15 && r.status === 'OCCUPIED').sort(sort).map(r => r.roomId));
        this.rooms30Ids.set(res.data.filter(r => r.billingDay === 30 && r.status === 'OCCUPIED').sort(sort).map(r => r.roomId));
        if (keepPage) {
          this.page15.set(Math.min(savedPage15, this.totalPages15() || 1));
          this.page30.set(Math.min(savedPage30, this.totalPages30() || 1));
        } else {
          this.page15.set(1);
          this.page30.set(1);
        }
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
  }
}

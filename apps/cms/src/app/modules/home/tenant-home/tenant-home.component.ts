import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/auth.types';
import { RoomWithUtility, Invoice, UtilityHistoryPoint } from '@nhatro/shared-types';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

Chart.register(...registerables);

@Component({
  selector:        'app-tenant-home',
  standalone:      true,
  templateUrl:     './tenant-home.component.html',
  styleUrls:       ['./tenant-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, DatePipe, StatusBadgeComponent, MoneyDisplayComponent],
})
export class TenantHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('elecChart')  elecChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waterChart') waterChartRef!: ElementRef<HTMLCanvasElement>;

  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly today   = new Date();
  readonly isAdmin = computed(() => this.auth.hasRole(UserRole.ADMIN));

  goToManagementHome(): void {
    this.router.navigateByUrl('/app/management-home');
  }

  loading  = signal(false);
  roomData = signal<RoomWithUtility | null>(null);

  get roomId(): string { return this.auth.currentUser()?.roomId ?? ''; }

  room          = computed(() => this.roomData());
  utilityRecord = computed(() => this.roomData()?.utilityRecord ?? null);

  elecPrev   = computed(() => this.utilityRecord()?.prevElec  ?? 0);
  elecCurr   = computed(() => this.utilityRecord()?.currElec  ?? 0);
  elecUsed   = computed(() => Math.max(0, this.elecCurr() - this.elecPrev()));
  elecAmount  = computed(() => this.elecUsed() * 3500);

  waterPrev  = computed(() => this.utilityRecord()?.prevWater ?? 0);
  waterCurr  = computed(() => this.utilityRecord()?.currWater ?? 0);
  waterUsed  = computed(() => Math.max(0, this.waterCurr() - this.waterPrev()));
  waterAmount = computed(() => this.waterUsed() * 30000);

  lastUpdated = computed(() =>
    this.utilityRecord()?.recordedAt ? new Date(this.utilityRecord()!.recordedAt) : null
  );

  // ── Invoices ──────────────────────────────────────────────────────────────
  invoicesLoading = signal(false);
  invoices        = signal<Invoice[]>([]);

  goToInvoice(id: string): void {
    this.router.navigateByUrl(`/app/invoices/${id}`);
  }

  private loadInvoices(): void {
    this.invoicesLoading.set(true);
    this.api.get<ApiResponse<Invoice[]>>('/invoices', { roomId: this.roomId })
      .pipe(finalize(() => this.invoicesLoading.set(false)))
      .subscribe(res => { if (res.success && res.data) this.invoices.set(res.data); });
  }

  ngOnInit(): void {
    if (!this.roomId) return;
    this.loading.set(true);
    this.api.get<ApiResponse<RoomWithUtility>>(`/utilities/${this.roomId}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success && res.data) this.roomData.set(res.data); });
    this.loadInvoices();
    this.loadHistory();
  }

  private loadHistory(): void {
    this.api.get<ApiResponse<UtilityHistoryPoint[]>>(`/utilities/${this.roomId}/history`, { months: 6 })
      .subscribe(res => { if (res.success && res.data) this.applyHistory(res.data); });
  }

  private elecChartInstance:  Chart | null = null;
  private waterChartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    const empty = Array(6).fill(0);

    this.elecChartInstance = new Chart(this.elecChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: empty.map(() => ''),
        datasets: [{ label: 'kWh', data: empty, backgroundColor: 'rgba(22,137,143,0.25)', borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { right: 28 } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} kWh` } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });

    this.waterChartInstance = new Chart(this.waterChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: empty.map(() => ''),
        datasets: [{ label: 'm³', data: empty, backgroundColor: 'rgba(67,95,114,0.25)', borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { right: 28 } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} m³` } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });

    // Chart.js's ResizeObserver can capture a stale container width when the
    // mobile app-shell layout (100dvh flex + internal scroll) settles a frame
    // after view init — force a resize once layout is final.
    requestAnimationFrame(() => {
      this.elecChartInstance?.resize();
      this.waterChartInstance?.resize();
    });
  }

  private applyHistory(history: UtilityHistoryPoint[]): void {
    const labels  = history.map(h => `T${Number(h.billingMonth.split('-')[1])}`);
    const lastIdx = history.length - 1;

    if (this.elecChartInstance) {
      this.elecChartInstance.data.labels = labels;
      this.elecChartInstance.data.datasets[0].data = history.map(h => h.elecUsed);
      this.elecChartInstance.data.datasets[0].backgroundColor =
        history.map((_, i) => i === lastIdx ? '#16898F' : 'rgba(22,137,143,0.25)');
      this.elecChartInstance.update();
    }
    if (this.waterChartInstance) {
      this.waterChartInstance.data.labels = labels;
      this.waterChartInstance.data.datasets[0].data = history.map(h => h.waterUsed);
      this.waterChartInstance.data.datasets[0].backgroundColor =
        history.map((_, i) => i === lastIdx ? '#435f72' : 'rgba(67,95,114,0.25)');
      this.waterChartInstance.update();
    }
  }

  ngOnDestroy(): void {
    this.elecChartInstance?.destroy();
    this.waterChartInstance?.destroy();
  }
}

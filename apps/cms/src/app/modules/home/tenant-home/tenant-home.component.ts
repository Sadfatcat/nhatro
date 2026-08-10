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
import { RoomWithUtility, Invoice } from '@nhatro/shared-types';
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
  elecAmount  = computed(() => this.elecUsed() * 4000);

  waterPrev  = computed(() => this.utilityRecord()?.prevWater ?? 0);
  waterCurr  = computed(() => this.utilityRecord()?.currWater ?? 0);
  waterUsed  = computed(() => Math.max(0, this.waterCurr() - this.waterPrev()));
  waterAmount = computed(() => this.waterUsed() * 15000);

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
  }

  private elecChartInstance:  Chart | null = null;
  private waterChartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    const labels = this.monthLabels();
    const empty  = Array(6).fill(0);

    this.elecChartInstance = new Chart(this.elecChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'kWh', data: empty, backgroundColor: empty.map((_, i) => i === 5 ? '#16898F' : 'rgba(22,137,143,0.25)'), borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} kWh` } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });

    this.waterChartInstance = new Chart(this.waterChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'm³', data: empty, backgroundColor: empty.map((_, i) => i === 5 ? '#435f72' : 'rgba(67,95,114,0.25)'), borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} m³` } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });
  }

  ngOnDestroy(): void {
    this.elecChartInstance?.destroy();
    this.waterChartInstance?.destroy();
  }

  private monthLabels(): string[] {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return `T${d.getMonth() + 1}`;
    });
  }
}

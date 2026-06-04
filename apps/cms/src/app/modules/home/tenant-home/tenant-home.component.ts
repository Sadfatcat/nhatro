import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  computed, ElementRef, inject, OnInit, signal, ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { RoomWithUtility } from '@nhatro/shared-types';

Chart.register(...registerables);

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

@Component({
  selector:        'app-tenant-home',
  standalone:      true,
  templateUrl:     './tenant-home.component.html',
  styleUrls:       ['./tenant-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, DatePipe],
})
export class TenantHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('elecChart')  elecChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waterChart') waterChartRef!: ElementRef<HTMLCanvasElement>;

  private api  = inject(ApiService);
  private auth = inject(AuthService);

  readonly today = new Date();

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

  ngOnInit(): void {
    if (!this.roomId) return;
    this.loading.set(true);
    this.api.get<ApiResponse<RoomWithUtility>>(`/utilities/${this.roomId}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success && res.data) this.roomData.set(res.data); });
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

  private monthLabels(): string[] {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return `T${d.getMonth() + 1}`;
    });
  }
}

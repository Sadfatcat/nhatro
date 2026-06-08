import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  computed, ElementRef, inject, OnInit, signal, ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  Chart, DoughnutController, ArcElement,
  LineController, LineElement, PointElement,
  BarController, BarElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
} from 'chart.js';
import { finalize } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { RoomWithUtility } from '@nhatro/shared-types';

Chart.register(
  DoughnutController, ArcElement,
  LineController, LineElement, PointElement,
  BarController, BarElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
);

type ChartMode = 'month' | 'quarter' | 'year';

@Component({
  selector:        'app-dashboard',
  standalone:      true,
  templateUrl:     './dashboard.component.html',
  styleUrls:       ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, RouterModule, NzIconModule, NzTagModule],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('incomeChart')     incomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('roomStatusChart') donutRef!:       ElementRef<HTMLCanvasElement>;
  @ViewChild('sparkline')       sparklineRef!:   ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);

  readonly today = new Date();

  loading = signal(false);
  rooms   = signal<RoomWithUtility[]>([]);

  // ── Room stats ─────────────────────────────────────────────────────────────
  totalRooms       = computed(() => this.rooms().length);
  occupiedCount    = computed(() => this.rooms().filter(r => r.status === 'OCCUPIED').length);
  availableCount   = computed(() => this.rooms().filter(r => r.status === 'AVAILABLE').length);
  maintenanceCount = computed(() => this.rooms().filter(r => r.status === 'MAINTENANCE').length);
  occupancyRate    = computed(() => this.totalRooms() ? Math.round(this.occupiedCount()    / this.totalRooms() * 100) : 0);
  availableRate    = computed(() => this.totalRooms() ? Math.round(this.availableCount()   / this.totalRooms() * 100) : 0);
  maintenanceRate  = computed(() => this.totalRooms() ? Math.round(this.maintenanceCount() / this.totalRooms() * 100) : 0);

  // ── Invoice stats — placeholder until invoice API is ready ────────────────
  currentMonthIncome = signal(0);
  prevMonthIncome    = signal(0);
  incomeTrend        = signal<number | null>(null);
  unpaidCount        = signal(0);
  pendingAmount      = signal(0);
  sparklineData      = signal<number[]>(Array(6).fill(0));
  recentInvoices     = signal<unknown[]>([]);

  // ── Charts ─────────────────────────────────────────────────────────────────
  selectedChartMode: ChartMode = 'month';
  readonly chartModes = [
    { value: 'month'   as ChartMode, label: '6 tháng' },
    { value: 'quarter' as ChartMode, label: 'Theo quý' },
    { value: 'year'    as ChartMode, label: 'Theo năm' },
  ];

  private sparklineChart: Chart | null = null;
  private incomeChart:    Chart | null = null;
  private donutChart:     Chart | null = null;

  ngOnInit(): void {
    this.loading.set(true);
    this.api.get<{ success: boolean; data: RoomWithUtility[] | null; message: string }>('/utilities')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.rooms.set(res.data);
        if (this.donutChart) {
          this.donutChart.data.datasets[0].data = [this.occupiedCount(), this.availableCount(), this.maintenanceCount()];
          this.donutChart.update();
        }
      });
  }

  ngAfterViewInit(): void {
    this.buildSparkline();
    this.buildIncomeChart();
    this.buildDonutChart();
  }

  onChartModeChange(): void { this.buildIncomeChart(); }

  private buildSparkline(): void {
    this.sparklineChart?.destroy();
    const data = this.sparklineData();
    this.sparklineChart = new Chart(this.sparklineRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(() => ''),
        datasets: [{
          data,
          backgroundColor: data.map((_, i) => i === data.length - 1 ? '#16898F' : 'rgba(22,137,143,0.22)'),
          borderRadius: 3, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales:  { x: { display: false }, y: { display: false, beginAtZero: true } },
      },
    });
  }

  buildIncomeChart(): void {
    this.incomeChart?.destroy();
    const labels = this.getMonthLabels();
    const empty  = Array(labels.length).fill(0);
    this.incomeChart = new Chart(this.incomeChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Tổng thu',    data: empty, borderColor: '#16898F', backgroundColor: 'rgba(207,245,231,0.3)', fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#16898F', pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 2.5 },
          { label: 'Tiền phòng', data: empty, borderColor: '#00009a', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#00009a', borderWidth: 1.5, borderDash: [4, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 }, usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${(+(ctx.raw as number) / 1_000_000).toFixed(2)}tr đ` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 12 } } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => (+v / 1_000_000).toFixed(0) + 'tr', font: { size: 12 } } },
        },
      },
    });
  }

  buildDonutChart(): void {
    this.donutChart?.destroy();
    this.donutChart = new Chart(this.donutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Đang thuê', 'Phòng trống', 'Bảo trì'],
        datasets: [{
          data:            [this.occupiedCount(), this.availableCount(), this.maintenanceCount()],
          backgroundColor: ['#16898F', '#A2BFD5', '#ba1a1a'],
          borderWidth: 3, borderColor: '#fff8f4', hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw as number} phòng` } },
        },
      },
    });
  }

  private getMonthLabels(): string[] {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return `T${d.getMonth() + 1}`;
    });
  }
}

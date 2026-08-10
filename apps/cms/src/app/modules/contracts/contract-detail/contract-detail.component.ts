import {
  ChangeDetectionStrategy, Component, inject,
  OnDestroy, OnInit, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { finalize } from 'rxjs';
import { ContractStatus } from '@nhatro/shared-types';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

interface ContractRow {
  id: string; roomId: string; tenantId: string;
  startDate: string; endDate: string | null;
  firstBillingDate: number | null; lastBillingDate: number | null;
  deposit: number; status: ContractStatus;
  notes: string | null; createdAt: string; filePath: string | null;
  room:   { roomId: string; roomNumber: string; floor: number; price: number };
  tenant: { tenantId: string; fullName: string; phone: string | null; dateOfBirth: string | null; hometown: string | null; nationalId: string | null; tenantIdDate: string | null };
}

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzButtonModule, NzIconModule, NzModalModule, NzPopconfirmModule,
    NzInputNumberModule, NzSpinModule, NzTagModule, NzTooltipModule,
    MoneyDisplayComponent, StatusBadgeComponent, PermissionDirective,
  ],
})
export class ContractDetailComponent implements OnInit, OnDestroy {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
private api       = inject(ApiService);
  private toast     = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  contract   = signal<ContractRow | null>(null);
  loading    = signal(true);
  saving     = signal(false);
  downloading = signal(false);
  uploading  = signal(false);

  // PDF
  pdfUrl      = signal<SafeResourceUrl | null>(null);
  pdfLoading  = signal(false);
  private _blobUrl: string | null = null;

  // Edit modal
  editModal = signal(false);
  editForm  = { startDate: '', endDate: '', firstBillingDate: 0, lastBillingDate: 0, deposit: 0 };

  // Delete countdown
  deleteCountdown = signal(10);
  deleteArmed     = signal(false);
  deleteCounting  = signal(false);
  private _countdownId: ReturnType<typeof setInterval> | null = null;

  priceFormatter = (v: number) => v ? v.toLocaleString('vi-VN') : '';
  priceParser    = (v: string) => Number(v.replace(/\D/g, ''));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/app/contracts']); return; }
    this.loadContract(id);
  }

  ngOnDestroy(): void {
    this.clearCountdown();
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
  }

  private loadContract(id: string): void {
    this.loading.set(true);
    this.api.get<ApiResponse<ContractRow>>(`/contracts/${id}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          if (!r.data) { this.router.navigate(['/app/contracts']); return; }
          this.contract.set(r.data);
          this.loadPdf(id);
        },
        error: () => { this.toast.error('Không tải được hợp đồng.'); this.router.navigate(['/app/contracts']); },
      });
  }

  loadPdf(contractId: string): void {
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
    this.pdfUrl.set(null);
    this.pdfLoading.set(true);
    this.api.getBlob(`/contracts/${contractId}/download`)
      .pipe(finalize(() => this.pdfLoading.set(false)))
      .subscribe({
        next: blob => { this.applyPdfBlob(blob); },
        error: () => this.toast.error('Không thể tải file hợp đồng.'),
      });
  }

  private applyPdfBlob(blob: Blob): void {
    if (!blob || blob.size === 0) { this.toast.error('File hợp đồng rỗng.'); return; }
    blob.slice(0, 5).text().then(header => {
      if (header !== '%PDF-') { this.toast.error('File hợp đồng không phải PDF hợp lệ.'); return; }
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      this._blobUrl = url;
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }).catch(() => this.toast.error('Không thể tải file hợp đồng.'));
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  openEditModal(): void {
    const c = this.contract();
    if (!c) return;
    this.editForm = {
      startDate:        c.startDate ? c.startDate.slice(0, 10) : '',
      endDate:          c.endDate   ? c.endDate.slice(0, 10)   : '',
      firstBillingDate: c.firstBillingDate ?? 0,
      lastBillingDate:  c.lastBillingDate  ?? 0,
      deposit:          c.deposit,
    };
    this.editModal.set(true);
  }

  submitEdit(): void {
    const id = this.contract()?.id;
    if (!id) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<ContractRow>>(`/contracts/${id}`, {
      startDate:        this.editForm.startDate        || undefined,
      endDate:          this.editForm.endDate          || undefined,
      firstBillingDate: this.editForm.firstBillingDate || undefined,
      lastBillingDate:  this.editForm.lastBillingDate  || undefined,
      deposit:          this.editForm.deposit,
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Đã cập nhật hợp đồng. Đang tạo lại PDF...');
          this.editModal.set(false);
          this.loadContract(id);
        },
        error: () => this.toast.error('Không cập nhật được hợp đồng.'),
      });
  }

  // ── Delete countdown ────────────────────────────────────────────────────────
  startDeleteCountdown(): void {
    this.clearCountdown();
    this.deleteCountdown.set(10);
    this.deleteArmed.set(false);
    this.deleteCounting.set(true);
    this._countdownId = setInterval(() => {
      const curr = this.deleteCountdown();
      if (curr <= 1) { this.clearCountdown(); this.deleteArmed.set(true); this.deleteCounting.set(false); }
      else this.deleteCountdown.set(curr - 1);
    }, 1000);
  }

  private clearCountdown(): void {
    if (this._countdownId !== null) { clearInterval(this._countdownId); this._countdownId = null; }
  }

  confirmDelete(): void {
    const id = this.contract()?.id;
    if (!id || !this.deleteArmed()) return;
    this.saving.set(true);
    this.api.delete<ApiResponse<unknown>>(`/contracts/${id}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => { this.toast.success('Đã xoá hợp đồng.'); this.router.navigate(['/app/contracts']); },
        error: () => this.toast.error('Không xoá được hợp đồng.'),
      });
  }

  // ── Download ────────────────────────────────────────────────────────────────
  downloadPdf(): void {
    const c = this.contract();
    if (!c) return;
    this.downloading.set(true);
    this.api.getBlob(`/contracts/${c.id}/download`)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `hop-dong-phong-${c.room.roomNumber}.pdf`; a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.toast.error('Không thể tải hợp đồng.'),
      });
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  triggerUpload(input: HTMLInputElement): void { input.click(); }

  onFileSelected(event: Event): void {
    const c = this.contract();
    if (!c) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    this.uploading.set(true);
    this.api.postForm<ApiResponse<ContractRow>>(`/contracts/${c.id}/upload`, fd)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: () => { this.toast.success('Đã cập nhật tệp hợp đồng.'); this.loadPdf(c.id); },
        error: () => this.toast.error('Không tải lên được tệp.'),
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  fmtDate(d: string | null | undefined): string {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }

  yearOf(d: string | null | undefined): string {
    return d ? String(new Date(d).getFullYear()) : '—';
  }

  goBack(): void { this.router.navigate(['/app/contracts']); }
}

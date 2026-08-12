import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { finalize } from 'rxjs';
import { ContractStatus, RoomStatus } from '@nhatro/shared-types';
import { AuthService } from '../../core/auth/services/auth.service';
import { PermissionService } from '../../core/permission/services/permission.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../shared/components/display/money-display/money-display.component';
import { StatusBadgeComponent } from '../../shared/components/display/status-badge/status-badge.component';
import { PaginatorComponent } from '../../shared/components/navigation/paginator/paginator.component';
import { PermissionDirective } from '../../core/permission/directives/permission.directive';
import { LayoutService } from '../../core/services/layout.service';

const PAGE_SIZE = 10;

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

interface ContractRoom   { roomId: string; roomNumber: string; floor: number; price: number; }
interface ContractTenant { tenantId: string; fullName: string; phone: string | null; dateOfBirth: string | null; hometown: string | null; nationalId: string | null; }
interface ContractRow {
  id: string; roomId: string; tenantId: string;
  startDate: string;
  deposit: number; status: ContractStatus;
  notes: string | null; createdAt: string;
  filePath: string | null;
  room: ContractRoom; tenant: ContractTenant;
}

interface PreviewData {
  room:     { roomNumber: string; floor: number; price: number };
  tenant:   { fullName: string; phone: string | null; nationalId: string | null; hometown: string | null; dateOfBirth: string | null };
  contract: { startDate: string; deposit: number; notes: string | null };
}

interface RoomOption { roomId: string; roomNumber: string; floor: number; price: number; tenantId: string; }

@Component({
  selector:        'app-contracts',
  standalone:      true,
  templateUrl:     './contracts.component.html',
  styleUrls:       ['./contracts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule, PermissionDirective,
    NzButtonModule, NzIconModule, NzInputModule, NzInputNumberModule,
    NzModalModule, NzPopconfirmModule, NzSelectModule, NzSpinModule, NzTableModule, NzTabsModule, NzTagModule, NzTooltipModule,
    MoneyDisplayComponent, StatusBadgeComponent, PaginatorComponent,
  ],
})
export class ContractsComponent implements OnInit, OnDestroy {
  private auth        = inject(AuthService);
  private api         = inject(ApiService);
  private toast       = inject(ToastService);
  private sanitizer   = inject(DomSanitizer);
  private router      = inject(Router);
  private permissions = inject(PermissionService);
  layout = inject(LayoutService);

  // ── Core state ────────────────────────────────────────────────────────────────
  loading     = signal(false);
  saving      = signal(false);
  downloading = signal(false);
  uploading   = signal(false);

  contracts  = signal<ContractRow[]>([]);
  myContract = signal<ContractRow | null>(null);

  // ── PDF preview ───────────────────────────────────────────────────────────────
  pdfUrl     = signal<SafeResourceUrl | null>(null);
  pdfLoading = signal(false);
  private _blobUrl: string | null = null;

  // ── Tabs (management): active vs ended ────────────────────────────────────────
  activeTab         = signal<0 | 1>(0);
  activeCount       = computed(() => this.contracts().filter(r => r.status === 'ACTIVE').length);
  endedCount        = computed(() => this.contracts().filter(r => r.status !== 'ACTIVE').length);

  onTabChange(i: number): void {
    this.activeTab.set(i === 1 ? 1 : 0);
    this.page.set(1);
  }

  // ── Filters (management) ──────────────────────────────────────────────────────
  filterSearch      = signal('');
  filterSearchValue = '';

  filteredContracts = computed(() => {
    const q = this.filterSearch().toLowerCase();
    let rows = this.contracts().filter(r => this.activeTab() === 1 ? r.status !== 'ACTIVE' : r.status === 'ACTIVE');
    if (q) rows = rows.filter(r => r.room.roomNumber.toLowerCase().includes(q) || r.tenant.fullName.toLowerCase().includes(q));
    return rows;
  });

  page      = signal(1);
  pagedRows = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredContracts().slice(start, start + PAGE_SIZE);
  });

  // ── Rooms for create form ─────────────────────────────────────────────────────
  occupiedRooms = signal<RoomOption[]>([]);

  // ── Modals ────────────────────────────────────────────────────────────────────
  createModal    = signal(false);
  viewModal      = signal(false);
  editModal      = signal(false);
  terminateModal = signal(false);
  selected       = signal<ContractRow | null>(null);

  // ── Create form & preview ─────────────────────────────────────────────────────
  createForm  = { roomId: '', startDate: '', endDate: '', firstBillingDate: 0, lastBillingDate: 0, deposit: 0, notes: '' };
  previewMode = signal(false);
  previewData = signal<PreviewData | null>(null);
  previewing  = signal(false);

  // ── Edit form ─────────────────────────────────────────────────────────────────
  editForm = { startDate: '', deposit: 0, notes: '' };

  // ── Terminate ─────────────────────────────────────────────────────────────────
  terminateStatus: ContractStatus = 'TERMINATED';
  terminateStatusValue: ContractStatus = 'TERMINATED';

  priceFormatter = (v: number) => v ? v.toLocaleString('vi-VN') : '';
  priceParser    = (v: string) => Number(v.replace(/\D/g, ''));

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void {
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
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

  load(): void {
    this.loading.set(true);
    if (this.permissions.hasPermission('contracts:create')) {
      this.api.get<ApiResponse<ContractRow[]>>('/contracts')
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next:  r => { this.contracts.set(r.data ?? []); this.page.set(1); },
          error: () => this.toast.error('Không tải được danh sách hợp đồng.'),
        });
    } else {
      const roomId = this.auth.currentUser()?.roomId;
      if (!roomId) { this.loading.set(false); return; }
      this.api.get<ApiResponse<ContractRow | null>>(`/contracts/room/${roomId}`)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next:  r => { if (r.data) this.router.navigate(['/app/contracts', r.data.id]); else this.loading.set(false); },
          error: () => this.toast.error('Không tải được hợp đồng.'),
        });
    }
  }

  loadOccupiedRooms(): void {
    this.api.get<ApiResponse<Array<{ roomId: string; roomNumber: string; floor: number; price: number; status: RoomStatus; tenant: { tenantId: string } | null }>>>('/rooms')
      .subscribe({
        next: res => {
          if (!res.success || !res.data) return;
          this.occupiedRooms.set(
            res.data.filter(rm => rm.status === 'OCCUPIED' && rm.tenant)
              .map(rm => ({ roomId: rm.roomId, roomNumber: rm.roomNumber, floor: rm.floor, price: rm.price, tenantId: rm.tenant!.tenantId }))
          );
        },
      });
  }

  private tenantIdForRoom(roomId: string): string | undefined {
    return this.occupiedRooms().find(r => r.roomId === roomId)?.tenantId;
  }

  resetFilters(): void {
    this.filterSearch.set('');
    this.filterSearchValue = '';
    this.page.set(1);
  }

  // ── Create ────────────────────────────────────────────────────────────────────
  openCreateModal(): void {
    this.createForm = { roomId: '', startDate: '', endDate: '', firstBillingDate: 0, lastBillingDate: 0, deposit: 0, notes: '' };
    this.previewMode.set(false);
    this.previewData.set(null);
    this.loadOccupiedRooms();
    this.createModal.set(true);
  }

  closeCreateModal(): void {
    this.createModal.set(false);
    this.previewMode.set(false);
    this.previewData.set(null);
  }

  submitPreview(): void {
    if (!this.createForm.roomId || !this.createForm.startDate) {
      this.toast.error('Vui lòng điền phòng và ngày bắt đầu.');
      return;
    }
    this.previewing.set(true);
    this.api.post<ApiResponse<PreviewData>>('/contracts/preview', {
      roomId:           this.createForm.roomId,
      tenantId:         this.tenantIdForRoom(this.createForm.roomId),
      startDate:        this.createForm.startDate,
      endDate:          this.createForm.endDate          || undefined,
      firstBillingDate: this.createForm.firstBillingDate || undefined,
      lastBillingDate:  this.createForm.lastBillingDate  || undefined,
      deposit:          this.createForm.deposit          || 0,
      notes:            this.createForm.notes            || undefined,
    })
      .pipe(finalize(() => this.previewing.set(false)))
      .subscribe({
        next:  r => { this.previewData.set(r.data); this.previewMode.set(true); },
        error: () => this.toast.error('Không thể xem trước hợp đồng.'),
      });
  }

  backToForm(): void { this.previewMode.set(false); }

  confirmCreate(): void {
    this.saving.set(true);
    this.api.post<ApiResponse<unknown>>('/contracts', {
      roomId:           this.createForm.roomId,
      tenantId:         this.tenantIdForRoom(this.createForm.roomId),
      startDate:        this.createForm.startDate,
      endDate:          this.createForm.endDate          || undefined,
      firstBillingDate: this.createForm.firstBillingDate || undefined,
      lastBillingDate:  this.createForm.lastBillingDate  || undefined,
      deposit:          this.createForm.deposit          || 0,
      notes:            this.createForm.notes            || undefined,
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã tạo hợp đồng.'); this.closeCreateModal(); this.load(); },
        error: () => this.toast.error('Không tạo được hợp đồng.'),
      });
  }

  // ── View ──────────────────────────────────────────────────────────────────────
  openViewModal(row: ContractRow): void {
    this.selected.set(row);
    this.loadPdf(row.id);
    this.viewModal.set(true);
  }
  closeViewModal(): void {
    this.viewModal.set(false);
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
    this.pdfUrl.set(null);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────────
  openEditModal(row: ContractRow): void {
    this.selected.set(row);
    this.editForm = { startDate: row.startDate ? row.startDate.slice(0, 10) : '', deposit: row.deposit, notes: row.notes ?? '' };
    this.editModal.set(true);
  }
  closeEditModal(): void { this.editModal.set(false); }

  submitEdit(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/contracts/${id}`, {
      startDate: this.editForm.startDate || undefined,
      deposit:   this.editForm.deposit,
    })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => {
          this.toast.success('Đã cập nhật hợp đồng.');
          this.closeEditModal();
          this.api.get<ApiResponse<ContractRow>>(`/contracts/${id}`).subscribe({
            next: r => { if (r.data) this.selected.set(r.data); },
          });
          this.loadPdf(id);
          this.load();
        },
        error: () => this.toast.error('Không cập nhật được.'),
      });
  }

  // ── Terminate ─────────────────────────────────────────────────────────────────
  openTerminateModal(row: ContractRow): void {
    this.selected.set(row);
    this.terminateStatus = 'TERMINATED';
    this.terminateStatusValue = 'TERMINATED';
    this.terminateModal.set(true);
  }
  closeTerminateModal(): void { this.terminateModal.set(false); }

  submitTerminate(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/contracts/${id}`, { status: this.terminateStatus })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật trạng thái hợp đồng.'); this.closeTerminateModal(); this.load(); },
        error: () => this.toast.error('Không cập nhật được trạng thái.'),
      });
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  confirmDelete(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.saving.set(true);
    this.api.delete<ApiResponse<unknown>>(`/contracts/${id}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã xoá hợp đồng.'); this.closeViewModal(); this.load(); },
        error: () => this.toast.error('Không xoá được hợp đồng.'),
      });
  }

  // ── Download PDF ──────────────────────────────────────────────────────────────
  downloadPdf(contractId: string, roomNumber: string): void {
    this.downloading.set(true);
    this.api.getBlob(`/contracts/${contractId}/download`)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href = url; a.download = `hop-dong-phong-${roomNumber}.pdf`; a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.toast.error('Không thể tải hợp đồng.'),
      });
  }

  // ── Upload DOCX ───────────────────────────────────────────────────────────────
  triggerUpload(input: HTMLInputElement): void { input.click(); }

  onFileSelected(event: Event, contractId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    this.uploading.set(true);
    this.api.postForm<ApiResponse<ContractRow>>(`/contracts/${contractId}/upload`, fd)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: r => {
          this.toast.success('Đã cập nhật tệp hợp đồng.');
          if (r.data) this.selected.set(r.data);
          this.load();
        },
        error: () => this.toast.error('Không tải lên được tệp.'),
      });
  }

  // ── Display helpers ───────────────────────────────────────────────────────────
  fmtDate(d: string | null | undefined): string {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }

  yearOf(d: string | null | undefined): string {
    if (!d) return '............';
    return String(new Date(d).getFullYear());
  }
}

import { Component } from '@angular/core';

@Component({
  selector:   'app-landlords',
  standalone: true,
  styles: ['.p{display:flex;flex-direction:column;gap:16px;padding:24px 32px;max-width:1500px;margin:0 auto}'],
  template: `
    <div class="p">
      <div class="page-header-container">
        <nav class="breadcrumb"><span class="crumb-active">Chủ trọ</span></nav>
        <div class="page-header">
          <div>
            <h1>Quản lý chủ trọ</h1>
            <p>Danh sách chủ trọ trong hệ thống.</p>
          </div>
        </div>
      </div>
      <div class="table-container">
        <p style="color:var(--color-text-muted)">Placeholder — chưa có dữ liệu.</p>
      </div>
    </div>
  `,
})
export class LandlordsComponent {}

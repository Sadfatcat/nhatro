import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

const execFileAsync = promisify(execFile);
const DOTS = '....................................................................';

/* eslint-disable @typescript-eslint/no-var-requires */
const PizZip        = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'hop_dong_template.docx');
const UPLOAD_DIR    = path.join(process.cwd(), 'uploads', 'contracts');

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '............';
  const dt = d instanceof Date ? d : new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

function toWords(n: number): string {
  if (n === 0) return 'Không đồng';
  const u = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function g(x: number): string {
    const h = Math.floor(x/100), t = Math.floor((x%100)/10), d = x%10;
    let s = h ? u[h]+' trăm' : '';
    if (t > 1) s += (s?' ':'')+u[t]+' mươi'+(d ? (d===1?' mốt':d===4?' tư':d===5?' lăm':' '+u[d]) : '');
    else if (t===1) s += (s?' ':'')+'mười'+(d ? ' '+(d===5?'lăm':u[d]) : '');
    else if (d) s += (s?' lẻ ':'')+u[d];
    return s;
  }
  const b=Math.floor(n/1e9), m=Math.floor((n%1e9)/1e6), k=Math.floor((n%1e6)/1e3), r=n%1e3;
  const parts: string[] = [];
  if (b) parts.push(g(b)+' tỷ');
  if (m) parts.push(g(m)+' triệu');
  if (k) parts.push(g(k)+' nghìn');
  if (r) parts.push(g(r));
  const text = parts.join(' ');
  return text.charAt(0).toUpperCase()+text.slice(1)+' đồng';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRow(c: any) {
  return {
    id:        c.id,
    roomId:    c.roomId,
    tenantId:  c.tenantId,
    startDate: c.startDate,
    deposit:   c.deposit,
    status:    c.status,
    notes:     c.notes,
    filePath:  c.filePath ?? null,
    createdAt: c.createdAt,
    room: {
      roomId:     c.room.id,
      roomNumber: c.room.roomNumber,
      floor:      c.room.floor,
      price:      c.room.price,
    },
    tenant: {
      tenantId:    c.tenant.id,
      fullName:    c.tenant.fullName,
      phone:       c.tenant.phone,
      dateOfBirth: c.tenant.dateOfBirth,
      hometown:    c.tenant.hometown,
      nationalId:  c.tenant.nationalId,
    },
  };
}

const INCLUDE = { room: true, tenant: true };

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.contract.findMany({ orderBy: { createdAt: 'desc' }, include: INCLUDE });
    return list.map(formatRow);
  }

  async findByRoom(roomId: string) {
    const c = await this.prisma.contract.findFirst({ where: { roomId, status: 'ACTIVE' }, include: INCLUDE });
    return c ? formatRow(c) : null;
  }

  async findOne(id: string) {
    const c = await this.prisma.contract.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw new NotFoundException('Không tìm thấy hợp đồng.');
    return formatRow(c);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildTemplateData(contract: any): Record<string, string> {
    const created = new Date(contract.createdAt ?? new Date());
    const yob = contract.tenant.dateOfBirth
      ? String(new Date(contract.tenant.dateOfBirth).getFullYear())
      : DOTS;
    const price   = contract.room.price as number;
    const deposit = contract.deposit as number;
    const startDate = contract.startDate ? fmtDate(contract.startDate) : DOTS;
    return {
      tenantName:       contract.tenant.fullName || DOTS,
      tenantYob:        yob,
      tenantNationalId: contract.tenant.nationalId || DOTS,
      tenantIdDate:     DOTS,
      tenantHometown:   contract.tenant.hometown || DOTS,
      tenantPhone:      contract.tenant.phone || DOTS,
      startDate,
      endDate:          DOTS,
      roomPrice:        price ? price.toLocaleString('vi-VN') : DOTS,
      roomPriceWords:   price ? toWords(price) : DOTS,
      deposit:          deposit ? deposit.toLocaleString('vi-VN') : DOTS,
      depositWords:     deposit ? toWords(deposit) : DOTS,
      contractDay:      String(created.getDate()),
      contractMonth:    String(created.getMonth() + 1),
      contractYear:     String(created.getFullYear()),
    };
  }

  private renderDocx(data: Record<string, string>): Buffer {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new BadRequestException('Template hợp đồng không tồn tại. Vui lòng liên hệ quản trị viên.');
    }
    const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
    const zip     = new PizZip(content);
    const doc     = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
  }

  private async convertToPdf(docxPath: string): Promise<string> {
    const outDir = path.dirname(docxPath);
    const profileDir = `/tmp/lo_profile_${randomUUID()}`;
    await execFileAsync('libreoffice', [
      '--headless',
      `--env:UserInstallation=file://${profileDir}`,
      '--convert-to', 'pdf',
      '--outdir', outDir,
      docxPath,
    ], {
      env: { ...process.env, HOME: '/tmp' },
      timeout: 30000,
    });
    const pdfPath = docxPath.replace(/\.docx$/, '.pdf');
    if (!fs.existsSync(pdfPath)) throw new Error('LibreOffice PDF conversion failed');
    fs.unlinkSync(docxPath);
    return pdfPath;
  }

  async preview(dto: CreateContractDto) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId }, include: { tenant: true } });
    if (!room)        throw new NotFoundException('Không tìm thấy phòng.');
    if (!room.tenant) throw new NotFoundException('Phòng chưa có người thuê.');
    return {
      room:     { roomNumber: room.roomNumber, floor: room.floor, price: room.price },
      tenant:   { fullName: room.tenant.fullName, phone: room.tenant.phone, nationalId: room.tenant.nationalId, hometown: room.tenant.hometown, dateOfBirth: room.tenant.dateOfBirth },
      contract: { startDate: dto.startDate, deposit: dto.deposit ?? 0, notes: dto.notes ?? null },
    };
  }

  async create(dto: CreateContractDto) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId }, include: { tenant: true } });
    if (!room)        throw new NotFoundException('Không tìm thấy phòng.');
    if (!room.tenant) throw new NotFoundException('Phòng chưa có người thuê.');

    const contract = await this.prisma.contract.create({
      data: { roomId: dto.roomId, tenantId: room.tenant.id, startDate: new Date(dto.startDate), deposit: dto.deposit ?? 0, notes: dto.notes },
      include: INCLUDE,
    });

    const data     = this.buildTemplateData(contract);
    const buffer   = this.renderDocx(data);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const docxPath = path.join(UPLOAD_DIR, `${contract.id}.docx`);
    fs.writeFileSync(docxPath, buffer);
    const pdfPath  = await this.convertToPdf(docxPath);
    const relPath  = path.relative(process.cwd(), pdfPath);

    await this.prisma.contract.update({ where: { id: contract.id }, data: { filePath: relPath } });
    return formatRow({ ...contract, filePath: relPath });
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id);
    await this.prisma.contract.update({
      where: { id },
      data: {
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        deposit:   dto.deposit,
        status:    dto.status,
        notes:     dto.notes,
      },
    });

    const contract = await this.prisma.contract.findUnique({ where: { id }, include: INCLUDE });
    if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng.');

    if (contract.filePath) {
      const old = path.join(process.cwd(), contract.filePath);
      try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch (_) { /* ignore */ }
    }

    const data     = this.buildTemplateData(formatRow(contract));
    const buffer   = this.renderDocx(data);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const docxPath = path.join(UPLOAD_DIR, `${id}.docx`);
    fs.writeFileSync(docxPath, buffer);
    const pdfPath  = await this.convertToPdf(docxPath);
    const relPath  = path.relative(process.cwd(), pdfPath);

    const updated = await this.prisma.contract.update({ where: { id }, data: { filePath: relPath }, include: INCLUDE });
    return formatRow(updated);
  }

  async getFile(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const c = await this.prisma.contract.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw new NotFoundException('Không tìm thấy hợp đồng.');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomNum  = (c.room as any).roomNumber as string;
    const filename = `hop-dong-phong-${roomNum}.pdf`;

    if (c.filePath) {
      const abs = path.join(process.cwd(), c.filePath);
      if (fs.existsSync(abs)) return { buffer: fs.readFileSync(abs), filename };
    }

    const data     = this.buildTemplateData(formatRow(c));
    const buffer   = this.renderDocx(data);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const docxPath = path.join(UPLOAD_DIR, `${id}.docx`);
    fs.writeFileSync(docxPath, buffer);
    const pdfPath  = await this.convertToPdf(docxPath);
    const relPath  = path.relative(process.cwd(), pdfPath);
    await this.prisma.contract.update({ where: { id }, data: { filePath: relPath } });
    return { buffer: fs.readFileSync(pdfPath), filename };
  }

  async replaceFile(id: string, file: Express.Multer.File) {
    const c = await this.prisma.contract.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw new NotFoundException('Không tìm thấy hợp đồng.');

    if (file.mimetype !== 'application/pdf') throw new BadRequestException('Chỉ chấp nhận file .pdf.');

    if (c.filePath) {
      const old = path.join(process.cwd(), c.filePath);
      try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch (_) { /* ignore */ }
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, `${id}.pdf`);
    fs.writeFileSync(filePath, file.buffer);
    const relPath  = path.relative(process.cwd(), filePath);

    const updated = await this.prisma.contract.update({ where: { id }, data: { filePath: relPath }, include: INCLUDE });
    return formatRow(updated);
  }

  async remove(id: string) {
    const c = await this.prisma.contract.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Không tìm thấy hợp đồng.');

    if (c.filePath) {
      const abs = path.join(process.cwd(), c.filePath);
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) { /* ignore */ }
    }

    return this.prisma.contract.delete({ where: { id } });
  }
}

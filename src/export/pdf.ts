/**
 * PDF export utility using PDFKit.
 * Converts a Markdown report string into a professional branded PDF document
 * and returns it as a Base64-encoded string.
 * v6.0: Supports company branding, transaction comparables, and client-ready layout.
 */
import PDFDocument from 'pdfkit';

export interface PdfBrandingOptions {
  companyName?: string;
  agentName?: string;
  agentLogoBase64?: string;
  disclaimer?: string;
  footerContact?: string;
  /** Hex color string without '#', defaults to '1a3c5e' */
  primaryColor?: string;
}

export interface TransactionComparable {
  year: string;
  quarter: string;
  city: string;
  district: string;
  propertyType: string;
  areaSqm: number;
  pricePerSqm: number;
  buildingYear: string;
  structure: string;
}

/** Convert a Markdown report to a Base64-encoded PDF string. */
export async function markdownToPdfBase64(
  markdownReport: string,
  title: string,
  branding?: PdfBrandingOptions,
  comparables?: TransactionComparable[],
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 48, size: 'A4' });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve(buf.toString('base64'));
    });
    doc.on('error', reject);

    const PRIMARY = '#1a3c5e';
    const ACCENT = '#4f8cff';
    const TEXT = '#1a1a2e';
    const MUTED = '#666680';
    const PAGE_W = 595 - 96; // A4 minus margins
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Branded Header ─────────────────────────────────────────────────────
    // Color band
    doc.rect(0, 0, 595, 80).fill(PRIMARY);

    // Company name & agent name in header
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
      .text(branding?.companyName ?? 'Japan Real Estate Intel', 48, 20, { width: PAGE_W - 80 });

    if (branding?.agentName) {
      doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.8)')
        .text(`担当: ${branding.agentName}`, 48, 44);
    }

    doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)')
      .text(today, 48, 60);

    // Move below header
    doc.y = 96;

    // ── Report Title ───────────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').fillColor(TEXT).text(title, { align: 'center' });
    doc.moveDown(0.3);

    // Thin accent line under title
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(ACCENT).lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.6);

    // ── Markdown Body ──────────────────────────────────────────────────────
    const lines = markdownReport.split('\n');
    for (const raw of lines) {
      const line = raw.trimEnd();

      if (line.startsWith('## ')) {
        doc.moveDown(0.5);
        // Section header with background
        const y = doc.y;
        doc.rect(48, y, PAGE_W, 18).fill('#f0f4fa');
        doc.fontSize(13).font('Helvetica-Bold').fillColor(PRIMARY)
          .text(line.slice(3), 52, y + 3);
        doc.moveDown(0.1);
        doc.y += 2;
        doc.fontSize(11).font('Helvetica').fillColor(TEXT);
      } else if (line.startsWith('# ')) {
        doc.moveDown(0.4);
        doc.fontSize(15).font('Helvetica-Bold').fillColor(TEXT).text(line.slice(2));
        doc.fontSize(11).font('Helvetica').fillColor(TEXT);
      } else if (line.startsWith('### ')) {
        doc.moveDown(0.3);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY).text(line.slice(4));
        doc.fontSize(11).font('Helvetica').fillColor(TEXT);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        doc.fontSize(11).font('Helvetica').fillColor(TEXT)
          .text(`  \u2022 ${line.slice(2)}`, { indent: 8 });
      } else if (line.startsWith('> ')) {
        // Blockquote style
        const qy = doc.y;
        doc.moveTo(48, qy).lineTo(48, qy + 14).strokeColor(ACCENT).lineWidth(3).stroke();
        doc.lineWidth(1);
        doc.fontSize(10).font('Helvetica').fillColor(MUTED)
          .text(line.slice(2), 56, qy, { width: PAGE_W - 16 });
        doc.moveDown(0.1);
      } else if (line.trim() === '') {
        doc.moveDown(0.25);
      } else if (line.startsWith('|')) {
        // Skip raw Markdown tables — we render them separately
      } else {
        const clean = line
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1');
        doc.fontSize(11).font('Helvetica').fillColor(TEXT).text(clean, { width: PAGE_W });
      }
    }

    // ── Transaction Comparables Table ──────────────────────────────────────
    if (comparables && comparables.length > 0) {
      doc.addPage();

      // Section header
      doc.rect(0, 0, 595, 50).fill(PRIMARY);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
        .text('過去取引事例（参考）', 48, 16);
      doc.y = 70;

      doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT)
        .text('近隣の過去成約事例（直近5年）', { align: 'center' });
      doc.moveDown(0.5);

      // Table header
      const colWidths = [40, 55, 60, 55, 60, 55, 55, 55];
      const headers = ['年', '市区', '地区', '種別', '面積(㎡)', '㎡単価(万)', '築年', '構造'];
      const startX = 48;
      let x = startX;
      const headerY = doc.y;

      doc.rect(startX, headerY, PAGE_W, 16).fill('#e8edf5');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY);
      headers.forEach((h, i) => {
        doc.text(h, x + 2, headerY + 3, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });
      doc.y = headerY + 18;

      // Table rows
      const shown = comparables.slice(0, 20);
      shown.forEach((c, ri) => {
        const rowY = doc.y;
        if (ri % 2 === 0) doc.rect(startX, rowY, PAGE_W, 14).fill('#f9fafc');
        doc.fontSize(8).font('Helvetica').fillColor(TEXT);
        const cells = [
          c.year,
          c.city.length > 7 ? c.city.slice(0, 7) : c.city,
          c.district,
          c.propertyType,
          String(Math.round(c.areaSqm)),
          Math.round(c.pricePerSqm / 10000).toLocaleString(),
          c.buildingYear,
          c.structure,
        ];
        x = startX;
        cells.forEach((cell, i) => {
          doc.text(String(cell), x + 2, rowY + 3, { width: colWidths[i], align: 'center' });
          x += colWidths[i];
        });
        doc.y = rowY + 15;
      });

      doc.moveDown(0.5);
      doc.fontSize(8).fillColor(MUTED)
        .text(`※ ${shown.length} 件表示。出典: 不動産取引価格情報（国土交通省）`, { align: 'right' });
    }

    // ── Footer & Disclaimer ────────────────────────────────────────────────
    doc.moveDown(1);

    // Separator
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    const disclaimerText = branding?.disclaimer ??
      '本レポートは情報提供を目的としており、投資助言を構成するものではありません。地価・リスクデータはサンプルデータを含む場合があり、実際の取引において保証するものではありません。';
    doc.fontSize(8).font('Helvetica').fillColor(MUTED).text(disclaimerText, { width: PAGE_W });

    if (branding?.footerContact) {
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY).text(branding.footerContact, { align: 'center' });
    }

    doc.moveDown(0.4);
    doc.fontSize(8).fillColor(MUTED)
      .text(`Generated by @sugukuru/japan-real-estate-intel-mcp — ${today}`, { align: 'center' });

    doc.end();
  });
}

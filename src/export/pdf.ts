/**
 * PDF export utility using PDFKit.
 * Converts a Markdown report string into a professional branded PDF document
 * and returns it as a Base64-encoded string.
 * v6.1: Japanese font support via IPAex Gothic (IPA license).
 */
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Resolve font path relative to this module, works in both src/ and dist/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, '../../assets/fonts');
const JP_FONT_PATH = path.join(FONT_DIR, 'ipaexg.ttf');
const JP_FONT_AVAILABLE = fs.existsSync(JP_FONT_PATH);

const JP_REGULAR = 'JPRegular';
const JP_BOLD = 'JPBold'; // IPAex Gothic has no separate bold; we use same file with size bump

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

    // Register Japanese font if available
    if (JP_FONT_AVAILABLE) {
      doc.registerFont(JP_REGULAR, JP_FONT_PATH);
      doc.registerFont(JP_BOLD, JP_FONT_PATH);
    }

    const F_REG = JP_FONT_AVAILABLE ? JP_REGULAR : 'Helvetica';
    const F_BOLD = JP_FONT_AVAILABLE ? JP_BOLD : 'Helvetica-Bold';

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
    const PAGE_W = 595 - 96;
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // ── Branded Header ─────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill(PRIMARY);

    doc
      .fillColor('#ffffff')
      .fontSize(16)
      .font(F_BOLD)
      .text(branding?.companyName ?? 'Japan Real Estate Intel', 48, 20, { width: PAGE_W - 80 });

    if (branding?.agentName) {
      doc
        .fontSize(10)
        .font(F_REG)
        .fillColor('rgba(255,255,255,0.85)')
        .text(`\u62c5\u5f53: ${branding.agentName}`, 48, 44);
    }

    doc.fontSize(9).font(F_REG).fillColor('rgba(255,255,255,0.7)').text(today, 48, 60);

    doc.y = 96;

    // ── Report Title ───────────────────────────────────────────────────────
    doc.fontSize(20).font(F_BOLD).fillColor(TEXT).text(title, { align: 'center' });
    doc.moveDown(0.3);

    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(ACCENT).lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.6);

    // ── Markdown Body ──────────────────────────────────────────────────────
    const lines = markdownReport.split('\n');
    for (const raw of lines) {
      const line = raw.trimEnd();

      if (line.startsWith('## ')) {
        doc.moveDown(0.5);
        const y = doc.y;
        doc.rect(48, y, PAGE_W, 18).fill('#f0f4fa');
        doc
          .fontSize(13)
          .font(F_BOLD)
          .fillColor(PRIMARY)
          .text(line.slice(3), 52, y + 3);
        doc.moveDown(0.1);
        doc.y += 2;
        doc.fontSize(11).font(F_REG).fillColor(TEXT);
      } else if (line.startsWith('# ')) {
        doc.moveDown(0.4);
        doc.fontSize(15).font(F_BOLD).fillColor(TEXT).text(line.slice(2));
        doc.fontSize(11).font(F_REG).fillColor(TEXT);
      } else if (line.startsWith('### ')) {
        doc.moveDown(0.3);
        doc.fontSize(12).font(F_BOLD).fillColor(PRIMARY).text(line.slice(4));
        doc.fontSize(11).font(F_REG).fillColor(TEXT);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        doc
          .fontSize(11)
          .font(F_REG)
          .fillColor(TEXT)
          .text(`  \u2022 ${line.slice(2)}`, { indent: 8 });
      } else if (line.startsWith('> ')) {
        const qy = doc.y;
        doc
          .moveTo(48, qy)
          .lineTo(48, qy + 14)
          .strokeColor(ACCENT)
          .lineWidth(3)
          .stroke();
        doc.lineWidth(1);
        doc
          .fontSize(10)
          .font(F_REG)
          .fillColor(MUTED)
          .text(line.slice(2), 56, qy, { width: PAGE_W - 16 });
        doc.moveDown(0.1);
      } else if (line.trim() === '') {
        doc.moveDown(0.25);
      } else if (line.startsWith('|')) {
        // Skip raw Markdown table rows
      } else {
        const clean = line
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1');
        doc.fontSize(11).font(F_REG).fillColor(TEXT).text(clean, { width: PAGE_W });
      }
    }

    // ── Transaction Comparables Table ──────────────────────────────────────
    if (comparables && comparables.length > 0) {
      doc.addPage();

      doc.rect(0, 0, 595, 50).fill(PRIMARY);
      doc
        .fillColor('#ffffff')
        .fontSize(14)
        .font(F_BOLD)
        .text('\u904e\u53bb\u53d6\u5f15\u4e8b\u4f8b\uff08\u53c2\u8003\uff09', 48, 16);
      doc.y = 70;

      doc
        .fontSize(11)
        .font(F_BOLD)
        .fillColor(TEXT)
        .text(
          '\u8fd1\u96a3\u306e\u904e\u53bb\u6210\u7d04\u4e8b\u4f8b\uff08\u76f4\u8fd15\u5e74\uff09',
          { align: 'center' },
        );
      doc.moveDown(0.5);

      const colWidths = [40, 55, 60, 55, 60, 55, 55, 55];
      const headers = [
        '\u5e74',
        '\u5e02\u533a',
        '\u5730\u533a',
        '\u7a2e\u5225',
        '\u9762\u7a4f(\u33a1)',
        '\u33a1\u5358\u4fa1(\u4e07)',
        '\u7bc9\u5e74',
        '\u69cb\u9020',
      ];
      const startX = 48;
      let x = startX;
      const headerY = doc.y;

      doc.rect(startX, headerY, PAGE_W, 16).fill('#e8edf5');
      doc.fontSize(9).font(F_BOLD).fillColor(PRIMARY);
      headers.forEach((h, i) => {
        doc.text(h, x + 2, headerY + 3, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });
      doc.y = headerY + 18;

      const shown = comparables.slice(0, 20);
      shown.forEach((c, ri) => {
        const rowY = doc.y;
        if (ri % 2 === 0) doc.rect(startX, rowY, PAGE_W, 14).fill('#f9fafc');
        doc.fontSize(8).font(F_REG).fillColor(TEXT);
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
      doc
        .fontSize(8)
        .font(F_REG)
        .fillColor(MUTED)
        .text(
          `\u203b ${shown.length} \u4ef6\u8868\u793a\u3002\u51fa\u5178: \u4e0d\u52d5\u7523\u53d6\u5f15\u4fa1\u683c\u60c5\u5831\uff08\u56fd\u571f\u4ea4\u901a\u7701\uff09`,
          { align: 'right' },
        );
    }

    // ── Footer & Disclaimer ────────────────────────────────────────────────
    doc.moveDown(1);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    const disclaimerText =
      branding?.disclaimer ??
      '\u672c\u30ec\u30dd\u30fc\u30c8\u306f\u60c5\u5831\u63d0\u4f9b\u3092\u76ee\u7684\u3068\u3057\u3066\u304a\u308a\u3001\u6295\u8cc7\u52a9\u8a00\u3092\u69cb\u6210\u3059\u308b\u3082\u306e\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u5730\u4fa1\u30fb\u30ea\u30b9\u30af\u30c7\u30fc\u30bf\u306f\u30b5\u30f3\u30d7\u30eb\u30c7\u30fc\u30bf\u3092\u542b\u3080\u5834\u5408\u304c\u3042\u308a\u3001\u5b9f\u969b\u306e\u53d6\u5f15\u306b\u304a\u3044\u3066\u4fdd\u8a3c\u3059\u308b\u3082\u306e\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002';
    doc.fontSize(8).font(F_REG).fillColor(MUTED).text(disclaimerText, { width: PAGE_W });

    if (branding?.footerContact) {
      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .font(F_BOLD)
        .fillColor(PRIMARY)
        .text(branding.footerContact, { align: 'center' });
    }

    doc.moveDown(0.4);
    doc
      .fontSize(8)
      .font(F_REG)
      .fillColor(MUTED)
      .text(`Generated by @sugukuru/japan-real-estate-intel-mcp \u2014 ${today}`, {
        align: 'center',
      });

    doc.end();
  });
}

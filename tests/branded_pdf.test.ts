import { describe, it, expect } from 'vitest';
import { markdownToPdfBase64 } from '../src/export/pdf.js';
import type { PdfBrandingOptions, TransactionComparable } from '../src/export/pdf.js';

const SAMPLE_MARKDOWN = [
  '# 名古屋市中区 不動産調査レポート',
  '',
  '## エリア概要',
  '名古屋市中区は愛知県の中心部に位置するビジネス・商業エリアです。',
  '',
  '## リスク評価',
  '- 洪水リスク: 低',
  '- 地震リスク: 中',
  '',
  '## 投資判断',
  '投資スコア: 82点。優良投資エリアと判断されます。',
].join('\n');

const SAMPLE_BRANDING: PdfBrandingOptions = {
  companyName: '○○不動産株式会社',
  agentName: '山田 太郎',
  disclaimer: 'テスト用免責事項です。本レポートはテスト目的で生成されました。',
  footerContact: 'TEL: 052-XXX-XXXX',
};

const SAMPLE_COMPARABLES: TransactionComparable[] = [
  {
    year: '2024',
    quarter: 'Q1',
    city: '名古屋市中区',
    district: '栄',
    propertyType: 'office',
    areaSqm: 120,
    pricePerSqm: 2100000,
    buildingYear: '2020',
    structure: 'SRC',
  },
  {
    year: '2024',
    quarter: 'Q2',
    city: '名古屋市中区',
    district: '伏見',
    propertyType: 'commercial',
    areaSqm: 80,
    pricePerSqm: 1800000,
    buildingYear: '2018',
    structure: 'RC',
  },
  {
    year: '2023',
    quarter: 'Q3',
    city: '名古屋市中区',
    district: '栄',
    propertyType: 'residential',
    areaSqm: 95,
    pricePerSqm: 600000,
    buildingYear: '2022',
    structure: 'RC',
  },
];

describe('markdownToPdfBase64 — basic', () => {
  it('returns a non-empty string', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テストレポート');
    expect(b64).toBeTruthy();
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(100);
  });

  it('output decodes to a valid PDF (starts with %PDF-)', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テストレポート');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('generates PDF of reasonable size (> 10 KB)', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テストレポート');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.length).toBeGreaterThan(10_000);
  });
});

describe('markdownToPdfBase64 — branding', () => {
  it('generates valid PDF with branding options', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, '愛知県テスト', SAMPLE_BRANDING);
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(10_000);
  });

  it('generates PDF of similar size with or without branding', async () => {
    const plain = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'plain');
    const branded = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'branded', SAMPLE_BRANDING);
    const plainBuf = Buffer.from(plain, 'base64');
    const brandedBuf = Buffer.from(branded, 'base64');
    // Both should be valid PDFs of reasonable size (within 2x of each other)
    expect(brandedBuf.length).toBeGreaterThan(5000);
    expect(plainBuf.length).toBeGreaterThan(5000);
    const ratio = brandedBuf.length / plainBuf.length;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2.0);
  });

  it('does not throw with undefined branding fields', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テスト', {});
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });
});

describe('markdownToPdfBase64 — transaction comparables', () => {
  it('generates valid PDF with comparables (adds a second page)', async () => {
    const b64 = await markdownToPdfBase64(
      SAMPLE_MARKDOWN,
      'テスト',
      SAMPLE_BRANDING,
      SAMPLE_COMPARABLES,
    );
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
    // With comparables the PDF should be larger than without
    const noComp = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テスト', SAMPLE_BRANDING);
    const noCompBuf = Buffer.from(noComp, 'base64');
    expect(buf.length).toBeGreaterThan(noCompBuf.length);
  });

  it('generates valid PDF with empty comparables array', async () => {
    const b64 = await markdownToPdfBase64(SAMPLE_MARKDOWN, 'テスト', SAMPLE_BRANDING, []);
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });
});

describe('markdownToPdfBase64 — markdown rendering', () => {
  it('handles empty markdown without throwing', async () => {
    const b64 = await markdownToPdfBase64('', '空のレポート');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('handles markdown with only headers', async () => {
    const md = '# H1タイトル\n## H2セクション\n### H3サブセクション';
    const b64 = await markdownToPdfBase64(md, '見出しテスト');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('handles blockquotes', async () => {
    const md = '> これは引用文です。\n> リニア中央新幹線の影響エリア。';
    const b64 = await markdownToPdfBase64(md, '引用テスト');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('handles long report (100+ lines) without crashing', async () => {
    const lines = Array.from(
      { length: 120 },
      (_, i) => `行 ${i + 1}: 愛知県名古屋市のデータ分析レポートの内容です。`,
    );
    const b64 = await markdownToPdfBase64(lines.join('\n'), '長いレポート');
    const buf = Buffer.from(b64, 'base64');
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });
});

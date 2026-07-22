import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  saveArtifact,
  getArtifact,
  cleanupExpiredArtifacts,
  artifactPublicUrl,
  closeDb,
  resetArtifactsForTests,
} from '../src/artifacts.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'artifacts-unit-test-'));
  process.env.ARTIFACT_DIR = join(tmpDir, 'artifacts');
  process.env.ARTIFACT_DB_PATH = join(tmpDir, 'artifacts.sqlite');
});

afterEach(() => {
  closeDb();
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  delete process.env.ARTIFACT_DIR;
  delete process.env.ARTIFACT_DB_PATH;
  delete process.env.ARTIFACT_TTL_HOURS;
  delete process.env.MCP_PUBLIC_URL;
});

describe('saveArtifact / getArtifact', () => {
  it('round-trips text content', () => {
    const meta = saveArtifact('hello world', 'note.md', 'text/markdown');
    expect(meta.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const found = getArtifact(meta.id);
    expect(found).not.toBeNull();
    expect(found!.data.toString('utf-8')).toBe('hello world');
    expect(found!.metadata.filename).toBe('note.md');
    expect(found!.metadata.mimeType).toBe('text/markdown');
  });

  it('round-trips binary Buffer content', () => {
    const buf = Buffer.from([0x25, 0x50, 0x44, 0x46]); // "%PDF"
    const meta = saveArtifact(buf, 'report.pdf', 'application/pdf');
    const found = getArtifact(meta.id);
    expect(found!.data.equals(buf)).toBe(true);
  });

  it('returns null for an unknown ID', () => {
    expect(getArtifact('11111111-1111-1111-1111-111111111111')).toBeNull();
  });

  it('rejects non-UUID IDs before ever touching the filesystem (no path traversal surface)', () => {
    expect(getArtifact('../../../etc/passwd')).toBeNull();
    expect(getArtifact('not-a-uuid')).toBeNull();
    expect(getArtifact('')).toBeNull();
  });
});

describe('TTL expiry', () => {
  it('getArtifact returns null and deletes the file once the TTL has elapsed', async () => {
    process.env.ARTIFACT_TTL_HOURS = '0.0000001'; // ~0.36ms
    const meta = saveArtifact('expiring', 'x.txt', 'text/plain');
    const filePath = join(process.env.ARTIFACT_DIR!, meta.id);
    expect(existsSync(filePath)).toBe(true);

    await new Promise((r) => setTimeout(r, 10));

    expect(getArtifact(meta.id)).toBeNull();
    expect(existsSync(filePath)).toBe(false);
  });

  it('cleanupExpiredArtifacts removes expired rows/files and returns the count removed', async () => {
    // Save both under the default (long) TTL so neither is touched by the
    // opportunistic cleanup that saveArtifact() itself runs on each call.
    const a = saveArtifact('a', 'a.txt', 'text/plain');
    const b = saveArtifact('b', 'b.txt', 'text/plain');

    // Now shrink the TTL so both become expired, and wait past that window
    // before sweeping exactly once.
    process.env.ARTIFACT_TTL_HOURS = '0.0000001';
    await new Promise((r) => setTimeout(r, 10));

    expect(cleanupExpiredArtifacts()).toBe(2);
    expect(getArtifact(a.id)).toBeNull();
    expect(getArtifact(b.id)).toBeNull();
  });

  it('does not expire artifacts within the TTL window', () => {
    process.env.ARTIFACT_TTL_HOURS = '24';
    const meta = saveArtifact('fresh', 'fresh.txt', 'text/plain');
    expect(getArtifact(meta.id)).not.toBeNull();
  });
});

describe('artifactPublicUrl', () => {
  it('builds an HTTPS download URL scoped to /artifacts/:id/:filename', () => {
    const url = artifactPublicUrl('abc-123', '名古屋市中区_report.pdf');
    expect(url).toBe(
      `https://realestate-mcp.jp/artifacts/abc-123/${encodeURIComponent('名古屋市中区_report.pdf')}`,
    );
  });

  it('respects MCP_PUBLIC_URL and strips a trailing slash', () => {
    process.env.MCP_PUBLIC_URL = 'https://example.com/';
    const url = artifactPublicUrl('abc-123', 'x.csv');
    expect(url).toBe('https://example.com/artifacts/abc-123/x.csv');
  });
});

describe('resetArtifactsForTests', () => {
  it('clears all stored artifacts', () => {
    const meta = saveArtifact('x', 'x.txt', 'text/plain');
    resetArtifactsForTests();
    expect(getArtifact(meta.id)).toBeNull();
  });
});

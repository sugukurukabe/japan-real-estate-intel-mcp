/**
 * Artifact Store — generated reports/exports (Markdown, PDF, CSV, XLSX) saved to
 * disk with a TTL, retrievable either via the MCP `artifact://{id}` resource
 * template (works for stdio and HTTP transports alike) or the HTTP
 * `/artifacts/:id/:filename` route (only available when this server is deployed
 * with the HTTP transport; see src/http.ts).
 *
 * IDs are `randomUUID()` — unguessable by design; that unguessability is the
 * access-control boundary (the same model Stripe uses for Checkout session
 * IDs), so `getArtifact()` rejects anything that isn't a bare UUID before it
 * ever touches the filesystem, closing off path-traversal.
 *
 * Deliberately NOT stored under `data/`: that directory is served verbatim by
 * Express's static middleware (see src/http.ts) with no TTL or
 * Content-Disposition handling. Keeping generated artifacts in their own
 * top-level folder means every download goes through the dedicated route
 * below, which enforces both.
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { moduleLogger } from './logger.js';

const log = moduleLogger('artifacts');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getArtifactDir(): string {
  return process.env.ARTIFACT_DIR ?? resolve(process.cwd(), 'artifacts');
}

function getDbPath(): string {
  return process.env.ARTIFACT_DB_PATH ?? resolve(process.cwd(), 'db', 'artifacts.sqlite');
}

function getTtlMs(): number {
  const hours = Number(process.env.ARTIFACT_TTL_HOURS ?? '24');
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

export interface ArtifactMetadata {
  id: string;
  filename: string;
  mimeType: string;
  createdAt: number;
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  log.info({ path: dbPath }, 'Artifact SQLite store initialized');
  return _db;
}

function filePathFor(id: string): string {
  return join(getArtifactDir(), id);
}

function deleteArtifactFiles(ids: string[]): void {
  for (const id of ids) {
    const p = filePathFor(id);
    if (existsSync(p)) {
      try {
        unlinkSync(p);
      } catch (err) {
        log.warn({ id, err }, 'Failed to delete expired artifact file');
      }
    }
  }
}

/** Delete DB rows + files for artifacts older than the TTL. Returns the count removed. */
export function cleanupExpiredArtifacts(): number {
  const cutoff = Date.now() - getTtlMs();
  const db = getDb();
  const expired = db.prepare('SELECT id FROM artifacts WHERE created_at < ?').all(cutoff) as {
    id: string;
  }[];
  if (expired.length === 0) return 0;
  deleteArtifactFiles(expired.map((r) => r.id));
  db.prepare('DELETE FROM artifacts WHERE created_at < ?').run(cutoff);
  log.info({ count: expired.length }, 'Cleaned up expired artifacts');
  return expired.length;
}

/** Persist a generated report/export to disk and register it for later retrieval. */
export function saveArtifact(
  data: Buffer | string,
  filename: string,
  mimeType: string,
): ArtifactMetadata {
  cleanupExpiredArtifacts();
  const dir = getArtifactDir();
  mkdirSync(dir, { recursive: true });
  const id = randomUUID();
  writeFileSync(filePathFor(id), data);
  const createdAt = Date.now();
  getDb()
    .prepare('INSERT INTO artifacts (id, filename, mime_type, created_at) VALUES (?, ?, ?, ?)')
    .run(id, filename, mimeType, createdAt);
  return { id, filename, mimeType, createdAt };
}

/** Look up a stored artifact by ID. Returns null if missing, malformed, or expired. */
export function getArtifact(id: string): { data: Buffer; metadata: ArtifactMetadata } | null {
  if (!UUID_RE.test(id)) return null;
  const row = getDb()
    .prepare(
      'SELECT id, filename, mime_type as mimeType, created_at as createdAt FROM artifacts WHERE id = ?',
    )
    .get(id) as ArtifactMetadata | undefined;
  if (!row) return null;
  if (Date.now() - row.createdAt > getTtlMs()) {
    deleteArtifactFiles([id]);
    getDb().prepare('DELETE FROM artifacts WHERE id = ?').run(id);
    return null;
  }
  const filePath = filePathFor(id);
  if (!existsSync(filePath)) return null;
  return { data: readFileSync(filePath), metadata: row };
}

/** Build the public HTTP download URL for an artifact (used only in HTTP transport mode). */
export function artifactPublicUrl(id: string, filename: string): string {
  const base = (process.env.MCP_PUBLIC_URL ?? 'https://realestate-mcp.jp').replace(/\/$/, '');
  return `${base}/artifacts/${id}/${encodeURIComponent(filename)}`;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function resetArtifactsForTests(): void {
  getDb().prepare('DELETE FROM artifacts').run();
}

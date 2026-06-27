/**
 * Structured logger for japan-real-estate-intel-mcp.
 *
 * - stdio mode:   writes to stderr (MCP spec: stdout is reserved for protocol)
 * - http mode:    writes JSON lines to stderr as well (structured, parse with jq)
 * - LOG_LEVEL env var controls verbosity (trace|debug|info|warn|error|silent)
 *
 * Usage:
 *   import { logger, toolLogger } from './logger.js';
 *   logger.info({ prefecture: 'aichi' }, 'Tool invoked');
 *   toolLogger('cross_analyze', 'aichi', startMs);
 */

import pino from 'pino';

const level = (process.env.LOG_LEVEL ?? 'info') as pino.Level;

export const logger = pino(
  {
    level,
    name: 'japan-re-intel',
    // Always write to stderr so stdout stays clean for MCP stdio transport
    transport: undefined,
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  process.stderr,
);

/**
 * Logs a completed tool invocation with structured fields.
 *
 * @param tool       MCP tool name
 * @param prefecture Resolved prefecture key (e.g. 'aichi')
 * @param startMs    Value of Date.now() captured before the tool ran
 * @param err        Optional error if the tool failed
 */
export function toolLogger(tool: string, prefecture: string, startMs: number, err?: unknown): void {
  const duration_ms = Date.now() - startMs;
  if (err) {
    logger.warn({ tool, prefecture, duration_ms, err }, 'tool failed');
  } else {
    logger.info({ tool, prefecture, duration_ms }, 'tool ok');
  }
}

/**
 * Returns a child logger scoped to a specific module.
 * Adds a `module` field to every log line.
 */
export function moduleLogger(module: string): pino.Logger {
  return logger.child({ module });
}

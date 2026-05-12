/**
 * Custom error hierarchy for japan-real-estate-intel-mcp.
 *
 * All errors extend McpBaseError so callers can distinguish MCP-domain
 * errors from unexpected runtime failures with a single instanceof check.
 */

import { ZodError } from 'zod';

export class McpBaseError extends Error {
  /** HTTP-equivalent status for logging purposes only */
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    // Restore prototype chain (required when targeting ES5 downlevel)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a requested prefecture, area, or record cannot be found
 * in the loaded dataset.
 *
 * @example throw new DataNotFoundError('land price', 'aichi', '存在しない区')
 */
export class DataNotFoundError extends McpBaseError {
  readonly dataType: string;
  readonly prefecture: string;
  readonly query: string;

  constructor(dataType: string, prefecture: string, query: string) {
    super(
      `${dataType} データが見つかりません: prefecture=${prefecture}, query=${query}`,
      404,
    );
    this.dataType = dataType;
    this.prefecture = prefecture;
    this.query = query;
  }
}

/**
 * Thrown when a requested prefecture key cannot be resolved to any
 * registered loader and no stub fallback is appropriate.
 *
 * @example throw new InvalidPrefectureError('saitama')
 */
export class InvalidPrefectureError extends McpBaseError {
  readonly prefecture: string;

  constructor(prefecture: string) {
    super(
      `未対応の都道府県です: "${prefecture}"。対応: 愛知県, 東京都, 大阪府, 福岡県, 北海道, 神奈川県, 京都府, 兵庫県, 埼玉県, 千葉県`,
      400,
    );
    this.prefecture = prefecture;
  }
}

/**
 * Thrown when a tool requires a loader capability that the current
 * prefecture does not support (e.g. requesting human flow for Tokyo).
 *
 * @example throw new CapabilityNotAvailableError('humanFlow', 'tokyo')
 */
export class CapabilityNotAvailableError extends McpBaseError {
  readonly capability: string;
  readonly prefecture: string;

  constructor(capability: string, prefecture: string) {
    super(
      `${prefecture} は "${capability}" 機能に対応していません`,
      422,
    );
    this.capability = capability;
    this.prefecture = prefecture;
  }
}

/**
 * Wraps a Zod validation failure with a structured message suitable
 * for returning to MCP clients.
 *
 * @example throw new ValidationError('DrillDownInput', zodError)
 */
export class ValidationError extends McpBaseError {
  readonly schema: string;
  readonly issues: unknown[];

  constructor(schema: string, issues: { message: string; path: (string | number)[] }[]) {
    const summary = issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    super(`入力検証エラー (${schema}): ${summary}`, 400);
    this.schema = schema;
    this.issues = issues;
  }
}

/**
 * Formats any error into a user-facing message string.
 * Preserves the original message for McpBaseError subclasses,
 * and produces a generic message for unknown errors.
 */
export function formatErrorMessage(err: unknown): string {
  if (err instanceof McpBaseError) return err.message;
  if (err instanceof ZodError) {
    const summary = err.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return `入力検証エラー: ${summary}`;
  }
  if (err instanceof Error) return `内部エラー: ${err.message}`;
  return '予期しないエラーが発生しました';
}

/**
 * Returns true when the error is an expected MCP-domain error that
 * should be surfaced to the client as-is (not logged at error level).
 */
export function isClientError(err: unknown): boolean {
  if (err instanceof ZodError) return true;
  return err instanceof McpBaseError && err.statusCode < 500;
}

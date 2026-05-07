import { describe, it, expect } from 'vitest';
import {
  McpBaseError,
  DataNotFoundError,
  InvalidPrefectureError,
  CapabilityNotAvailableError,
  ValidationError,
  formatErrorMessage,
  isClientError,
} from '../src/errors.js';

describe('McpBaseError', () => {
  it('preserves message and name', () => {
    const err = new McpBaseError('test error', 500);
    expect(err.message).toBe('test error');
    expect(err.name).toBe('McpBaseError');
    expect(err.statusCode).toBe(500);
  });

  it('is instanceof Error', () => {
    expect(new McpBaseError('x')).toBeInstanceOf(Error);
  });

  it('defaults statusCode to 500', () => {
    expect(new McpBaseError('x').statusCode).toBe(500);
  });
});

describe('DataNotFoundError', () => {
  it('builds descriptive message', () => {
    const err = new DataNotFoundError('land price', 'aichi', '存在しない区');
    expect(err.message).toContain('land price');
    expect(err.message).toContain('aichi');
    expect(err.message).toContain('存在しない区');
    expect(err.statusCode).toBe(404);
  });

  it('exposes dataType, prefecture, query', () => {
    const err = new DataNotFoundError('population', 'tokyo', '不明な町');
    expect(err.dataType).toBe('population');
    expect(err.prefecture).toBe('tokyo');
    expect(err.query).toBe('不明な町');
  });

  it('is instanceof McpBaseError', () => {
    expect(new DataNotFoundError('a', 'b', 'c')).toBeInstanceOf(McpBaseError);
  });
});

describe('InvalidPrefectureError', () => {
  it('includes the prefecture name', () => {
    const err = new InvalidPrefectureError('saitama');
    expect(err.message).toContain('saitama');
    expect(err.statusCode).toBe(400);
  });

  it('exposes prefecture', () => {
    expect(new InvalidPrefectureError('hokkaido').prefecture).toBe('hokkaido');
  });
});

describe('CapabilityNotAvailableError', () => {
  it('builds message with capability and prefecture', () => {
    const err = new CapabilityNotAvailableError('humanFlow', 'tokyo');
    expect(err.message).toContain('humanFlow');
    expect(err.message).toContain('tokyo');
    expect(err.statusCode).toBe(422);
  });

  it('exposes capability and prefecture', () => {
    const err = new CapabilityNotAvailableError('plateau', 'osaka');
    expect(err.capability).toBe('plateau');
    expect(err.prefecture).toBe('osaka');
  });
});

describe('ValidationError', () => {
  it('summarises Zod issues', () => {
    const err = new ValidationError('DrillDownInput', [
      { path: ['city'], message: 'Required' },
      { path: ['prefecture'], message: 'Invalid' },
    ]);
    expect(err.message).toContain('city');
    expect(err.message).toContain('Required');
    expect(err.statusCode).toBe(400);
  });

  it('exposes schema name', () => {
    const err = new ValidationError('LandscapeInput', []);
    expect(err.schema).toBe('LandscapeInput');
  });
});

describe('formatErrorMessage', () => {
  it('returns McpBaseError message unchanged', () => {
    const err = new DataNotFoundError('x', 'y', 'z');
    expect(formatErrorMessage(err)).toBe(err.message);
  });

  it('wraps plain Error', () => {
    expect(formatErrorMessage(new Error('boom'))).toContain('boom');
  });

  it('handles non-Error unknown values', () => {
    expect(formatErrorMessage('string error')).toBeTruthy();
    expect(formatErrorMessage(null)).toBeTruthy();
    expect(formatErrorMessage(42)).toBeTruthy();
  });
});

describe('isClientError', () => {
  it('returns true for 4xx McpBaseErrors', () => {
    expect(isClientError(new DataNotFoundError('a', 'b', 'c'))).toBe(true);
    expect(isClientError(new InvalidPrefectureError('x'))).toBe(true);
    expect(isClientError(new CapabilityNotAvailableError('x', 'y'))).toBe(true);
    expect(isClientError(new ValidationError('X', []))).toBe(true);
  });

  it('returns false for 5xx McpBaseErrors', () => {
    expect(isClientError(new McpBaseError('server error', 500))).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isClientError(new Error('boom'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isClientError(null)).toBe(false);
    expect(isClientError('string')).toBe(false);
  });
});

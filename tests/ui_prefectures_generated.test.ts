import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = resolve(ROOT, 'ui-src', 'generated-prefectures.json');

describe('ui-src/generated-prefectures.json', () => {
  it('keys and display names match registered prefecture loaders', () => {
    const data = JSON.parse(readFileSync(JSON_PATH, 'utf-8')) as Record<
      string,
      { displayName: string }
    >;
    const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
    const registered = listAvailable().sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual(registered);
    for (const key of registered) {
      expect(data[key]?.displayName).toBe(getLoader(key).displayName);
    }
  });
});

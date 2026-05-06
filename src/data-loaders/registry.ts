import type { PrefectureLoader } from './types.js';
import { StubLoader } from './stub-loader.js';

const loaders = new Map<string, PrefectureLoader>();

export function registerLoader(loader: PrefectureLoader): void {
  loaders.set(loader.key, loader);
}

export function getLoader(key: string): PrefectureLoader {
  return loaders.get(key) ?? new StubLoader(key);
}

export function listAvailable(): string[] {
  return Array.from(loaders.keys());
}

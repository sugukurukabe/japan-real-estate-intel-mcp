import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture } from '../prefecture/resolver.js';

export function geocode(address: string, prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).geocode(address);
}

export function reverseGeocode(lat: number, lng: number, prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).reverseGeocode(lat, lng);
}

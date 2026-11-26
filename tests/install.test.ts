import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
test('installed app uses standalone display at the existing root route', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
});
test('installed app retains the Arabic RTL identity', () => {
  assert.equal(manifest.lang, 'ar');
  assert.equal(manifest.dir, 'rtl');
  assert.equal(manifest.short_name, 'ابوطلال');
});
test('install icons include Android sizes and a maskable variant', () => {
  assert.ok(manifest.icons.some((icon: { sizes: string; purpose: string }) => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some((icon: { sizes: string; purpose: string }) => icon.sizes === '512x512' && icon.purpose === 'maskable'));
});

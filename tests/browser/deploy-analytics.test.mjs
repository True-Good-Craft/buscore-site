import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const thisFilePath = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFilePath);
const workspaceRoot = path.resolve(thisDir, '..', '..');
const deployRoot = path.join(workspaceRoot, '.deploy');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const LIGHTHOUSE_ENDPOINT = 'https://lighthouse.buscore.ca/metrics/event';
const CLOUDFLARE_SCRIPT = 'https://static.cloudflareinsights.com/beacon.min.js';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.xml') return 'application/xml; charset=utf-8';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.ico') return 'image/x-icon';
  if (ext === '.webmanifest') return 'application/manifest+json';
  return 'application/octet-stream';
}

function resolvePath(urlPath) {
  const normalized = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalized === '/' ? '/index.html' : normalized;
  let requested = path.join(deployRoot, relative);

  if (requested.endsWith(path.sep)) {
    requested = path.join(requested, 'index.html');
  }

  if (!path.extname(requested)) {
    requested = path.join(requested, 'index.html');
  }

  const resolved = path.resolve(requested);
  if (!resolved.startsWith(path.resolve(deployRoot))) {
    return null;
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  const fallback404 = path.join(deployRoot, '404.html');
  return fallback404;
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const filePath = resolvePath(req.url || '/');
    if (!filePath) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    const body = fs.readFileSync(filePath);
    const is404 = filePath.endsWith(path.join('.deploy', '404.html'));
    res.statusCode = is404 ? 404 : 200;
    res.setHeader('Content-Type', contentTypeFor(filePath));
    res.end(body);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function createObservedContext(browser, options = {}) {
  const context = await browser.newContext();
  const pageviews = [];
  const cloudflareLoads = [];

  if (options.noAnalyticsInit) {
    await context.addInitScript(() => {
      const seededKey = '__bc_seed_noanalytics_once';
      if (!sessionStorage.getItem(seededKey)) {
        localStorage.setItem('noAnalytics', '1');
        sessionStorage.setItem(seededKey, '1');
      }
    });
  }

  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.startsWith(LIGHTHOUSE_ENDPOINT)) {
      const payloadRaw = request.postData() || '';
      let payload;
      try {
        payload = payloadRaw ? JSON.parse(payloadRaw) : null;
      } catch (err) {
        payload = { __parse_error: true, raw: payloadRaw };
      }
      pageviews.push({ url, method: request.method(), payload });
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (url.startsWith(CLOUDFLARE_SCRIPT)) {
      cloudflareLoads.push({ url, method: request.method() });
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '/* mocked cloudflare beacon */'
      });
      return;
    }

    await route.continue();
  });

  return { context, pageviews, cloudflareLoads };
}

async function waitForIdle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(150);
}

async function readState(page) {
  return page.evaluate(() => ({
    cookie: document.cookie,
    bcUid: document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('bc_uid='))
      ?.split('=')[1] || '',
    bcSid: sessionStorage.getItem('bc_sid') || '',
    lastActivity: sessionStorage.getItem('bc_last_activity_at') || '',
    lastPath: sessionStorage.getItem('last_path') || '',
    noAnalytics: localStorage.getItem('noAnalytics')
  }));
}

function requireEventWithFields(item, expectedIsNewUser) {
  assert.ok(item, 'Expected at least one analytics payload');
  assert.equal(item.method, 'POST', 'Analytics transport should POST');
  assert.ok(item.payload && typeof item.payload === 'object', 'Payload must be JSON object');
  assert.equal(item.payload.site_key, 'buscore', 'Payload site_key mismatch');
  assert.equal(item.payload.type, 'page_view', 'Payload type mismatch');
  assert.ok(item.payload.anon_user_id, 'Payload missing anon_user_id');
  assert.ok(item.payload.session_id, 'Payload missing session_id');
  assert.equal(item.payload.is_new_user, expectedIsNewUser, 'Payload is_new_user mismatch');
}

async function run() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const results = [];
  function mark(name, passed, details) {
    results.push({ name, passed, details });
    const prefix = passed ? 'PASS' : 'FAIL';
    console.log(`[${prefix}] ${name} - ${details}`);
  }

  try {
    {
      const name = 'Test 1 - First visit analytics enabled';
      const { context, pageviews, cloudflareLoads } = await createObservedContext(browser);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);

      const state = await readState(page);
      assert.ok(state.bcUid, 'bc_uid cookie should be created');
      assert.ok(state.bcSid, 'bc_sid should be created');
      assert.equal(pageviews.length, 1, 'Expected one pageview request on first load');
      requireEventWithFields(pageviews[0], true);
      assert.equal(pageviews[0].payload.anon_user_id, decodeURIComponent(state.bcUid), 'Payload anon_user_id should match cookie');
      assert.ok(cloudflareLoads.length >= 1, 'Cloudflare script should load when analytics enabled');

      mark(name, true, 'Created bc_uid/bc_sid and emitted pageview with is_new_user=true');
      await context.close();
    }

    {
      const name = 'Test 2 - Second visit same browser analytics enabled';
      const { context, pageviews } = await createObservedContext(browser);
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const firstState = await readState(page);

      await page.goto(`${BASE_URL}/downloads.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const secondState = await readState(page);

      assert.ok(firstState.bcUid, 'Initial bc_uid should exist');
      assert.equal(secondState.bcUid, firstState.bcUid, 'bc_uid should persist across pages in same context');
      assert.ok(secondState.bcSid, 'bc_sid should remain present');
      assert.equal(pageviews.length, 2, 'Expected one pageview per distinct path load');
      requireEventWithFields(pageviews[1], false);
      assert.equal(pageviews[1].payload.anon_user_id, decodeURIComponent(firstState.bcUid), 'anon_user_id should remain stable');

      mark(name, true, 'Reused bc_uid and emitted is_new_user=false on second page');
      await context.close();
    }

    {
      const name = 'Session rollover validation';
      const { context, pageviews } = await createObservedContext(browser);
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const initial = await readState(page);

      await page.evaluate((ts) => {
        sessionStorage.setItem('bc_last_activity_at', String(ts));
      }, Date.now() - (5 * 60 * 1000));
      await page.goto(`${BASE_URL}/changelog.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const recent = await readState(page);

      await page.evaluate((ts) => {
        sessionStorage.setItem('bc_last_activity_at', String(ts));
      }, Date.now() - (SESSION_TIMEOUT_MS + 60 * 1000));
      await page.goto(`${BASE_URL}/trust.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const expired = await readState(page);

      assert.equal(recent.bcSid, initial.bcSid, 'Recent activity should reuse session id');
      assert.notEqual(expired.bcSid, recent.bcSid, 'Expired session should rotate session id');
      assert.equal(expired.bcUid, recent.bcUid, 'bc_uid should remain stable across session rollover');
      assert.equal(pageviews.length, 3, 'Expected one pageview per navigation in rollover test');

      mark(name, true, 'Reused recent session and rotated after 30+ minute inactivity');
      await context.close();
    }

    {
      const name = 'Test 3 - Analytics disabled before load';
      const { context, pageviews, cloudflareLoads } = await createObservedContext(browser, { noAnalyticsInit: true });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);

      const state = await readState(page);
      assert.equal(state.bcUid, '', 'bc_uid should not exist when analytics disabled');
      assert.equal(state.bcSid, '', 'bc_sid should be cleared when analytics disabled');
      assert.equal(state.lastActivity, '', 'last activity should be cleared when analytics disabled');
      assert.equal(pageviews.length, 0, 'No pageview should be sent when analytics disabled');
      assert.equal(cloudflareLoads.length, 0, 'Cloudflare script should not load when analytics disabled');

      mark(name, true, 'Suppressed cookie/session/pageview/cloudflare while opted out');
      await context.close();
    }

    {
      const name = 'Test 4 - Opt-out control works';
      const { context, pageviews } = await createObservedContext(browser);
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/privacy.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);

      await page.click('[data-analytics-optout]');
      await page.waitForTimeout(100);
      const afterOptOut = await readState(page);

      assert.equal(afterOptOut.noAnalytics, '1', 'Opt-out should set localStorage.noAnalytics');
      assert.equal(afterOptOut.bcUid, '', 'Opt-out should remove bc_uid');
      assert.equal(afterOptOut.bcSid, '', 'Opt-out should clear bc_sid');
      assert.equal(afterOptOut.lastActivity, '', 'Opt-out should clear activity timestamp');

      const pageviewsBeforeNav = pageviews.length;
      await page.goto(`${BASE_URL}/downloads.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      assert.equal(pageviews.length, pageviewsBeforeNav, 'No new pageview should be emitted after opt-out navigation');

      mark(name, true, 'Opt-out set preference and prevented subsequent pageview');
      await context.close();
    }

    {
      const name = 'Test 5 - Opt-in control works';
      const { context, pageviews } = await createObservedContext(browser, { noAnalyticsInit: true });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/privacy.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      assert.equal(pageviews.length, 0, 'Opted-out initial load should not emit pageview');

      await page.click('[data-analytics-optin]');
      await page.waitForTimeout(100);
      const afterOptIn = await readState(page);
      assert.equal(afterOptIn.noAnalytics, null, 'Opt-in should clear localStorage.noAnalytics');

      await page.goto(`${BASE_URL}/downloads.html`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      const resumed = await readState(page);

      assert.ok(resumed.bcUid, 'bc_uid should be recreated after opt-in on next navigation');
      assert.ok(pageviews.length >= 1, 'Pageview should resume after opt-in');
      requireEventWithFields(pageviews[0], true);

      mark(name, true, 'Opt-in cleared preference and resumed continuity/pageviews');
      await context.close();
    }

    {
      const name = 'Test 6 - Duplicate suppression still works';
      const { context, pageviews } = await createObservedContext(browser);
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await waitForIdle(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForIdle(page);

      assert.equal(pageviews.length, 1, 'Expected duplicate suppression to prevent fast same-path second emit');

      mark(name, true, 'Fast reload on same path did not emit duplicate pageview');
      await context.close();
    }
  } catch (err) {
    console.error('Test run failed:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (process.exitCode && process.exitCode !== 0) {
    return;
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\nCompleted ${results.length} checks; failures: ${failed.length}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run();

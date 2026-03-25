(function () {
    'use strict';

    var CLOUDFLARE_TOKEN = '22e6e7aa34d34328bd7219de69f5439c';
    var PAGEVIEW_ENDPOINT = '/metrics/pageview';
    var DEDUPE_WINDOW_MS = 3000;

    function hasDevModeCookie() {
        return document.cookie
            .split(';')
            .some(function (cookie) {
                return cookie.trim().indexOf('dev_mode=') === 0;
            });
    }

    function loadCloudflareAnalytics() {
        var script = document.createElement('script');
        script.defer = true;
        script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
        script.setAttribute('data-cf-beacon', '{"token": "' + CLOUDFLARE_TOKEN + '"}');
        document.head.appendChild(script);
    }

    function getDeviceType() {
        var ua = navigator.userAgent || '';
        var width = window.innerWidth || 0;

        if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
            return 'tablet';
        }

        if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua) || width < 768) {
            return 'mobile';
        }

        return 'desktop';
    }

    function shouldSuppressPageview(pathname, nowMs) {
        try {
            var lastPath = sessionStorage.getItem('last_path');
            var lastFiredAt = Number(sessionStorage.getItem('last_fired_at') || '0');
            var isDuplicate = lastPath === pathname && (nowMs - lastFiredAt) < DEDUPE_WINDOW_MS;

            if (!isDuplicate) {
                sessionStorage.setItem('last_path', pathname);
                sessionStorage.setItem('last_fired_at', String(nowMs));
            }

            return isDuplicate;
        } catch (err) {
            return false;
        }
    }

    function buildPayload() {
        var nowIso = new Date().toISOString();
        var params = new URLSearchParams(window.location.search || '');
        var utm = {};
        var source = params.get('utm_source');
        var medium = params.get('utm_medium');
        var campaign = params.get('utm_campaign');
        var content = params.get('utm_content');

        if (source) utm.source = source;
        if (medium) utm.medium = medium;
        if (campaign) utm.campaign = campaign;
        if (content) utm.content = content;

        var payload = {
            type: 'pageview',
            client_ts: nowIso,
            path: window.location.pathname,
            url: window.location.href,
            referrer: document.referrer || '',
            utm: utm,
            device: getDeviceType(),
            viewport: String(window.innerWidth || 0) + 'x' + String(window.innerHeight || 0),
            lang: navigator.language || '',
            tz: ''
        };

        var src = params.get('src');
        if (src) {
            payload.src = src;
        }

        try {
            payload.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (err) {
            payload.tz = '';
        }

        return payload;
    }

    function emitPageview(payload) {
        var body = JSON.stringify(payload);

        if (navigator.sendBeacon) {
            try {
                var blob = new Blob([body], { type: 'application/json' });
                var queued = navigator.sendBeacon(PAGEVIEW_ENDPOINT, blob);
                if (queued) {
                    return;
                }
            } catch (err) {
                // Fall through to fetch keepalive.
            }
        }

        if (window.fetch) {
            try {
                fetch(PAGEVIEW_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: body,
                    keepalive: true,
                    credentials: 'omit'
                }).catch(function () {
                    // Fire-and-forget: swallow ordinary network failures.
                });
            } catch (err) {
                // Fire-and-forget: swallow ordinary network failures.
            }
        }
    }

    if (hasDevModeCookie()) {
        return;
    }

    loadCloudflareAnalytics();

    var nowMs = Date.now();
    if (shouldSuppressPageview(window.location.pathname, nowMs)) {
        return;
    }

    emitPageview(buildPayload());
})();

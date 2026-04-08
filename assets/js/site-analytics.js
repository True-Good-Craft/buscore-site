(function () {
    'use strict';

    var CLOUDFLARE_TOKEN = '22e6e7aa34d34328bd7219de69f5439c';
    var EVENT_ENDPOINT = 'https://lighthouse.buscore.ca/metrics/event';
    var SITE_KEY = 'buscore';
    var DEDUPE_WINDOW_MS = 3000;
    var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    var ANON_COOKIE_NAME = 'bc_uid';
    var SESSION_ID_KEY = 'bc_sid';
    var SESSION_LAST_ACTIVITY_KEY = 'bc_last_activity_at';

    function hasDevModeCookie() {
        return document.cookie
            .split(';')
            .some(function (cookie) {
                return cookie.trim().indexOf('dev_mode=') === 0;
            });
    }

    function hasNoAnalyticsFlag() {
        try {
            return window.localStorage && window.localStorage.getItem('noAnalytics') === '1';
        } catch (err) {
            return false;
        }
    }

    function getCookie(name) {
        var cookies = document.cookie ? document.cookie.split(';') : [];
        var prefix = name + '=';

        for (var i = 0; i < cookies.length; i += 1) {
            var entry = cookies[i].trim();
            if (entry.indexOf(prefix) === 0) {
                return decodeURIComponent(entry.slice(prefix.length));
            }
        }

        return '';
    }

    function setCookie(name, value, options) {
        var parts = [name + '=' + encodeURIComponent(value)];

        if (options && options.expires) {
            parts.push('Expires=' + options.expires.toUTCString());
        }
        if (options && options.path) {
            parts.push('Path=' + options.path);
        }
        if (options && options.sameSite) {
            parts.push('SameSite=' + options.sameSite);
        }
        if (options && options.secure) {
            parts.push('Secure');
        }

        document.cookie = parts.join('; ');
    }

    function deleteCookie(name) {
        setCookie(name, '', {
            expires: new Date(0),
            path: '/',
            sameSite: 'Lax',
            secure: true
        });
    }

    function generateUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        var template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return template.replace(/[xy]/g, function (ch) {
            var rnd = Math.random() * 16 | 0;
            var val = ch === 'x' ? rnd : (rnd & 0x3 | 0x8);
            return val.toString(16);
        });
    }

    function getOrCreateAnonUserId() {
        var existing = getCookie(ANON_COOKIE_NAME);
        if (existing) {
            return {
                id: existing,
                isNewUser: false
            };
        }

        var created = generateUuid();
        var expires = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));
        setCookie(ANON_COOKIE_NAME, created, {
            expires: expires,
            path: '/',
            sameSite: 'Lax',
            secure: true
        });

        return {
            id: created,
            isNewUser: true
        };
    }

    function getOrCreateSessionId(nowMs) {
        var sessionId = '';
        var lastActivityMs = 0;

        try {
            sessionId = sessionStorage.getItem(SESSION_ID_KEY) || '';
            lastActivityMs = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || '0');
        } catch (err) {
            return {
                id: generateUuid()
            };
        }

        var isExpired = !lastActivityMs || (nowMs - lastActivityMs) > SESSION_TIMEOUT_MS;
        if (!sessionId || isExpired) {
            sessionId = generateUuid();
        }

        try {
            sessionStorage.setItem(SESSION_ID_KEY, sessionId);
            sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(nowMs));
        } catch (err) {
            // Continue without persisted session state.
        }

        return {
            id: sessionId
        };
    }

    function clearAnalyticsIdentityState() {
        deleteCookie(ANON_COOKIE_NAME);

        try {
            sessionStorage.removeItem(SESSION_ID_KEY);
            sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
            sessionStorage.removeItem('last_path');
            sessionStorage.removeItem('last_fired_at');
        } catch (err) {
            // Ignore storage failures.
        }
    }

    function setAnalyticsStatusText(isOptedOut) {
        var nodes = document.querySelectorAll('[data-analytics-status]');
        var text = isOptedOut ? 'Analytics is off for this browser.' : 'Analytics is on for this browser.';

        for (var i = 0; i < nodes.length; i += 1) {
            nodes[i].textContent = text;
        }
    }

    function bindAnalyticsControls() {
        var optOutButtons = document.querySelectorAll('[data-analytics-optout]');
        var optInButtons = document.querySelectorAll('[data-analytics-optin]');

        for (var i = 0; i < optOutButtons.length; i += 1) {
            optOutButtons[i].addEventListener('click', function (event) {
                event.preventDefault();
                try {
                    localStorage.setItem('noAnalytics', '1');
                } catch (err) {
                    // Ignore storage failures.
                }
                clearAnalyticsIdentityState();
                setAnalyticsStatusText(true);
            });
        }

        for (var j = 0; j < optInButtons.length; j += 1) {
            optInButtons[j].addEventListener('click', function (event) {
                event.preventDefault();
                try {
                    localStorage.removeItem('noAnalytics');
                } catch (err) {
                    // Ignore storage failures.
                }
                setAnalyticsStatusText(false);
            });
        }
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

    function shouldSuppressEvent(pathname, nowMs) {
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

    function buildPayload(anonState, sessionState) {
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
            site_key: SITE_KEY,
            type: 'page_view',
            client_ts: nowIso,
            path: window.location.pathname,
            url: window.location.href,
            referrer: document.referrer || '',
            utm: utm,
            device: getDeviceType(),
            viewport: String(window.innerWidth || 0) + 'x' + String(window.innerHeight || 0),
            lang: navigator.language || '',
            tz: '',
            anon_user_id: anonState.id,
            session_id: sessionState.id,
            is_new_user: anonState.isNewUser
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

    function emitEvent(payload) {
        var body = JSON.stringify(payload);

        if (navigator.sendBeacon) {
            try {
                var blob = new Blob([body], { type: 'application/json' });
                var queued = navigator.sendBeacon(EVENT_ENDPOINT, blob);
                if (queued) {
                    return;
                }
            } catch (err) {
                // Fall through to fetch keepalive.
            }
        }

        if (window.fetch) {
            try {
                fetch(EVENT_ENDPOINT, {
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

    bindAnalyticsControls();

    if (hasNoAnalyticsFlag()) {
        clearAnalyticsIdentityState();
        setAnalyticsStatusText(true);
        return;
    }

    setAnalyticsStatusText(false);

    if (hasDevModeCookie()) {
        return;
    }

    var anonState = getOrCreateAnonUserId();
    var sessionState = getOrCreateSessionId(Date.now());

    loadCloudflareAnalytics();

    var nowMs = Date.now();
    if (shouldSuppressEvent(window.location.pathname, nowMs)) {
        return;
    }

    emitEvent(buildPayload(anonState, sessionState));
})();

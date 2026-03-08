(() => {
    const MANIFEST_URL = 'https://lighthouse.buscore.ca/manifest/core/stable.json';
    const DOWNLOAD_URL = 'https://lighthouse.buscore.ca/download/latest';

    const titleEl = document.getElementById('latest-version-title');
    const downloadEl = document.getElementById('latest-download-link');
    const releaseDateEl = document.getElementById('latest-release-date');
    const shaEl = document.getElementById('latest-sha256');
    const sizeEl = document.getElementById('latest-size-bytes');
    const notesEl = document.getElementById('latest-release-notes');
    const notesWrapEl = document.getElementById('latest-release-notes-wrap');
    const statusEl = document.getElementById('manifest-status');

    const showStatus = (message) => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.hidden = false;
    };

    const formatSize = (bytes) => {
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        return `Size: ${mb} MB (${bytes} bytes)`;
    };

    if (downloadEl) {
        downloadEl.href = DOWNLOAD_URL;
    }

    fetch(MANIFEST_URL, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Manifest fetch failed');
            }
            return response.json();
        })
        .then((manifest) => {
            const latest = manifest && manifest.latest;
            const download = latest && latest.download;
            const version = latest && latest.version;
            const sizeBytes = Number(latest && latest.size_bytes);
            const sha256 = download && download.sha256;
            const releaseNotesUrl = latest && latest.release_notes_url;
            const semverPattern = /^\d+\.\d+\.\d+$/;

            const hasRequiredFields = typeof version === 'string' && version
                && Number.isFinite(sizeBytes) && sizeBytes > 0
                && typeof releaseNotesUrl === 'string' && releaseNotesUrl;

            if (!hasRequiredFields) {
                throw new Error('Manifest payload missing required fields');
            }

            if (!semverPattern.test(version)) {
                throw new Error('Invalid version format');
            }

            if (titleEl) {
                titleEl.textContent = `BUS Core v${version}`;
            }

            if (downloadEl) {
                downloadEl.textContent = `Download v${version}`;
            }

            if (releaseDateEl) {
                releaseDateEl.textContent = `BUS Core v${version}`;
            }

            if (shaEl) {
                shaEl.textContent = sha256 || 'Unavailable';
            }

            if (sizeEl) {
                sizeEl.textContent = formatSize(sizeBytes);
            }

            if (notesEl) {
                notesEl.href = releaseNotesUrl;
            }
        })
        .catch(() => {
            if (notesWrapEl) {
                notesWrapEl.hidden = true;
            }
            showStatus('Live release details are temporarily unavailable. You can still download the latest stable build.');
        });
})();

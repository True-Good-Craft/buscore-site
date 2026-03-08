(() => {
    const MANIFEST_URL = 'https://lighthouse.buscore.ca/manifest/core/stable.json';

    const titleEl = document.getElementById('latest-version-title');
    const downloadEl = document.getElementById('latest-download-link');
    const shaEl = document.getElementById('latest-sha256');
    const sizeEl = document.getElementById('latest-size-bytes');
    const notesEl = document.getElementById('latest-release-notes');
    const statusEl = document.getElementById('manifest-status');

    const showStatus = (message) => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.hidden = false;
    };

    const formatSize = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return `Size: ${mb.toFixed(1)} MB`;
    };

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
            const downloadUrl = download && download.url;
            const sha256 = download && download.sha256;
            const releaseNotesUrl = latest && latest.release_notes_url;

            const hasRequiredFields = typeof version === 'string' && version
                && typeof downloadUrl === 'string' && downloadUrl
                && typeof sha256 === 'string' && sha256
                && Number.isFinite(sizeBytes) && sizeBytes > 0
                && typeof releaseNotesUrl === 'string' && releaseNotesUrl;

            if (!hasRequiredFields) {
                throw new Error('Manifest payload missing required fields');
            }

            if (titleEl) {
                titleEl.textContent = `BUS Core v${version}`;
            }

            if (downloadEl) {
                downloadEl.textContent = `DOWNLOAD v${version}`;
                downloadEl.href = downloadUrl;
            }

            if (shaEl) {
                shaEl.textContent = sha256;
            }

            if (sizeEl) {
                sizeEl.textContent = formatSize(sizeBytes);
            }

            if (notesEl) {
                notesEl.href = releaseNotesUrl;
            }
        })
        .catch(() => {
            showStatus('Live release details are temporarily unavailable. Showing default download information.');
        });
})();

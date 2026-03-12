(() => {
    const MANIFEST_URL = 'https://lighthouse.buscore.ca/manifest/core/stable.json';

    const titleEl = document.getElementById('latest-version-title');
    const downloadEl = document.getElementById('latest-download-link');
    const shaEl = document.getElementById('latest-sha256');
    const sizeEl = document.getElementById('latest-size-bytes');
    const notesEl = document.getElementById('latest-release-notes');
    const statusEl = document.getElementById('manifest-status');
    const historyContainerEl = document.getElementById('release-history');

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

    const renderReleaseHistory = (history) => {
        if (!historyContainerEl || !Array.isArray(history) || history.length <= 1) {
            return;
        }

        historyContainerEl.textContent = '';

        history.slice(1).forEach((release) => {
            if (!release || typeof release.version !== 'string' || !release.version) {
                return;
            }

            const downloadUrl = release.url
                || (release.download && release.download.url)
                || '';
            const releaseNotesUrl = release.release_notes_url || '';

            if (typeof downloadUrl !== 'string' || !downloadUrl) {
                return;
            }

            const row = document.createElement('div');
            const notesHtml = typeof releaseNotesUrl === 'string' && releaseNotesUrl
                ? `<a href="${releaseNotesUrl}" class="release-notes">Notes</a>`
                : '';

            row.innerHTML = `
                <div class="release-row">
                    <span class="release-version">v${release.version}</span>
                    <a href="${downloadUrl}" class="release-download">Download</a>
                    ${notesHtml}
                </div>
            `;

            historyContainerEl.appendChild(row);
        });
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
            const history = manifest && manifest.history;
            const download = latest && latest.download;
            const version = latest && latest.version;
            const sizeBytes = Number(latest && latest.size_bytes);
            const sha256 = download && download.sha256;
            const releaseNotesUrl = latest && latest.release_notes_url;

            const hasRequiredFields = typeof version === 'string' && version
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

            renderReleaseHistory(history);
        })
        .catch(() => {
            showStatus('Live release details are temporarily unavailable. Showing default download information.');
        });
})();

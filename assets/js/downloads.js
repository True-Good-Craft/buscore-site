(() => {
    const MANIFEST_URL = 'https://lighthouse.buscore.ca/manifest/core/stable.json';

    const titleEl = document.getElementById('latest-version-title');
    const downloadEl = document.getElementById('latest-download-link');
    const shaEl = document.getElementById('latest-sha256');
    const sizeEl = document.getElementById('latest-size-bytes');
    const notesEl = document.getElementById('latest-release-notes');
    const statusEl = document.getElementById('manifest-status');
    const historySectionEl = document.getElementById('release-history-section');
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

    const formatReleaseSize = (bytes) => {
        const value = Number(bytes);
        if (!Number.isFinite(value) || value <= 0) {
            return '';
        }
        return formatSize(value);
    };

    const renderReleaseHistory = (history, latestVersion) => {
        if (!historyContainerEl || !Array.isArray(history) || history.length === 0) {
            return;
        }

        historyContainerEl.textContent = '';
        let renderedCount = 0;

        history.forEach((release) => {
            if (!release || typeof release !== 'object') {
                return;
            }

            if (!release || typeof release.version !== 'string' || !release.version) {
                return;
            }

            if (latestVersion && release.version === latestVersion) {
                return;
            }

            const downloadUrl = release.url
                || (release.download && release.download.url)
                || '';
            const releaseNotesUrl = release.release_notes_url || '';
            const sizeText = formatReleaseSize(release.size_bytes);

            if (typeof downloadUrl !== 'string' || !downloadUrl) {
                return;
            }

            const row = document.createElement('div');
            const notesHtml = typeof releaseNotesUrl === 'string' && releaseNotesUrl
                ? `<a href="${releaseNotesUrl}" class="release-notes">Notes</a>`
                : '';
            const sizeHtml = sizeText
                ? `<span class="version-meta">${sizeText}</span>`
                : '';

            row.innerHTML = `
                <div class="release-row">
                    <span class="release-version">v${release.version}</span>
                    ${sizeHtml}
                    <a href="${downloadUrl}" class="release-download">Download</a>
                    ${notesHtml}
                </div>
            `;

            historyContainerEl.appendChild(row);
            renderedCount += 1;
        });

        if (historySectionEl) {
            historySectionEl.hidden = renderedCount === 0;
        }
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

            renderReleaseHistory(history, version);
        })
        .catch(() => {
            showStatus('Live release details are temporarily unavailable. Showing default download information.');
        });
})();

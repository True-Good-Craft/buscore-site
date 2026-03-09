(() => {
    const MANIFEST_URL = 'https://lighthouse.buscore.ca/manifest/core/stable.json';

    const titleEl = document.getElementById('latest-version-title');
    const downloadEl = document.getElementById('latest-download-link');
    const shaEl = document.getElementById('latest-sha256');
    const sizeEl = document.getElementById('latest-size-bytes');
    const notesEl = document.getElementById('latest-release-notes');
    const statusEl = document.getElementById('manifest-status');
    const latestSectionEl = document.querySelector('.download-latest');

    const ensurePreviousReleasesList = () => {
        let listEl = document.getElementById('previous-releases');
        if (listEl || !latestSectionEl) {
            return listEl;
        }

        listEl = document.createElement('ul');
        listEl.id = 'previous-releases';
        latestSectionEl.appendChild(listEl);
        return listEl;
    };

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

    const renderPreviousReleases = (history, latestVersion) => {
        if (!Array.isArray(history) || history.length === 0) {
            return;
        }

        const listEl = ensurePreviousReleasesList();
        if (!listEl) {
            return;
        }

        listEl.textContent = '';

        const releases = history
            .filter((entry) => entry && typeof entry.version === 'string' && entry.version)
            .filter((entry, index) => !(index === 0 && entry.version === latestVersion))
            .slice(0, 5);

        releases.forEach((entry) => {
            const download = entry && entry.download;
            const downloadUrl = download && download.url;
            const releaseNotesUrl = entry && entry.release_notes_url;

            if (typeof downloadUrl !== 'string' || !downloadUrl) {
                return;
            }

            const itemEl = document.createElement('li');
            itemEl.append(`BUS Core v${entry.version} `);

            const downloadLinkEl = document.createElement('a');
            downloadLinkEl.href = downloadUrl;
            downloadLinkEl.textContent = 'Download';
            itemEl.appendChild(downloadLinkEl);

            if (typeof releaseNotesUrl === 'string' && releaseNotesUrl) {
                itemEl.append(' ');
                const notesLinkEl = document.createElement('a');
                notesLinkEl.href = releaseNotesUrl;
                notesLinkEl.textContent = 'Notes';
                itemEl.appendChild(notesLinkEl);
            }

            listEl.appendChild(itemEl);
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

            renderPreviousReleases(history, version);
        })
        .catch(() => {
            showStatus('Live release details are temporarily unavailable. Showing default download information.');
        });
})();

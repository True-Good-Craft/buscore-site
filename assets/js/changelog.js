(() => {
    const RELEASES_URL = '/assets/data/releases.json';
    const MAX_RELEASES = 10;

    const listEl = document.getElementById('release-list');
    const statusEl = document.getElementById('release-status');

    const showStatus = (message) => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.hidden = false;
    };

    const normalizeLines = (notes) => {
        if (typeof notes !== 'string' || !notes.trim()) {
            return [];
        }

        const lines = [];
        let inCodeBlock = false;

        notes.split(/\r?\n/).forEach((rawLine) => {
            const line = rawLine.trimEnd();
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }
            if (inCodeBlock) {
                return;
            }
            if (!line.trim()) {
                return;
            }
            lines.push(line.trim());
        });

        return lines;
    };

    const formatDate = (release) => {
        if (release && typeof release.published_date === 'string' && release.published_date) {
            return release.published_date;
        }

        const parsed = Date.parse(release && release.published_at ? release.published_at : '');
        if (Number.isNaN(parsed)) {
            return '';
        }

        return new Date(parsed).toISOString().slice(0, 10);
    };

    const renderRelease = (release) => {
        if (!release || typeof release !== 'object') {
            return null;
        }

        const section = document.createElement('section');
        section.className = 'release';

        const heading = document.createElement('h2');
        const title = typeof release.title === 'string' && release.title
            ? release.title
            : (release.version || release.tag || 'Untitled Release');
        heading.textContent = title;
        section.appendChild(heading);

        const dateText = formatDate(release);
        if (dateText) {
            const dateEl = document.createElement('p');
            dateEl.className = 'release-date';
            dateEl.textContent = dateText;
            section.appendChild(dateEl);
        }

        if (typeof release.url === 'string' && release.url) {
            const sourceEl = document.createElement('p');
            sourceEl.className = 'version-meta';

            const sourceLink = document.createElement('a');
            sourceLink.href = release.url;
            sourceLink.textContent = 'View on GitHub';

            sourceEl.appendChild(sourceLink);
            section.appendChild(sourceEl);
        }

        const lines = normalizeLines(release.notes);
        if (lines.length) {
            const list = document.createElement('ul');

            lines.forEach((line) => {
                const item = document.createElement('li');
                item.textContent = line.replace(/^#{1,6}\s+/, '').replace(/^[-*]\s+/, '');
                list.appendChild(item);
            });

            section.appendChild(list);
        }

        return section;
    };

    fetch(RELEASES_URL, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to fetch generated releases');
            }
            return response.json();
        })
        .then((payload) => {
            if (!listEl) {
                return;
            }

            listEl.textContent = '';

            const releases = Array.isArray(payload && payload.releases)
                ? payload.releases.slice(0, MAX_RELEASES)
                : [];

            if (!releases.length) {
                showStatus('Release history is temporarily unavailable.');
                return;
            }

            releases.forEach((release) => {
                const node = renderRelease(release);
                if (node) {
                    listEl.appendChild(node);
                }
            });

            if (!listEl.childElementCount) {
                showStatus('Release history is temporarily unavailable.');
            }
        })
        .catch(() => {
            showStatus('Release history is temporarily unavailable.');
        });
})();

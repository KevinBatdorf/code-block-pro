import copy from 'copy-to-clipboard';

const containerClass = '.wp-block-kevinbatdorf-code-block-pro';

const sanitize = (str) =>
    str
        .replace(/[\u2018\u2019]/g, "'") // single quotes
        .replace(/[\u201C\u201D]/g, '"') // double quotes
        .replace(/[\u2013\u2014]/g, '-') // en/em dash
        .replace(/\u2026/g, '...') // ellipsis
        .replace(/[\u2039\u203A\u00AB\u00BB]/g, (c) =>
            c === '‹' || c === '«' ? '<' : '>',
        )
        .replace(/\u00A0/g, ' '); // non-breaking space

const handleCopyButton = () => {
    const buttons = Array.from(
        document.querySelectorAll(
            '.code-block-pro-copy-button:not(.cbp-cb-loaded)',
        ),
    );
    buttons.forEach((button) => {
        button.classList.add('cbp-cb-loaded');
        // Setting it to block here lets users deactivate the plugin safely
        button.style.display = 'block';
        const handler = (event) => {
            const { type, key, currentTarget: b } = event;
            // if keydown event, make sure it's enter or space
            if (type === 'keydown' && !['Enter', ' '].includes(key)) return;
            event.preventDefault();
            const t = b?.querySelector('textarea');
            const source = t ? t?.value : b?.dataset?.code;
            const code = b?.dataset?.encoded
                ? decodeURIComponent(decodeURIComponent(source))
                : source;
            const content = sanitize(
                window.cbpCopyOverride?.(code, button) ?? code,
            );
            copy(content ?? '', {
                format: 'text/plain',
                onCopy: (code) => {
                    window.cbpCopyCallback?.(code, button);
                    b.classList.add('cbp-copying');
                    // Check if there is a data-text-copied attribute
                    const hasTextCopied = b.dataset.copiedText;
                    const innerSpan = b.querySelector('span');
                    if (hasTextCopied) innerSpan.innerText = hasTextCopied;
                    setTimeout(() => {
                        b.classList.remove('cbp-copying');
                        if (hasTextCopied) {
                            innerSpan.innerText = b.getAttribute('aria-label');
                        }
                    }, 2_000);
                },
            });
        };
        ['click', 'keydown'].forEach((evt) =>
            button.addEventListener(evt, handler),
        );
    });
};

const handleHighlighter = () => {
    const codeBlocks = Array.from(
        document.querySelectorAll(`${containerClass}:not(.cbp-hl-loaded)`),
    );

    codeBlocks.forEach((codeBlock) => {
        codeBlock.classList.add('cbp-hl-loaded');
        // Search for highlights
        const highlighters = new Set(
            codeBlock.querySelectorAll('.cbp-line-highlight'),
        );
        // If the codeblock has .cbp-highlight-hover, then get all lines
        if (codeBlock.classList.contains('cbp-highlight-hover')) {
            codeBlock
                .querySelectorAll('span.line')
                .forEach((line) => highlighters.add(line));
        }

        if (!highlighters.size) return;

        // If the code block expands, we need to recalculate the width
        new ResizeObserver(() => {
            // find the longest line
            const lines = codeBlock.querySelectorAll('span.line');
            codeBlock.style.setProperty('--cbp-block-width', 'unset');
            const longestLine = Array.from(lines).reduce((a, b) =>
                a.offsetWidth > b.offsetWidth ? a : b,
            );
            const highestLineHeight = Array.from(lines).reduce((a, b) =>
                a.offsetHeight > b.offsetHeight ? a : b,
            );
            codeBlock.style.setProperty(
                '--cbp-block-height',
                highestLineHeight.offsetHeight + 'px',
            );
            codeBlock.style.setProperty(
                '--cbp-block-width',
                longestLine.offsetWidth + 'px',
            );
        }).observe(codeBlock);

        // Add the highlighter if not already there
        highlighters.forEach((highlighter) => {
            if (highlighter.querySelector('.cbp-line-highlighter')) return;
            highlighter.insertAdjacentHTML(
                'beforeend',
                '<span aria-hidden="true" class="cbp-line-highlighter"></span>',
            );
        });
    });
};

const handleFontLoading = () => {
    if (!window.codeBlockPro?.pluginUrl) return;
    const elements = Array.from(
        document.querySelectorAll(
            '[data-code-block-pro-font-family]:not(.cbp-ff-loaded)',
        ) || [],
    );
    elements.forEach((e) => e.classList.add('cbp-ff-loaded'));
    const fontsToLoad = new Set(
        elements.map((f) => f.dataset.codeBlockProFontFamily).filter(Boolean),
    );
    [...fontsToLoad].forEach(async (fontName) => {
        const [name, ext] = fontName.split('.');
        const url = `url(${window.codeBlockPro.pluginUrl}/build/fonts/${name}.${
            ext || 'woff2'
        })`;
        const font = new FontFace(name, url);
        await font.load().catch((e) => console.error(e));
        document.fonts.add(font);
    });
};

const handleSeeMore = () => {
    const seeMoreLines = Array.from(
        document.querySelectorAll(
            `${containerClass}:not(.cbp-see-more-loaded) .cbp-see-more-line`,
        ),
    );
    seeMoreLines.forEach((line) => {
        const currentContainer = line.closest(containerClass);
        currentContainer.classList.add('cbp-see-more-loaded');
        const pre = line.closest('pre');
        const initialHeight = pre.offsetHeight;
        let animationSpeed = 0;
        const transition = line.classList.contains('cbp-see-more-transition');

        if (transition) {
            const lineCount = pre.querySelectorAll('code > *').length;
            const linesBeforeCurrent = Array.from(
                line.closest('code').children,
            ).filter((l) => l.offsetTop < line.offsetTop)?.length;
            animationSpeed = 0.5 + (lineCount - linesBeforeCurrent) * 0.01;
            pre.style.transition = `max-height ${animationSpeed}s ease-out`;
        }

        // if the first child it a span then get the height of that span
        const headerHeight =
            currentContainer.children[0].tagName === 'SPAN'
                ? currentContainer.children[0].offsetHeight
                : 0;
        const lineHeight = parseFloat(window.getComputedStyle(line).lineHeight);
        pre.style.maxHeight = `${line.offsetTop + lineHeight - headerHeight}px`;

        const buttonContainer = line
            .closest(containerClass)
            .querySelector('.cbp-see-more-container');
        if (!buttonContainer) return;
        buttonContainer.style.display = 'flex';
        const button = buttonContainer.querySelector(
            '.cbp-see-more-simple-btn',
        );
        if (!button) return;
        // Starts off collapsed
        button.setAttribute('aria-expanded', 'false');
        pre.id = `cbp-see-more-${Math.random().toString(36).slice(2)}`;
        button.setAttribute('aria-controls', pre.id);
        if (currentContainer.classList.contains('padding-disabled')) {
            button.classList.remove('cbp-see-more-simple-btn-hover');
        }

        const handle = (event) => {
            event.preventDefault();
            // disable scrolling
            pre.style.setProperty('overflow', 'hidden', 'important');
            setTimeout(() => {
                pre.style.overflow = 'auto';
            }, animationSpeed * 1000);

            pre.style.maxHeight = `${initialHeight}px`;
            // If there is data-see-more-collapse-string then we toggle
            if (!buttonContainer.dataset?.seeMoreCollapseString) {
                buttonContainer.remove();
                return;
            }
            // We're letting them collapse it
            if (button.getAttribute('aria-expanded') === 'true') {
                button.setAttribute('aria-expanded', 'false');
                button.innerText = buttonContainer.dataset.seeMoreString;
                pre.style.maxHeight = `${line.offsetTop + lineHeight - headerHeight}px`;

                // Move the scroll so the button is in center view
                line.scrollIntoView({
                    behavior: transition ? 'smooth' : 'auto',
                    block: 'center',
                });
                return;
            }
            button.setAttribute('aria-expanded', 'true');
            button.innerText = buttonContainer.dataset.seeMoreCollapseString;
        };
        button.addEventListener('click', handle);
        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') handle(event);
        });
    });
};

const init = () => {
    handleFontLoading();
    handleSeeMore();
    handleCopyButton();
    handleHighlighter();
};

// Functions are idempotent, so we can run them on load, DOMContentLoaded, et al.
init();
// Useful for when the DOM is modified or loaded in late
window.codeBlockProInit = init;
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', init);

import copy from 'copy-to-clipboard';

const containerClass = '.wp-block-kevinbatdorf-code-block-pro';

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
            const { type, key, target } = event;
            // if keydown event, make sure it's enter or space
            if (type === 'keydown' && !['Enter', ' '].includes(key)) return;
            event.preventDefault();
            const b = target?.closest('span');
            copy(b?.dataset?.code ?? '', {
                format: 'text/plain',
            });
            b.classList.add('copying');
            setTimeout(() => {
                b.classList.remove('copying');
            }, 2000);
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
                .forEach((line) => console.log(line) || highlighters.add(line));
        }

        if (!highlighters.size) return;

        // We need to track the block width so we can adjust the
        // highlighter width in case of overflow
        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                // get width of inner code block
                codeBlock.style.setProperty('--cbp-block-width', '0');
                const codeWidth =
                    entry.target.querySelector('code').offsetWidth;
                const computed =
                    codeWidth + 16 === entry.target.scrollWidth
                        ? codeWidth + 16
                        : entry.target.scrollWidth + 16;
                codeBlock.style.setProperty(
                    '--cbp-block-width',
                    `${computed}px`,
                );
            });
        });
        resizeObserver.observe(codeBlock);

        console.log(highlighters);

        // add the highlighter
        highlighters.forEach((highlighter) => {
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
        const font = new FontFace(
            fontName,
            `url(${window.codeBlockPro.pluginUrl}/build/fonts/${fontName}.woff2)`,
        );
        await font.load();
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

        if (line.classList.contains('cbp-see-more-transition')) {
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
        if (currentContainer.classList.contains('padding-disabled')) {
            button.classList.remove('cbp-see-more-simple-btn-hover');
        }
        button.style.transition = `all ${
            Math.max(animationSpeed, 1) / 1.5
        }s linear`;

        const handle = (event) => {
            event.preventDefault();
            button.classList.remove('cbp-see-more-simple-btn-hover');
            pre.style.maxHeight = initialHeight + 'px';
            setTimeout(() => {
                button.style.opacity = 0;
                button.style.transform = 'translateY(-100%)';
                setTimeout(
                    () => button.remove(),
                    Math.max(animationSpeed, 1) * 1000,
                );
            }, animationSpeed * 1000);
        };
        button.addEventListener('click', handle);
        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') handle(event);
        });
    });
};

const init = () => {
    handleSeeMore();
    handleCopyButton();
    handleHighlighter();
    handleFontLoading();
};

// Functions are idempotent, so we can run them on load and DOMContentLoaded
init();
// Useful for when the DOM is modified or loaded in late
window.codeBlockProInit = init;
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', init);

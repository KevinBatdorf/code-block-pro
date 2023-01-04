import copy from 'copy-to-clipboard';

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
        button.addEventListener('click', (event) => {
            const b = event.target?.closest('span');
            copy(b?.dataset?.code ?? '', {
                format: 'text/plain',
            });
            b.classList.add('copying');
            setTimeout(() => {
                b.classList.remove('copying');
            }, 2000);
        });
    });
};

const handleHighlighter = () => {
    const codeBlocks = Array.from(
        document.querySelectorAll(
            '.wp-block-kevinbatdorf-code-block-pro pre:not(.cbp-hl-loaded)',
        ),
    );

    codeBlocks.forEach((codeBlock) => {
        codeBlock.classList.add('cbp-hl-loaded');
        // Search for highlights
        const highlighters = codeBlock.querySelectorAll('.cbp-line-highlight');
        if (!highlighters.length) return;

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

const init = () => {
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

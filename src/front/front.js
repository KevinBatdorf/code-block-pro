import copy from 'copy-to-clipboard';

// Handle copy button
addEventListener('DOMContentLoaded', () => {
    const buttons = Array.from(
        document.querySelectorAll('.code-block-pro-copy-button'),
    );
    buttons.forEach((button) => {
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
});

// Handle highlighter
addEventListener('DOMContentLoaded', () => {
    const codeBlocks = Array.from(
        document.querySelectorAll('.wp-block-kevinbatdorf-code-block-pro pre'),
    );

    codeBlocks.forEach((codeBlock) => {
        // search for highlights
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
});

// Handle font loading
addEventListener('DOMContentLoaded', () => {
    if (!window.codeBlockPro?.pluginUrl) return;
    const fontsToLoad = new Set(
        Array.from(
            document.querySelectorAll('[data-code-block-pro-font-family]') ??
                [],
        )
            .map((f) => f.dataset.codeBlockProFontFamily)
            .filter(Boolean),
    );
    [...fontsToLoad].forEach(async (fontName) => {
        const font = new FontFace(
            fontName,
            `url(${window.codeBlockPro.pluginUrl}/build/fonts/${fontName}.woff2)`,
        );
        await font.load();
        document.fonts.add(font);
    });
});

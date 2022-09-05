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

import copy from 'copy-to-clipboard';

addEventListener('DOMContentLoaded', () => {
    const buttons = Array.from(
        document.querySelectorAll('.code-block-pro-copy-button'),
    );
    buttons.forEach((button) => {
        // Setting it to block here lets users deactivate the plugin safely
        button.style.display = 'block';
        button.addEventListener('click', (event) => {
            const b = event.target?.closest('button');
            copy(b?.dataset?.code ?? '');
            b.classList.add('copying');
            setTimeout(() => {
                b.classList.remove('copying');
            }, 1000);
        });
    });
});

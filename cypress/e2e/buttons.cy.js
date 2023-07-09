beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Copy button', () => {
    it('Renders in the code block', () => {
        cy.openSideBarPanel('Buttons');

        cy.get('[data-cy="copy-button"]').should('exist').should('be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'Copy');

        cy.get('[data-cy="copy-button"]').uncheck();
        cy.get('[data-cy="copy-button"]').should('not.be.checked');

        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('not.contain', 'Copy');
    });

    it('Can switch buttons', () => {
        cy.openSideBarPanel('Buttons');

        cy.get('[data-cy="copy-button"]').should('exist').should('be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'M9 5H7a2 2 0 00-2 2v12a2') // Clipboard.js
            .should('not.contain', 'M16.5 8.25V6a2.25 2.25'); // TwoSquares.js

        cy.get('#code-block-pro-copy-button-heroicons')
            .should('exist')
            .should('have.attr', 'aria-current', 'true');

        cy.get('#code-block-pro-copy-button-twoSquares').should('exist');
        cy.get('#code-block-pro-copy-button-twoSquares').click();

        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'M16.5 8.25V6a2.25 2.25') // TwoSquares.js
            .should('not.contain', 'M9 5H7a2 2 0 00-2 2v12a2'); // Clipboard.js
    });

    it('Hides buttons when unchecked', () => {
        cy.openSideBarPanel('Buttons');

        cy.get('[data-cy="copy-button"]').should('exist').should('be.checked');
        cy.get('#code-block-pro-copy-button-heroicons').should('exist');

        cy.get('[data-cy="copy-button"]').uncheck();
        cy.get('[data-cy="copy-button"]').should('not.be.checked');
        cy.get('#code-block-pro-copy-button-heroicons').should('not.exist');
    });

    it('Copies code on click', () => {
        const text = 'const foo = "bar";';
        cy.addCode(text);
        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro [aria-label="Copy"]')
            .should('exist')
            .realClick();
        cy.window().then((win) => {
            win.navigator.clipboard.readText().then((clipText) => {
                expect(clipText).to.equal(text);
            });
        });
    });

    it('Copies uri decoded code on click', () => {
        const text = '<script>&lt;</script>';
        cy.openSideBarPanel('Extra Settings');
        cy.get('[data-cy="use-decode-uri"]').check();

        cy.addCode(text);

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro [aria-label="Copy"]')
            .should('exist')
            .realClick();
        cy.window().then((win) => {
            win.navigator.clipboard.readText().then((clipText) => {
                expect(clipText).to.equal(text);
            });
        });
    });

    // Doesn't seem to work 🤷
    // it.only('Copies code on keypress', () => {
    //     const text = 'const foo = "bar";';
    //     cy.addCode(text);
    //     cy.previewCurrentPage();

    //     cy.window().then((win) => {
    //         // First add some gibberish to the clipboard
    //         win.navigator.clipboard.writeText('heyyooooo');
    //         win.navigator.clipboard.readText().then((clipText) => {
    //             expect(clipText).to.not.equal(text);
    //         });
    //         cy.get('.wp-block-kevinbatdorf-code-block-pro [aria-label="Copy"]')
    //             .should('exist')
    //             .focus()
    //             .realPress('Enter');
    //         win.navigator.clipboard.readText().then((clipText) => {
    //             expect(clipText).to.equal(text);
    //         });
    //     });
    // });
});

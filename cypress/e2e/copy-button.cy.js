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
        cy.openSideBarPanel('Extra Settings');

        cy.get('[data-cy="copy-button"]').should('exist').should('be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'Copy');

        cy.get('[data-cy="copy-button"]').uncheck().should('not.be.checked');

        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('not.contain', 'Copy');
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

    // Does seem to work 🤷
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

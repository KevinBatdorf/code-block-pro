beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.findBlock('code-block-pro').should('exist');

    cy.focusBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    );
    cy.findBlock('code-block-pro', 'textarea').should('have.focus');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('RTL', () => {
    it('Renders code LTR', () => {
        cy.addCode('const foo = "bar";');
        // check ltr
        cy.findBlock('code-block-pro').should('have.css', 'direction', 'ltr');

        // update language
        cy.saveDraft();
        cy.switchWpLang('fa_AF');
        cy.reload();

        // assert code is still ltr
        cy.findBlock('code-block-pro').should('have.css', 'direction', 'ltr');

        // preview page and assert code is ltr
        cy.previewCurrentPage();
        cy.get('.wp-block-kevinbatdorf-code-block-pro').should(
            'have.css',
            'direction',
            'ltr',
        );
    });
});

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
context('Miscellaneous', () => {
    it('Persists settings', () => {
        cy.addCode('const foo = "bar";');
        cy.setTheme('dracula');
        cy.getPostContent('.wp-block[class$="code-block-pro"] pre')
            .invoke('html')
            .should('contain', '<span style="color: #FF79C6">const</span>');

        cy.previewCurrentPage(); // to save and move on

        cy.visitNewPageEditor();
        cy.addBlock('kevinbatdorf/code-block-pro');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

        // confirm theme is persisted
        cy.addCode('const foo = "bar";');
        cy.getPostContent('.wp-block[class$="code-block-pro"] pre')
            .invoke('html')
            .should('contain', '<span style="color: #FF79C6">const</span>');
    });
});

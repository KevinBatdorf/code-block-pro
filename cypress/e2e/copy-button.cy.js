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
});

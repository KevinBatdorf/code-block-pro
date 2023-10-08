beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.loginUser();
    cy.visitNewPostEditor();
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Permissions', () => {
    it('Warning shows when cap is missing', () => {
        cy.addBlock('kevinbatdorf/code-block-pro');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'capability is required to edit this block');
    });

    it('Prevents updating attributes', () => {
        cy.addBlock('kevinbatdorf/code-block-pro');
        cy.openSideBarPanel('Line Settings');

        // ported from lines spec with the final assertions updated
        cy.get('[data-cy="show-line-numbers"]')
            .should('exist')
            .should('not.be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'not.have.class',
            'cbp-has-line-numbers',
        );

        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'not.have.class', // changed here
            'cbp-has-line-numbers',
        );
    });
});

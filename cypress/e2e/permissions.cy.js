beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.intercept(
        'GET',
        '/index.php?rest_route=%2Fcode-block-pro%2Fv1%2Fcan-save-html&_locale=user',
        {
            body: false,
        },
    ).as('canSaveHtml');
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
        cy.wait('@canSaveHtml');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'capability is required');
    });

    it('Prevents updating attributes', () => {
        cy.addBlock('kevinbatdorf/code-block-pro');

        cy.wait('@canSaveHtml');

        cy.get('[data-cy="show-line-numbers"]').should('not.exist');
    });
});

before(() => {
    cy.resetDatabase();
    cy.loginUser();
});
beforeEach(() => {
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
});
after(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Language checks', () => {
    it('Renders properly when switching languages', () => {
        cy.addCode('const foo = "bar";');
        cy.setTheme('nord');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #81A1C1">const</span>');

        // Switch to ruby
        cy.setLanguage('ruby');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should(
                'contain',
                '<span style="color: #D8DEE9FF">const foo </span>',
            );
    });
});

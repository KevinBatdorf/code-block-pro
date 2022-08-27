// Check support/globals.js for some default checks
// as well as start up and clean up methods
beforeEach(() => {
    cy.addBlock('code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
});
context('Language checks', () => {
    it('Renders properly when switching languages', () => {
        cy.addCode('const foo = "bar";');
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

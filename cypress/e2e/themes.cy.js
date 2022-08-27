// Check support/globals.js for some default checks
// as well as start up and clean up methods
beforeEach(() => {
    cy.addBlock('code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
});
context('Theme checks', () => {
    it('Renders properly when switching themes', () => {
        // Nord is the default
        cy.addCode('const foo = "bar";');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #81A1C1">const</span>');

        cy.setTheme('dracula');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #FF79C6">const</span>');

        cy.setTheme('rose-pine-dawn');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #286983">const</span>');

        cy.setTheme('poimandres');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #91B4D5">const</span>');
    });
});

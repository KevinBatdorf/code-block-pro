beforeEach(() => {
    cy.resetDatabase();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.findBlock('code-block-pro').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.findBlock('code-block-pro', 'textarea').should('have.focus');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Headers', () => {
    it('Renders default header and can switch', () => {
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', 'fill="#FF5F56" stroke="#E0443E"');
        cy.setHeader('headlightsMuted');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('not.contain', 'fill="#FF5F56" stroke="#E0443E"')
            .should('contain', 'fill="#d8dee933" stroke="#d8dee94d"');
    });
    it('Can accept text inputs on some headers', () => {
        cy.setHeader('simpleString');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', 'JavaScript');
        cy.setLanguage('ruby');
        cy.findBlock('code-block-pro').invoke('html').should('contain', 'Ruby');
        cy.openSideBarPanel('Settings');
        cy.get('#code-block-pro-header-text')
            .should('exist')
            .should('have.value', '')
            .type('Hello WordPress');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', 'Hello WordPress')
            .should('not.contain', 'Ruby')
            .should('not.contain', 'JavaScript');
    });
});

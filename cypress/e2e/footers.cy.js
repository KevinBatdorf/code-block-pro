beforeEach(() => {
    cy.resetDatabase();
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
context('Footers', () => {
    it('Renders no footer on insert and can swap', () => {
        cy.findBlock('code-block-pro')
            .find('div')
            .first()
            .siblings()
            .should('have.length', 2);
        cy.setFooter('simpleStringEnd');
        cy.findBlock('code-block-pro')
            .find('div')
            .first()
            .siblings()
            .should('have.length', 3);
        cy.setFooter('none');
        cy.findBlock('code-block-pro')
            .find('div')
            .first()
            .siblings()
            .should('have.length', 2);
    });

    it('Can accept text inputs on some footers', () => {
        // Remove the header/footer if there
        cy.setHeader('none');
        cy.setFooter('none');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('not.contain', 'JavaScript');
        cy.setFooter('simpleStringEnd');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', 'JavaScript');
        cy.setLanguage('ruby');
        cy.findBlock('code-block-pro').invoke('html').should('contain', 'Ruby');
        cy.openSideBarPanel('Settings');
        cy.get('#code-block-pro-footer-text')
            .should('exist')
            .should('have.value', '')
            .type('foo-bar-baz-lets-go');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', 'foo-bar-baz-lets-go')
            .should('not.contain', 'Ruby')
            .should('not.contain', 'JavaScript');
    });
});

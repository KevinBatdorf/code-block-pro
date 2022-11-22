context('Compatability checks', () => {
    before(() => {
        cy.loginUser();
    });
    after(() => {
        // make sure we can uninstall prismatic
        cy.uninstallPlugin('prismatic');
        cy.logoutUser();
    });
    it('Installs alongside Prismatic with no errors', () => {
        cy.installPlugin('prismatic');
        // make sure we don't see thhe word fatal or error
        cy.get('body').should('not.contain', 'fatal error');
        // make sure both prismatic and code-block-pro are active
        cy.get('#deactivate-code-block-pro').should('exist');
        cy.get('#deactivate-prismatic').should('exist');
    });
});

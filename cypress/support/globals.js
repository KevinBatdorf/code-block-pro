// Preserve WP cookies
Cypress.Cookies.defaults({
    preserve: /wordpress/,
});

// Make sure no errors
Cypress.on('window:before:load', (win) => {
    cy.spy(win.console, 'error');
});
afterEach(() => {
    cy.window().then((win) => {
        expect(win.console.error).to.have.callCount(0);
    });
});

beforeEach(() => {
    cy.loginUser();
    cy.visitNewPageEditor();
});

afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    // cy.uninstallPlugin('rust-starter')
    cy.logoutUser();
});

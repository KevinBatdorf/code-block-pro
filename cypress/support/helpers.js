// This will let you set the text of an imput
// with get('.foo').text('bar')
Cypress.Commands.add('text', { prevSubject: true }, (subject, text) => {
    subject.val(text);
    return cy.wrap(subject);
});
Cypress.Commands.add('clearBrowserStorage', () => {
    cy.log('Clear browser local storage (including session storage)');
    cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
    });
});

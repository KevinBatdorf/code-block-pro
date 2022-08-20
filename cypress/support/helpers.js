// This will let you set the text of an imput
// with get('.foo').text('bar')
Cypress.Commands.add('text', { prevSubject: true }, (subject, text) => {
    subject.val(text);
    return cy.wrap(subject);
});

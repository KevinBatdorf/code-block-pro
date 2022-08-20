export const login = (username = 'admin', password = 'password') => {
    cy.log('Login with username: ' + username + ' and password: ' + password);
    cy.visitLoginPage()
        .get('#user_login')
        .text(username)
        .get('#user_pass')
        .text(password)
        .get('#wp-submit')
        .click();
};

export const logout = () => {
    cy.visitAdminPage();
    cy.get('#wp-admin-bar-logout a').click({ force: true });
};

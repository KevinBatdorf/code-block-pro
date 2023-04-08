export const resetDatabase = () => cy.exec('wp-env clean all');
export const updateUserRole = (role) =>
    cy.exec(`wp-env run cli user set-role 1 ${role}`);

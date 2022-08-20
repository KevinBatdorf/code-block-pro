export const installPlugin = (slug) => {
    cy.visitAdminPage(
        'plugin-install.php',
        's=' + encodeURIComponent(slug) + '&tab=search&type=term',
    );
    cy.get(`.plugin-card-${slug}`).then((card) => {
        const activeButton =
            '<button type="button" class="button button-disabled" disabled="disabled">Active</button>';
        if (card.html().includes(activeButton)) return;
        if (card.html().includes('Install Now')) {
            cy.get(
                `.plugin-card-${slug} a[href*="${slug}"].install-now`,
            ).click();
        }
        cy.get(`.plugin-card-${slug} a[href*="${slug}"].activate-now`).click();
    });
};

export const uninstallPlugin = (slug) => {
    cy.visitAdminPage('plugins.php');
    cy.get(`tr[data-slug=${slug}]`).then((plugin) => {
        // If active, deactivate first
        if (plugin.html().includes(`deactivate-${slug}`)) {
            cy.get(`#deactivate-${slug}`).click({ force: true });
        }
        cy.get(`#delete-${slug}`).click({ force: true });
    });
};

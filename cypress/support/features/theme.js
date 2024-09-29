export const setTheme = (theme) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Theme');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Theme')
        .parents('.editor-sidebar')
        .scrollTo('bottom', {
            duration: 300,
        });
    cy.get(`#code-block-pro-theme-${theme}`).should('exist');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Theme')
        .parents('.editor-sidebar')
        .scrollTo('top', {
            duration: 300,
        });
    cy.get(`#code-block-pro-theme-${theme}`).click();
};

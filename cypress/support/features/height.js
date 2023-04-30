export const setHeightDesign = (height) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Max Height');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Max Height')
        .parents('.interface-interface-skeleton__sidebar')
        .scrollTo('bottom');
    cy.get(`#code-block-pro-see-more-${height}`).should('exist');
    cy.get(`#code-block-pro-see-more-${height}`).click();
};

export const enableMaxHeight = () => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Max Height');
    cy.get('[data-cy="enable-max-height"]').should('exist');
    cy.get('[data-cy="enable-max-height"]').should('not.be.checked');
    cy.get('[data-cy="enable-max-height"]').check();
    cy.get('[data-cy="enable-max-height"]').should('be.checked');
};

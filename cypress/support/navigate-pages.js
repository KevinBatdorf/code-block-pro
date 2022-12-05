import { addQueryArgs } from '@wordpress/url';

export const visitToLoginPage = (query = '') => {
    const question = query.startsWith('?') ? '' : '?';
    cy.visit(`wp-login.php${question}${query}`);
};

export const visitAdminPage = (adminPath = '', query = '') => {
    const question = query.startsWith('?') ? '' : '?';
    cy.visit(`wp-admin/${adminPath}${question}${query}`);
};

export const visitPageEditor = (query, skipWelcomeGuide = true) => {
    query = addQueryArgs('', {
        post_type: 'page',
        ...query,
    }).slice(1);

    cy.visitAdminPage('post-new.php', query);

    if (skipWelcomeGuide) {
        cy.closeWelcomeGuide();
    }
};

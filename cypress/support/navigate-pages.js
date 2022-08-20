import { addQueryArgs } from '@wordpress/url';
import { SERVER_URL } from '../constants';

export const visitToLoginPage = (query = '') => {
    const question = query.startsWith('?') ? '' : '?';
    cy.visit(`${SERVER_URL}/wp-login.php${question}${query}`);
};

export const visitAdminPage = (adminPath = '', query = '') => {
    const question = query.startsWith('?') ? '' : '?';
    cy.visit(`${SERVER_URL}/wp-admin/${adminPath}${question}${query}`);
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

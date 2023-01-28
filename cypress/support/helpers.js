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
export const mockIntersectionObserver = () => {
    cy.window().then((win) => {
        win.IntersectionObserver = function (cb, options = {}) {
            const instance = {
                thresholds: Array.isArray(options.threshold)
                    ? options.threshold
                    : [options?.threshold ?? 0],
                root: options.root,
                rootMargin: options.rootMargin,
                time: Date.now(),
                observe: (element) => {
                    const entry = [
                        {
                            isIntersecting: true,
                            boundingClientRect: element.getBoundingClientRect(),
                            intersectionRatio: 1,
                            intersectionRect: element.getBoundingClientRect(),
                            rootBounds: instance.root
                                ? instance.root.getBoundingClientRect()
                                : {},
                            target: element,
                            time: Date.now(),
                        },
                    ];
                    cb(entry);
                },
                unobserve: () => undefined,
                disconnect: () => undefined,
            };
            return instance;
        };
    });
};

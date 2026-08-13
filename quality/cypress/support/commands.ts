// Custom Cypress commands for desktop and mobile testing

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      verifyTouchTargetSize(selector: string, minSize?: number): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 812); // Mobile iPhone X/13 layout
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 800); // Standard desktop layout
});

Cypress.Commands.add('verifyTouchTargetSize', (selector: string, minSize: number = 44) => {
  return cy.get(selector).then(($el) => {
    const width = $el.outerWidth() || 0;
    const height = $el.outerHeight() || 0;
    expect(width).to.be.at.least(minSize, `Element ${selector} width should be >= ${minSize}px`);
    expect(height).to.be.at.least(minSize, `Element ${selector} height should be >= ${minSize}px`);
  });
});

export {};

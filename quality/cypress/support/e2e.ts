// Cypress support/e2e.ts file
import './commands';

// Hide uncaught exception logs that are benign during UI tests
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver') || err.message.includes('WebSocket')) {
    return false;
  }
  return true;
});

import '@testing-library/jest-dom/vitest';
// jsdom lacks these; components rely on them.
globalThis.ResizeObserver ??= class {
  observe() {
    // No layout in jsdom, so nothing is ever observed.
  }
  unobserve() {
    // No layout in jsdom, so nothing is ever observed.
  }
  disconnect() {
    // No layout in jsdom, so nothing is ever observed.
  }
};
if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
  HTMLElement.prototype.scrollIntoView = () => {
    // No layout in jsdom, so there is nothing to scroll.
  };
}
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

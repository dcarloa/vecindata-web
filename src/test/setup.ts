import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;

class MockResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = MockResizeObserver;

// jsdom doesn't implement matchMedia; components that check
// prefers-reduced-motion need a stub that always reports "no preference".
window.matchMedia =
  window.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));

// jsdom doesn't implement canvas 2D contexts; components that draw on a
// <canvas> (e.g. DotGrid) need a no-op context so mounting them in tests
// doesn't spam stderr with "not implemented" errors.
HTMLCanvasElement.prototype.getContext = (() => ({
  clearRect: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  setTransform: () => {},
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

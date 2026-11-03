import axe from 'axe-core';

/** Runs axe-core on the element and fails the test on any violation. Colour contrast cannot be checked in jsdom, so it is off. */
export async function expectNoA11yViolations(element: Element = document.body): Promise<void> {
  const results = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  );
  expect(summary).toEqual([]);
}

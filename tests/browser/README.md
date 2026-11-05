# Browser interaction tests

Run the fast jsdom suite with `pnpm test`. Run native browser interactions separately:

```sh
pnpm install --frozen-lockfile
pnpm test:browser:install
pnpm test:browser
```

The install command downloads the Playwright browser revisions and installs their Linux system dependencies (it may
require elevated privileges for the latter). On macOS, `pnpm exec playwright install chromium firefox webkit` only
downloads the browsers. To run one engine or watch a test:

```sh
pnpm test:browser --project firefox
pnpm exec vitest --config vitest.browser.config.ts --project chromium
```

On macOS, enable keyboard navigation for WebKit before running the keyboard tests. Playwright's WebKit honors the
system preference and otherwise skips buttons when pressing Tab; see the
[upstream explanation](https://github.com/microsoft/playwright/issues/41808). This is a test-environment prerequisite,
not a reason to add `tabIndex` to production buttons or replace native Tab events. For an app-specific override,
`defaults write org.webkit.Playwright AppleKeyboardUIMode -int 2` enables it for Playwright. Record the existing value
with `defaults read org.webkit.Playwright AppleKeyboardUIMode` first, and restore that value afterwards (or use
`defaults delete org.webkit.Playwright AppleKeyboardUIMode` if the key did not exist). Ubuntu CI needs no such override.

## Scope and maintenance

This uses [Vitest Browser Mode](https://vitest.dev/guide/browser/) with its
[Playwright provider](https://vitest.dev/config/browser/playwright), not a second test runner or a Storybook server.
The installed Vitest version is 5.1.0; `@vitest/browser-playwright` is pinned to the same version because it declares an
exact Vitest peer. Update them together. `playwright` is the provider's required peer and supplies the install/trace CLI.
The existing Testing Library renderer supplies React mounting and cleanup; interactions use `vitest/browser`'s native
automation rather than Testing Library's simulated user events. No extra React browser-renderer package is needed.

- `vitest.browser.config.ts` is independent of the playground/library Vite config and the jsdom setup. It loads real CSS,
  keeps native dialog/focus/layout/scroll APIs, and runs Chromium, Firefox and WebKit headlessly at a fixed viewport.
- `setup.ts` loads the tokens, base styles and the component CSS used by these fixtures. Add the relevant stylesheet when
  adding another component. Cleanup unmounts React after every test, including failures, so dialog scroll locks unwind.
- The browser tsconfig keeps jsdom's global jest-dom matcher types out of the browser suite. `pnpm typecheck` checks both
  configurations; ESLint applies Vitest rules to the browser tests without Testing Library's incompatible query rules.
- Tests establish starting focus inside Vitest's iframe before native keyboard activation. Subsequent entry, navigation,
  selection and focus return are asserted. They do not demand immediate wrapping from a native dialog's first/last control:
  browser chrome can participate at that boundary. The custom popover's Tab wrapping is tested explicitly.
- Geometry assertions poll real rectangles with a two-pixel tolerance. Real, unforced option clicks prove that popups
  escape overflow clipping and remain interactive in a native modal's top layer. Scroll tests move the real scrollport
  and wait for native scroll-driven positioning; there are no timer sleeps or mocked rectangles.
- Fixtures and tests live outside `src`, are not imported by the library or stories, and stay outside declarations and
  the published `dist` allowlist. These are behavioural tests, not screenshot baselines or screen-reader certification.

The nine scenarios cover dialog focus entry/return (including focusing the dialog itself), native Tab navigation,
repeated Escape with dismissal disabled, keyboard filtering/selection, pointer selection inside a modal, popup focus
and Escape order, a selector nested in a popup inside a modal, overflow/scroll tracking, and viewport-edge flipping.

## Failure artifacts and CI

The independent `browser` CI job installs all three engines and their system dependencies, then runs this suite. It has
no retries, allowed failures, expected failures or skipped regression tests. It uploads `build/browser-results/`,
including the JUnit report on success and failure screenshots plus Playwright traces on failure, for seven days.

Vitest 5.1 stages trace chunks and failure screenshots using test names. Browser instances run sequentially
(`maxWorkers: 1`) because concurrent engines otherwise collide in those staging files; this was reproduced as
`tracing.stopChunk: file data stream has unexpected number of bytes`. Failed traces have browser names in their zip
filenames, and Vitest preserves attachment copies in `attachments/`. Open a downloaded trace with:

```sh
pnpm exec playwright show-trace build/browser-results/traces/<browser>-<test>.trace.zip
```

Local results accumulate under the ignored `build/` directory; remove `build/browser-results/` before a run when you
need a fresh artifact set. Vitest's auxiliary `.vitest/` state is ignored too.

## Baseline defect found

On the unmodified `c694252` Floating implementation, the nested selector Escape scenario fails in Chromium, Firefox and
WebKit: one Escape dismisses both the selector and its parent popover, losing the expected focus target. Each open
Floating panel previously handled the same document keydown event, and `stopPropagation()` does not stop other listeners
on that same document. This PR includes a narrow baseline fix in `src/internal/floating.tsx`: register open panels and
let only the most recently opened panel dismiss on Escape, preventing its native default action as well. Cleanup removes
the panel from the registry. The browser regression asserts correct layer-by-layer dismissal and focus return all the
way to the modal opener; it does not bless the old behaviour or mark it as an expected failure. Base UI's eventual overlay
migration should replace this temporary behaviour implementation while preserving these interaction contracts.

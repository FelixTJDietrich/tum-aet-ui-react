# TUM AET UI for React: working conventions

React port of `@tumaet/ui-angular` (the AET design system, maintained in the Artemis repo under `packages/tum-aet-ui`).
Goal: the same look, tokens, class names and accessibility, with React 19 / React DOM as peers and `@base-ui/react` as the approved runtime behaviour foundation. Existing components still use their original implementations; adding the dependency does not migrate them. Read [the migration policy](docs/migration-policy.md) before changing component APIs.

## Rules

- **Dependencies need maintainer agreement.** `@base-ui/react` is approved as a normal runtime dependency; do not add other runtime libraries or copy framework internals. Minimal browser-test dev dependencies may be added in an explicitly assigned browser-infrastructure task. Prefer native platform features for owned logic: `Intl`, `Date`, CSS custom properties, `color-mix`, logical properties.
- **Styling is plain CSS** in a `.css` file next to the component. Use the `--tumaet-ui-*` tokens from `src/styles/themes.css`, never hard-coded colours, and `calc(var(--tumaet-ui-spacing) * n)` for spacing (Tailwind's `p-3` is `n=3`). Keep the Angular class names (`tumaet-ui-btn`, `tumaet-ui-input`, ...). Variants go in `data-*` attributes (`data-severity`, `data-size`, `data-variant`), not in class permutations.
- The Angular library styles live in Tailwind utilities inside `*.component.html/ts/scss` and `*.variants.ts`. Translate them to CSS by hand; read the Angular source for exact values.
- Every component root sets `font-family`, `font-size`, `line-height` from the tokens (or inherits from a parent that does); form controls use `font: inherit`.
- Support light and dark theme through tokens only, `prefers-reduced-motion`, and visible `:focus-visible` outlines (`2px solid var(--tumaet-ui-focus-color)`, offset 2px).
- **Accessibility is a requirement**, not polish: correct roles, names, states, keyboard behaviour (follow the WAI-ARIA Authoring Practices), focus management and focus return for dialogs and popups. Texts the component produces itself (aria labels, "No results") come from `useTranslate()` with a key in `src/internal/i18n.tsx` (keys keep the Angular names, `tumAetUi.<component>.<key>`).
- **API shape:** function components, element props spread onto the relevant part (`...rest`), `className` merged with `cx`, `ref` as a normal prop (React 19). Existing components retain `useControllable` and their documented `onChange` callbacks until explicitly migrated. New/migrated interactive components use flat compound parts, generic values and Base UI state/callback conventions: `value`/`defaultValue`/`onValueChange`, `open`/`defaultOpen`/`onOpenChange`, `checked`/`defaultChecked`/`onCheckedChange`. The new value is first, event details second. Native-like `Input` and `Textarea` keep natural DOM events. Booleans default to false unless a documented primitive accessibility default requires otherwise. See the migration policy for compatibility requirements.
- Icons: `ReactNode` props. Built-in icons are in `src/internal/icons.tsx` (for more, create them in your component folder, from the Font Awesome Free solid set in `~/Projects/Artemis/node_modules/@fortawesome/free-solid-svg-icons`, copy the path data from the package, do not type it from memory).
- Existing overlays use `Floating` from `src/internal/floating.tsx` and native `<dialog>.showModal()`. During an explicitly scoped migration, use Base UI's overlay/focus primitives and the library's theme/portal integration when available. Do not extend the legacy overlay engine for components being migrated, or remove helpers still used by unmigrated components.
- Do not use `useEffect` to derive state; do not add `React.memo` unless measured.

## Layout of a component

```
src/components/<name>/
  <name>.tsx        component(s)
  <name>.css        styles, picked up by scripts/build-styles.mjs and by the playground automatically
  <name>.test.tsx   Vitest + Testing Library, includes one axe check (src/test-utils.ts)
  <name>.demo.tsx   default export: a component showing the variants, picked up by the playground automatically
  index.ts          public exports of this folder
```

For ordinary component ports, do **not** edit `src/index.ts`, `playground/`, anything in `src/internal/`, `package.json` or configs; the lead wires exports at integration. Explicitly assigned foundation/integration work may change its assigned files. Several people work in parallel in this repo. Need a helper or an icon that does not exist? Put it in your own component folder (`src/components/<name>/icons.tsx`, `...-utils.ts`). All Angular translation keys already exist in `src/internal/i18n.tsx`; if you need a key that is missing, use an inline English fallback via a prop and list the key in your report.

## Commands

`pnpm typecheck`, `pnpm test`, `pnpm test -- src/components/<name>`, `pnpm dev` (playground), `pnpm build`, `pnpm lint` (ESLint), `pnpm lint:css` (stylelint), `pnpm format:check`. CI runs all of them and fails on any warning. Prettier config is in `.prettierrc`; run `pnpm exec prettier --write src/components/<name>` before reporting.

### Lint rules

- ESLint uses typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, React and React Compiler hook rules, `jsx-a11y` strict, and import cycle checks (`eslint.config.js`). Fix the code instead of silencing a rule. A disable comment needs a reason (`// eslint-disable-next-line rule -- why`), and unused disables are errors.
- Conditions are explicit (`x !== undefined`, `s !== ''`); `!!x` is fine for a plain truthiness check, `Boolean(x)` is not (it loses type narrowing).
- stylelint (`stylelint.config.mjs`) allows only `tumaet-ui-*` class names and `--tumaet-ui-*` custom properties, no hex or named colours outside `src/styles/themes.css`, no `!important`.
- TypeScript is pinned to 6.0 because typescript-eslint does not support TypeScript 7 yet. The library also typechecks with TypeScript 7 as a consumer.
  The Angular source to port is in the scratchpad snapshot (path given in your task), under `src/lib/<name>/`, together with its `.stories.ts` and `.spec.ts` files, which list the intended behaviour.

## Reference component

`src/components/button` shows the conventions: data attributes for variants, tokens in CSS, tests, demo.

## Working in parallel

Other components are being written at the same time, so `pnpm typecheck` may report errors in folders that are not yours: ignore those, and run tests only for your own folder. Do not run `pnpm build`, `git` commands or formatters over the whole repo.

The build/git restriction above applies to ordinary parallel component ports. An explicitly assigned packaging, integration or PR task may build, commit and push its own scoped work. Never format or overwrite another contributor's changes. Packaging work must run `pnpm pack:check` (including native package-policy tests) and the minimum/latest tarball consumers; preserve React and Base UI subpath externalization, CSS side effects and resolving declaration imports. Emitted internal modules are not additional public import paths.

## Stories (Storybook)

Every component folder has `<name>.stories.tsx` (CSF with `satisfies Meta<typeof X>`, `tags: ['autodocs']` is set globally). `pnpm storybook` runs it, the toolbar switches light and dark. Use the same `title` category and story names as the Angular stories (`Forms/Select`, `Actions/Button`, ...), cover every variant, size and state, add a short description to the meta (`parameters.docs.description.component`) and to non-obvious props as JSDoc in the props interface (Storybook builds the props table from the TypeScript types and JSDoc), and add `play` functions for keyboard behaviour where the Angular stories have them. Stories must pass the a11y addon (`a11y.test` is `error`). Build check without clobbering others: `STORYBOOK_DISABLE_TELEMETRY=1 pnpm exec storybook build -o storybook-static-<yourname>`.

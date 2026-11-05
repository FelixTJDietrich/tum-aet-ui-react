# TUM AET UI for React

React components and styles of the design system of the [Applied Education Technologies (AET)](https://aet.cit.tum.de/) research group at the Technical University of Munich. This is a React port of [`@tumaet/ui-angular`](https://github.com/ls1intum/Artemis/tree/develop/packages/tum-aet-ui) and uses the same design tokens (`--tumaet-ui-*`), class names, light and dark theme.

**Status: 0.1.0 API, with the Base UI migration foundations in development. The API may change in any 0.x release, see the [changelog](CHANGELOG.md).** Existing components retain their implementations and props until individually migrated; [the migration policy](docs/migration-policy.md) distinguishes the current API from the target. The components are ported, reviewed against the Angular source and specs, and tested with Vitest, Testing Library and axe-core. Every story was loaded in a real browser in light and dark with a colour-contrast check. Right-to-left layouts and touch input have only been exercised by a few stories, not verified visually.

## Principles

- React 19 and React DOM as peers; `@base-ui/react` as the normal runtime dependency for the phased behaviour migration. No other direct runtime dependencies.
- Plain CSS in one file, driven by CSS custom properties. No Tailwind, no CSS-in-JS.
- Native platform features where possible: `<dialog>`, `Intl`, `color-mix`.
- Accessibility is a requirement: roles, names, keyboard behaviour and focus handling follow the WAI-ARIA Authoring Practices.
- Built-in texts are English and can be replaced with `TumAetUiI18nProvider`.
- Modular ESM with tree shaking. React, React DOM and Base UI (including their subpaths) stay external to the library build. TSX modules carry client directives; the public barrel stays a re-export entry.

## Install

```sh
npm install @tumaet/ui-react
```

This is the React package. The Angular components are published separately as [`@tumaet/ui-angular`](https://www.npmjs.com/package/@tumaet/ui-angular); the two packages have independent version numbers. Requires React 19 and a bundler that handles CSS imports (for example Vite).

## Use

```tsx
import '@tumaet/ui-react/styles.css';
import { Button, Dialog } from '@tumaet/ui-react';
```

Set `data-theme="dark"` on `<html>` for the dark theme. Override the `--tumaet-ui-*` custom properties in an unlayered stylesheet to adapt the theme; the defaults are in the `tumaet-ui-theme` cascade layer.

## Components

Button, ButtonGroup, Input, Textarea, FormField, IconField, InputGroup, InputNumber, SearchField, Checkbox, RadioButton, RadioGroup, ToggleSwitch, SelectButton, Select, MultiSelect, Autocomplete, DatePicker, Calendar, Dialog, ConfirmDialog (`useConfirm`), Popover, Tooltip, Menu, DataTable, Table, SortableColumnHeader, Paginator, Tabs, List, Tag, Chip, Message, ProgressBar, ProgressSpinner, EmptyState, Card, Panel, Splitter.

Not ported: charts, the virtual-scroll table and the Angular `DialogService`.

## Develop

```sh
pnpm install
pnpm dev          # playground with a demo of every component
pnpm storybook    # Storybook: stories, props tables and guides, light and dark
pnpm build-storybook
pnpm test         # Vitest
pnpm typecheck
pnpm build        # modular dist/index.js + components/internal, dist/types, dist/styles.css
pnpm pack:check   # build, pack the tarball and verify its contents, exports and types
pnpm test:consumer latest   # install the tarball in a fresh app (or `minimum` for React 19.0.0)
```

Releases are described in [RELEASING.md](RELEASING.md). Conventions for contributors and coding agents are in [AGENTS.md](AGENTS.md).

The public paths remain `@tumaet/ui-react`, `@tumaet/ui-react/styles.css` and `@tumaet/ui-react/package.json`. Files below `dist/components` and `dist/internal` are implementation details, not supported deep imports. The declarations include explicit relative `.js` specifiers for NodeNext as well as bundler resolution. The stylesheet is explicitly side-effectful; importing one component does not split its CSS out of the full stylesheet.

Consumer checks install the validated tarball outside the workspace, typecheck with bundler and NodeNext resolution, render on the server, resolve CSS, and bundle a Button-only root import against a small JS regression budget. `minimum` uses React/types 19.0.0; `latest` selects the newest React 19 and current React type definitions, with TypeScript 7 and Vite 8. These are package/SSR smoke checks, not browser or server-component-framework coverage.

## License

MIT, see [LICENSE](LICENSE).

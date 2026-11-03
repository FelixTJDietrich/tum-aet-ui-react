# TUM AET UI for React

React components and styles of the design system of the [Applied Education Technologies (AET)](https://aet.cit.tum.de/) research group at the Technical University of Munich. This is a React port of [`@tumaet/ui-angular`](https://github.com/ls1intum/Artemis/tree/develop/packages/tum-aet-ui) and uses the same design tokens (`--tumaet-ui-*`), class names, light and dark theme.

**Status: first version, not yet published to npm.** The components are ported and tested with Vitest, Testing Library and axe-core. They were compared with the Angular Storybook for about twenty components in the light theme. Dark theme, right-to-left layouts and touch input have not been verified yet. Colour contrast is not checked by the automated tests.

## Principles

- No runtime dependencies besides `react` and `react-dom` (React 19, peer dependencies).
- Plain CSS in one file, driven by CSS custom properties. No Tailwind, no CSS-in-JS.
- Native platform features where possible: `<dialog>`, `Intl`, `color-mix`.
- Accessibility is a requirement: roles, names, keyboard behaviour and focus handling follow the WAI-ARIA Authoring Practices.
- Built-in texts are English and can be replaced with `TumAetUiI18nProvider`.

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
pnpm test         # Vitest
pnpm typecheck
pnpm build        # dist/index.js, dist/types, dist/styles.css
```

Conventions for contributors and coding agents are in [AGENTS.md](AGENTS.md).

## License

MIT, see [LICENSE](LICENSE).

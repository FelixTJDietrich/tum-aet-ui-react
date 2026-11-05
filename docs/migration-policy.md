# Base UI migration policy

The approved direction is an owned TUM AET design system on `@base-ui/react` behaviour primitives. Keep plain CSS, `--tumaet-ui-*` tokens, class names, variant vocabulary, i18n keys and React 19 conventions. React and React DOM remain peers. Base UI is a normal dependency so applications get a compatible foundation when installing this package.

## Current behaviour and foundation scope

This foundation changes packaging and release checks; it does not change component props or behaviour. The current components still use their legacy `onChange` callbacks, `useControllable`, `Floating` and native dialogs. Existing root exports, stylesheet and package metadata import paths stay available. Internal module paths are not a public API.

The build emits modular ESM and separate declarations, externalizes React/React DOM/Base UI roots and subpaths, and marks TSX implementation modules with `use client`. Pure TS helpers and re-export barrels do not receive a blanket directive. This is a conservative client boundary for the current components, not a promise that every presentational component can run as a server component. Vite SSR smoke tests do not establish Next.js or other RSC framework compatibility.

Theming, token exports and browser infrastructure are separate foundation changes. This document does not claim they are implemented here. New component migrations must use those integrations once available and validate their behaviour in the appropriate browser tests.

## Public API for new and migrated components

- Export compound parts as flat names: `Select`, `SelectTrigger`, `SelectPopup`, `SelectItem`. Avoid namespace objects such as `Select.Trigger` and avoid exporting the whole Base UI namespace. Simple presentational components and common composed patterns can remain props-driven.
- Use generic values end to end, for example `Select<Country>` with a `Country` value and typed callback. Prefer typed label/value functions to string property paths and `unknown` values. Specify equality, null/empty and multiple-selection semantics in the component proposal and tests.
- Use `value` / `defaultValue` / `onValueChange`, `open` / `defaultOpen` / `onOpenChange`, and `checked` / `defaultChecked` / `onCheckedChange` where applicable. The first callback argument is the new state; the second carries the supported Base UI event details. Preserve cancellation semantics where exposed. Native-like `Input` and `Textarea` retain natural DOM `onChange` events. DOM event props on parts keep their native meanings.
- Forward element props and React 19 `ref` on the relevant part. Merge `className` with the owned class. Keep appearance in tokens and documented `severity`, `variant` and `size` props. Use Base UI state attributes for state styling; preserve owned variant attributes and accessible names.
- Use Base UI for keyboard, focus, state and overlay behaviour during the component's migration. Do not copy its internals or rebuild the same behaviour in parallel. Own composition, styling, translations and domain-specific logic. Keep legacy shared helpers until their last consumer migrates.
- Keep `tumAetUi.*` translation keys and the i18n provider. Keep form submission, disabled/read-only behaviour, controlled/uncontrolled contracts, focus return and accessible names explicit in tests and stories.

These are conventions for upcoming implementations, not additional exports or props available in the current package. Each component PR must document the actual supported parts and types.

## Phased compatibility

1. Land foundations with existing component APIs intact. Do not rename callbacks globally or expose speculative parts.
2. Migrate components in focused PRs with an API sketch, before/after usage, typed examples and appropriate unit, browser and accessibility validation. Keep non-migrated components working alongside migrated ones. An upgrade should not require an unrelated component rewrite.
3. Prefer additive compatibility where it stays small and unambiguous. Do not permanently maintain both legacy option/path APIs and generic compound APIs, or fire two state callbacks for the same transition. When a bridge is practical, document it and retain a deprecated API for at least one minor release before removal. If a bridge is impractical, explain the breaking change explicitly and offer a prerelease for application validation.
4. Any incompatible 0.x API change needs a new minor version, changelog entry and concrete migration instructions. Patch releases preserve the documented API. Stabilize the API before 1.0; do not treat a dependency addition or modular build as completion of the behaviour migration.

## Dependency and distribution review

The reviewed floor is `@base-ui/react` 1.9.0, declared as `^1.9.0`; updates within major 1 are allowed and tested through the lockfile and consumers. The [official release notes](https://base-ui.com/react/overview/releases/v1-9-0) and npm metadata were checked on 2026-11-05; the package declares React 19 support. An isolated React 19 install resolved nine packages for Base UI and its transitive dependencies, excluding React, React DOM and scheduler. None of those installed manifests declared install lifecycle scripts; npm audit reported zero advisories at that time. This is a point-in-time dependency review, not a security guarantee or a fixed transitive package count. The optional date peers were not installed. No claim about every transitive package's provenance is made.

The package check allows only the reviewed direct runtime dependency, the React peers, the existing public paths and production-source-corresponding JS/declaration files plus the stylesheet and package documentation. It validates emitted imports and client directives, and rejects bundled dependency files, tests, demos, stories and stray assets. A build fixture proves root/subpath externalization even before components import Base UI. Consumer checks prove Button-only tree shaking with a regression budget; this is not a per-component size guarantee.

When a separate foundation adds a public stylesheet or provider, update its explicit package allowlists and consumer coverage together. Do not broaden the allowlist to arbitrary `dist/**` assets. Keep release validation tied to the tested tarball and its integrity hash.

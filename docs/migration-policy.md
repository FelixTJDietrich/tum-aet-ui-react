# Component API and migration policy

The library owns the AET appearance, composition, translations and domain logic. Base UI owns generic state, keyboard, focus, dismissal and positioning behaviour. React and React DOM are peers; Base UI is a normal runtime dependency.

## API contracts

- Export compound parts as flat names, such as `Select`, `SelectTrigger` and `SelectPopup`. Simple presentation components and common composed patterns can remain props-driven.
- Use `value/defaultValue/onValueChange`, `checked/defaultChecked/onCheckedChange` and `open/defaultOpen/onOpenChange`. Callbacks receive the new state followed by the supported Base UI event details; preserve cancellation. Native `Input` and `Textarea` keep DOM events.
- Type collection items, values and callbacks together. Prefer label and serialization functions to property-name strings. Specify equality and empty/multiple-value semantics. A generic root does not typecheck arbitrary JSX descendants: verify the actual supported typed path rather than claiming otherwise.
- Forward element props and React 19 refs on the rendered part, and merge its class with `cx`. Keep appearance in tokens and the documented variant props; use upstream state attributes.
- Controls must support native submission, disabled/read-only semantics and reset. Verify `FormData`, reset followed by rerender, and canceled reset for stateful controls.
- Preserve `tumAetUi.*` translations, accessible names and focus return. Portal inheritance follows the destination DOM: expose the upstream container option and demonstrate a host within the intended theme/direction boundary, outside clipping containers. See [theming](theming.mdx).

## Compatibility

Legacy components retain their documented props until migrated. Change each component and its dependent patterns, examples and tests together; remove its owned behaviour rather than maintain a second engine. Shared helpers remain until their last consumer migrates.

Breaking changes during 0.x require a minor version, a changelog entry and concrete before/after examples. Keep compatibility adapters only where they are small and unambiguous; do not maintain dual callbacks or duplicate option APIs indefinitely. A prerelease provides application validation before a new minor release.

## Distribution

`package.json` defines supported peers, the tested Base UI dependency range and public exports. Internal output paths are not supported imports. Package checks inspect the packed artifact; fresh consumer checks verify exported types, CSS, server rendering and tree shaking. Browser interaction checks are separate. Extend export and artifact coverage when adding a public path; keep release validation tied to the tested tarball.

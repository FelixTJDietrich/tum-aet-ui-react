# Releasing `@tumaet/ui-react`

Releases are built, tested and staged by the [Release workflow](.github/workflows/release.yml). Nothing is published from a laptop.

1. Update `version` in `package.json` and add a section to `CHANGELOG.md`. Merge to `main` once CI is green.
2. Check locally: `pnpm pack:check && pnpm test:consumer latest && pnpm test:consumer minimum`.
3. Tag the merge commit and push the tag: `git tag "@tumaet/ui-react@<version>" && git push origin "@tumaet/ui-react@<version>"`.
4. Run **Actions → Release** manually, choosing that tag as the ref. It checks that the tag matches `package.json` and that the commit is on `main`, then typechecks, tests, packs, verifies the tarball and installs it into a fresh app with the minimum and the latest React 19.
5. The `stage` job (environment `npm-tum-aet-ui-react`, needs a reviewer) stages the exact tarball on npm. Review it on npmjs.com and approve it with 2FA.
6. Create a GitHub Release for the tag with the changelog section.

One-time setup:

- The package belongs to the `@tumaet` npm scope and is public.
- npm trusted publishing is configured for repository `ls1intum/tum-aet-ui-react`, workflow `release.yml` and environment `npm-tum-aet-ui-react`.
- The GitHub environment `npm-tum-aet-ui-react` has required reviewers.

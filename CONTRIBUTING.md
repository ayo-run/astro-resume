# Astro-Resume contribution guide

👋 Hi! Thanks for considering contributing to `astro-resume`! You can do so by [reporting a bug](#reporting-a-bug) or [opening a PR](#open-a-pull-request). This is a small, single-maintainer package, so a note on expectations before you continue: issues and pull requests may take a week or two to get reviewed.

## Reporting a bug

Open an issue on [GitHub](https://github.com/ayo-run/astro-resume/issues), or send a plain text email to <~ayoayco/astro-resume@todo.sr.ht> if you would rather not use GitHub in a web browser.

A report is most useful with the Astro version of you rproject, the package gersion, and the smallest `Serialize` / `deserialize` usage that shows the problem.

**Do not report security issues publicly.** See [our security guide](SECURITY.md) - private advisories and a contact address are set up for that.

## Open a Pull Request

Before anything: For anything beyond a typo or an obvious bug fix, open an issue first. This package deliverately does very little, and the most common reason to turn down a change is scope rather than quality.

Two things to know:

- **The published package has no runtime dependencies.** Anything a consumer would install is out of bounds; a PR adding a dependency into `package/package.json` will be rejected. Dev dependencies are fine, if justified by the problem being fixed.
- **`astro` stays a peer dependency** (`>=4`). Changes that only wor on the newest Astro need to degrade gracefully on older ones.

## Working on a change

Setup, scripts and the workspace layout are in the README's [Development](README.md#development) section. Node comes from `.nvmrc`, and the repo uses `pnpm`.

Run what the CI runs before pushing:

```bash
pnpm lint
pnpm test
pnpm check
```

A pre-commit hook runs `pnpm lint:fix` for you, and lints everything you have staged.

Add a test for behavior changes. The `package/` directory holds the unit tests; `demo/` is an Astro site that consumes the package minimally as a real project would, so we use that to catch breaking type changes.


## Commit messages

Please use [conventionsl commits](https://www.conventionalcommits.org/), lowercase after the collon, no trailing period. The types in use here are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`. We use scope for scoped changes, e.g., `chore(ci)` for CI changes, `fix(deserialize)` for fixes in the `deserialize` funciton, or `chore(pkg)` for changes in `package/package.json`.

Breaking changes take a `!`. So, a new breaking feature would have `feat!:` and an expalanation in the body.

## Review

Every contribution change is reviewed before it lands on our `main` branch, including changes written by the maintainer's tooling. Expect questions about scope and handling older Astro versions.

## License

Contributions are accepted under the [MIT License](LICENSE) which contains the same terms the package ships under.

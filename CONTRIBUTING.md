# Contributing to ClipShare

Thanks for your interest in contributing! This document explains how to set up the project and the conventions we follow.

## Code of Conduct

Be respectful and constructive. Assume good intent, keep discussions focused on the work, and help newcomers.

## Getting started

1. **Fork** the repository and **clone** your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and fill in your own Firebase + Cloudflare R2 values:
   ```bash
   cp .env.example .env.local
   ```
   See the [Environment variables](README.md#environment-variables) and [Getting started](README.md#getting-started) sections of the README for how to obtain each value.
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Development workflow

1. Create a branch off `main`:
   ```bash
   git checkout -b feat/short-description
   ```
   Use a prefix that matches your change: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`.
2. Make your change. Keep pull requests **focused** — one logical change per PR.
3. Before pushing, make sure the project lints and builds:
   ```bash
   npm run lint
   npm run build
   ```
4. Push your branch and open a pull request against `main`.

## Pull request guidelines

- Give the PR a clear title and describe **what** changed and **why**.
- Link any related issue (e.g. `Closes #12`).
- Include screenshots or a short clip for UI changes.
- Ensure `npm run lint` and `npm run build` pass — CI runs these on every PR.
- For significant changes, please open an issue to discuss the approach first.

## Coding conventions

- **TypeScript** throughout; prefer explicit, descriptive names.
- **Match the surrounding code** — indentation, naming, and component structure.
- Styling is **Tailwind CSS** utility classes; avoid introducing a separate CSS system.
- Keep server‑only secrets out of `NEXT_PUBLIC_*` variables. Anything with the `NEXT_PUBLIC_` prefix is shipped to the browser.
- Don't commit `.env` files or any secrets. `.env.example` is the source of truth for required variables.

## Reporting bugs & requesting features

Open an issue and include:

- **For bugs:** steps to reproduce, expected vs. actual behavior, browser/OS, and console/network errors if any.
- **For features:** the problem you're trying to solve and a proposed approach.

## Security

Please do **not** open public issues for security vulnerabilities. Instead, report them privately to the maintainers so they can be addressed before disclosure. If you accidentally commit a secret, rotate it immediately.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.

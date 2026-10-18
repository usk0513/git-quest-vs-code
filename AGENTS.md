# Repository Guidelines

## Project Structure & Module Organization
The app lives under `src`, with UI views in `src/components` (layout, source control, explorer, shared widgets). Domain logic is grouped in `src/services` for git, terminal, filesystem, and tutorials; state in `src/store`; shared types and constants in `src/types` and `src/constants`; global Tailwind styles in `src/styles`. Tests live in `tests/unit`, `tests/integration`, and `tests/components`, supported by fixtures in `tests/fixtures` and setup scripts in `tests/setup`. Use the `@/` alias for paths rooted at `src`.

## Build, Test, and Development Commands
`npm run dev` launches Vite at http://localhost:5173 with hot reload. `npm run build` type-checks the app, the Vite and Vitest config files, and the tests (`tsc -b`; `npm run typecheck` runs only this step) and then produces the production bundle, and `npm run preview` serves it for smoke tests. Run `npm run lint` for Biome (`biome lint --error-on-warnings`; CI runs it on every pull request), `npm run test` for the Vitest suite, `npm run test:coverage` before shipping sizeable features, and `npm run test:ui` when interactively debugging specs.

## Coding Style & Naming Conventions
Follow the Biome rules in `biome.json` (the `recommended` preset plus `useComponentExportOnlyModules`; CSS under `src` is linted too, with Tailwind directives enabled) and keep `npm run lint` free of errors and warnings; use two-space indentation and single quotes. When a rule must be suppressed, use a `biome-ignore` comment that states the reason. The Biome formatter is not enabled yet, so do not reformat unrelated code. Prefer function components with hooks, keep Tailwind class lists purposeful, and colocate component-only helpers with the component. Name components in PascalCase (e.g., `ExplorerPanel.tsx`), utilities in camelCase, and tests with `.test.ts` or `.test.tsx`. Use type-only imports where possible and surface shared definitions through `src/types`.

## Testing Guidelines
Vitest with React Testing Library drives unit and integration coverage. Mirror production paths in test names (e.g., `tests/unit/services/git/GitValidator.test.ts`) and reuse helpers from `tests/setup/vitest.setup.ts` plus fixtures to avoid duplication. Keep coverage from `npm run test:coverage` steady and add integration checks whenever UI interactions or tutorial steps change behaviour.

## Commit & Pull Request Guidelines
Keep commits short, imperative, and single-purpose, matching the existing history (e.g., `Add tutorial service and step validation`). Reference related issues in the body when necessary. Before opening a pull request, run `npm run lint` and `npm run test`, document the change in a brief summary, note manual checks, and attach screenshots or recordings for UI or tutorial updates. Call out new environment variables or migrations for reviewer visibility.

## Environment & Configuration Tips
Use Node.js 24.x (LTS) and the bundled npm (11.10 or later). Vite reads the root `vite.config.ts`, which loads Tailwind CSS 4 through the `@tailwindcss/vite` plugin; restart `npm run dev` after editing it. The Tailwind theme lives in `src/styles/index.css` (`@theme`), and global styles there belong in `@layer base`. Keep tutorial updates and mock repositories in temporary branches to avoid polluting the main assets.

The root `.npmrc` routes all installs through Takumi Guard (`registry=https://npm.flatt.tech/`). Guard rejects known malicious packages with 403. The same file sets `min-release-age=7`, so `npm install`/`npm update` only pick versions published at least 7 days ago; `npm ci` is not affected. Do not remove either setting to get around a failure. If a security fix is younger than 7 days, install it once with `--min-release-age=0` and say so in the pull request. Do not add packages to `min-release-age-exclude`. Lockfile entries added or updated with this config record `https://npm.flatt.tech/` in `resolved`; that is expected. `.github/dependabot.yml` declares the same registry for Dependabot and limits it to security updates.

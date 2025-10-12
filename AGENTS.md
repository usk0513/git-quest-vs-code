# Repository Guidelines

## Project Structure & Module Organization
The app lives under `src`, with UI views in `src/components` (layout, source control, explorer, shared widgets). Domain logic is grouped in `src/services` for git, terminal, filesystem, and tutorials; state in `src/store`; shared types and constants in `src/types` and `src/constants`; global Tailwind styles in `src/styles`. Tests live in `tests/unit`, `tests/integration`, and `tests/components`, supported by fixtures in `tests/fixtures` and setup scripts in `tests/setup`. Use the `@/` alias for paths rooted at `src`.

## Build, Test, and Development Commands
`npm run dev` launches Vite at http://localhost:5173 with hot reload. `npm run build` runs `tsc` then produces the production bundle, and `npm run preview` serves it for smoke tests. Run `npm run lint` for ESLint, `npm run test` for the Vitest suite, `npm run test:coverage` before shipping sizeable features, and `npm run test:ui` when interactively debugging specs.

## Coding Style & Naming Conventions
Follow the ESLint + TypeScript rules already configured; use two-space indentation and single quotes. Prefer function components with hooks, keep Tailwind class lists purposeful, and colocate component-only helpers with the component. Name components in PascalCase (e.g., `ExplorerPanel.tsx`), utilities in camelCase, and tests with `.test.ts` or `.test.tsx`. Use type-only imports where possible and surface shared definitions through `src/types`.

## Testing Guidelines
Vitest with React Testing Library drives unit and integration coverage. Mirror production paths in test names (e.g., `tests/unit/services/git/GitValidator.test.ts`) and reuse helpers from `tests/setup/vitest.setup.ts` plus fixtures to avoid duplication. Keep coverage from `npm run test:coverage` steady and add integration checks whenever UI interactions or tutorial steps change behaviour.

## Commit & Pull Request Guidelines
Keep commits short, imperative, and single-purpose, matching the existing history (e.g., `Add tutorial service and step validation`). Reference related issues in the body when necessary. Before opening a pull request, run `npm run lint` and `npm run test`, document the change in a brief summary, note manual checks, and attach screenshots or recordings for UI or tutorial updates. Call out new environment variables or migrations for reviewer visibility.

## Environment & Configuration Tips
Use Node.js 18.x and npm 9.x. Tailwind, PostCSS, and Vite read from the root `tailwind.config.js`, `postcss.config.js`, and `vite.config.ts`; restart `npm run dev` after editing them. Keep tutorial updates and mock repositories in temporary branches to avoid polluting the main assets.

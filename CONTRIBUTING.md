# Contributing Guide

Thank you for considering contributing to `@sugukuru/japan-real-estate-intel-mcp`!

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 10 |
| TypeScript | ≥ 5.8 |

## Development Setup

```bash
git clone https://github.com/sugukuru/japan-real-estate-intel-mcp.git
cd japan-real-estate-intel-mcp
pnpm install
```

## Development Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Watch-mode TypeScript compilation |
| `pnpm build` | Full build (clean → tsc → UI assets) |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Tests with v8 coverage report |
| `pnpm lint` | TypeScript type-check |
| `pnpm lint:eslint` | ESLint static analysis |
| `pnpm format` | Prettier auto-format |
| `pnpm format:check` | Check formatting without changes |

## Adding a New Prefecture

1. Create `data/{prefecture}/` directory with the following files:
   - `land_price.csv` — `municipality,district,price_per_sqm,year`
   - `population.csv` — `municipality,year,total_pop,...`
   - `flood.geojson` — GeoJSON FeatureCollection
   - `earthquake.json` — `{ areas: [{ name, probability30yr, maxIntensity }] }`
   - `municipalities.topojson` — TopoJSON with `name` property per feature
   - `neighborhoods.csv` — `neighborhood,city,...` (optional)
   - `README.md` — Data sources and licenses

2. Create `src/data-loaders/{prefecture}-loader.ts` extending `BaseLoader`:
   - Set `capabilities` flags
   - Implement all abstract methods
   - Return `[]` or default data for unsupported capabilities

3. Register the loader in `src/data-loaders/index.ts`:
   ```ts
   import { MyLoader } from './my-loader.js';
   registry.register(new MyLoader());
   ```

4. Add prefecture to `src/prefecture/resolver.ts` PREFECTURE_KEYS map.

5. Write tests in `tests/{prefecture}.test.ts`.

## Pull Request Guidelines

- **One concern per PR** — keep changes focused
- **All tests must pass** — `pnpm test` must be green
- **Type-check clean** — `pnpm lint` must produce no errors
- **No ESLint errors** — `pnpm lint:eslint` must exit 0
- **Coverage maintained** — aim to keep ≥ 70% line coverage
- **Update CHANGELOG.md** under the `[Unreleased]` section
- **Describe data sources** in a comment or README when adding new data files

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- Import order: external → internal, sorted alphabetically
- Comments: explain **why**, not **what** (code should be self-documenting)
- File naming: `kebab-case.ts`
- Exports: named exports preferred over default exports

## Testing

Tests live in `tests/`. Run with:

```bash
pnpm test            # all tests once
pnpm test:coverage   # with v8 coverage (minimum 70% lines)
pnpm test:watch      # watch mode
```

Each new feature should have corresponding tests. Use `vitest` with `describe/it/expect`.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Fukuoka prefecture loader
fix: correct flood zone polygon for Nagoya-shi
chore: bump pino to 10.4
docs: add store location evaluation examples
```

## Reporting Issues

- Search existing issues first
- Include: Node.js version, pnpm version, MCP client name, error message + stack trace
- For data accuracy issues, cite the official data source

## License

By contributing, you agree your contributions will be licensed under the MIT License.

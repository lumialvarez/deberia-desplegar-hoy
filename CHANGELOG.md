# Changelog
Deberia desplegar hoy

## [Unreleased]

## [0.1.0] - 08/08/2025
### Added
- AI agent rules universal en `AGENTS.md` (estándar opencode/Cursor/Copilot/Aider); `.cursorrules` queda como puntero de retrocompatibilidad.
- Sistema de diseño moderno en `src/tailwind.css` con tokens `@theme` (paleta OKLCH, fuentes Space Grotesk + Inter, animaciones `aurora-drift`, `float`, `shimmer`, `pulse-soft`, `fade-up`).
- Hero card con glassmorphism, badge de estado, halo radial animado por nivel y texto con `bg-clip-text` gradiente según nivel (YES → emerald/teal, CAUTION → amber/orange, NO → rose/red, HELL_NO → red/fuchsia).
- Display de hora grande con `font-display` (Space Grotesk) `extralight` y `tabular-nums` para evitar saltos de dígitos.
- Location picker refinado con grid 2 columnas y botón pill `rounded-full`.
- Footer minimalista con divider sutil.
- Estado de carga con skeleton shimmer (reemplaza al spinner CSS).
- Routing con `provideRouter` + `withComponentInputBinding`; ruta 404 servida por `NotFoundComponent` en `core/`.
- 13 tests unitarios para `DeployService` (initial state, level determination por día/hora, generación de mensajes, modo debug, detección IP).
- 4 tests para `DeployDashboardComponent`, 3 para `NotFoundComponent`.
- `:host { display: block }` en todos los sub-componentes (fix de colapso con `space-y-*`).
- Imports estáticos de JSON para `deploy-config.json` y `responses/*.json` (`resolveJsonModule: true` en `tsconfig.json`).
- Tipado estricto en `DeployService` (cero `any`): `IpApiResponse`, `Messages`, `AppState` readonly.

### Changed
- `App` dividido en `features/deploy-dashboard/` con 5 sub-componentes: `StatusCardComponent`, `TimeDisplayComponent`, `LocationPickerComponent`, `DebugControlsComponent`, `DashboardFooterComponent`.
- `app.html` consolidado en el shell; el shell ahora solo renderiza `<router-outlet />`.
- `src/app/models/` y `src/app/services/` movidos dentro de la feature.
- `src/assets/` movido a `src/app/features/deploy-dashboard/data/`.
- Assets cargados por import estático en vez de `HttpClient` (elimina 7 RTTs en cold start).
- Migración de Tailwind CSS v3 → v4 con `@tailwindcss/postcss`; `postcss.config.js` reemplazado por `.postcssrc.json` (Angular solo busca config JSON).
- Migración de `@angular-eslint` v18 → v20; `extends` actualizados a `plugin:@typescript-eslint/recommended` y `plugin:@angular-eslint/...`.
- `provideHttpClient` ahora usa `withFetch()`.
- `interval(5000)` → `interval(60_000)` (la UI solo muestra `HH:mm`).
- `ChangeDetectionStrategy.OnPush` activado en todos los componentes.
- Migradas directivas estructurales `*ngIf`/`*ngFor` a `@if`/`@for ... track` en el template.
- `ResponseLevel`, `Country`, `Timezone`, `AppState` marcados como `readonly` para inmutabilidad.
- Overrides de Angular Material reducidos de 311 a ~100 líneas (paleta OKLCH consistente).
- `index.html` añade Space Grotesk + Inter (con `preconnect`) y meta `theme-color` / `description`.

### Fixed
- Reduce timeout in animation
- Custom elements (inline por defecto) rompiendo `space-y-*` al colapsar layout vertical.
- `keydown` en `mat-form-field` ya no se ve afectado por la barra espaciadora global (espacio solo refresca si el foco no está en un input).

### Removed
- `MatCardModule` (importado sin uso).
- `console.log` en `deploy-service.service.ts`.
- `src/app/models/deploy-response.model.ts` y `src/app/models/location.model.ts` (movidos a la feature).
- `src/app/services/deploy-service.service.ts` (movido y renombrado a `deploy.service.ts`).
- `src/assets/deploy-config.json` y `src/assets/responses/*.json` (movidos a `data/`).
- `postcss.config.js` (reemplazado por `.postcssrc.json`).

## [0.0.5] - 27/07/2025
### Fixed
- Change expose port Dockerfile

## [0.0.4] - 27/07/2025
### Fixed
- Change github workflows and Dockerfile

## [0.0.3] - 07/07/2025
### Fixed
- Add Dockerfile

## [0.0.2] - 07/07/2025
### Added
- Add Main workflow

## [0.0.1] - 07/07/2025
### Added
- Initial version

# AI Agent Rules — Aplicación Angular

> Reglas de proyecto agnósticas de herramienta, diseñadas para ser leídas por
> cualquier asistente de IA (opencode, Cursor, GitHub Copilot, Aider, Continue,
> Claude Code, etc.). Si tu herramienta reconoce `AGENTS.md`, este es el
> archivo canónico. Para Cursor usa además `.cursorrules` (puntero a este
> archivo). Para Claude Code también funciona como `CLAUDE.md` por convención.

## 🎯 Objetivo General

Desarrollar una aplicación Angular moderna, mantenible y escalable siguiendo
las mejores prácticas y patrones de diseño establecidos. Todo asistente que
trabaje en este repositorio debe respetar estas reglas al generar, modificar
o revisar código.

---

## 📌 Meta — Cómo usar este archivo

- **No asumas** detalles del framework o la versión sin leer `package.json`
  y `angular.json`. Este proyecto usa **Angular 20 + standalone APIs +
  Signals + nuevo control flow** (`@if`, `@for`, `@switch`).
- **Comandos del proyecto** (leer `package.json` antes de ejecutar nada):

  | Acción             | Comando                          |
  | ------------------ | -------------------------------- |
  | Dev server         | `npm start`                      |
  | Build producción   | `npm run build:prod`             |
  | Tests (CI)         | `npm run test:ci`                |
  | Tests con coverage | `npm run test:coverage`          |
  | Lint               | `npm run lint`                   |
  | Lint --fix         | `npm run lint:fix`               |
  | Analizar bundle    | `npm run build:analyze`          |

- **No commitees** a menos que el usuario lo pida explícitamente. Antes de
  sugerir un commit, revisa `git status` y `git diff`.
- **Cita ubicaciones** con el formato `ruta/archivo:linea` cuando refieras
  código.
- **Idioma**: responde en español (es-ES) salvo que el usuario pida otro
  idioma. El código, identificadores y mensajes de commit en inglés.
- **Estilo de respuestas**: breve, directo, sin preámbulos innecesarios.
  Evita emojis salvo que el usuario los solicite.

---

## 📁 Estructura del Proyecto

### Organización de Carpetas

```
src/
├── app/
│   ├── core/                    # Singletons, guards, interceptors, errores 404
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── services/
│   │   └── not-found/           # 404 (NotFoundComponent)
│   ├── features/                # Features autocontenidas
│   │   └── deploy-dashboard/    # Página principal
│   │       ├── deploy-dashboard.component.{ts,html,spec.ts}
│   │       ├── components/      # status-card, time-display, location-picker, debug-controls, dashboard-footer
│   │       ├── services/        # deploy.service.ts + .spec.ts
│   │       ├── models/          # location.model, deploy-response.model
│   │       └── data/            # deploy-config.json + responses/{lang}.json
│   ├── app.ts                   # Shell: solo <router-outlet />
│   ├── app.config.ts            # Browser providers
│   ├── app.config.server.ts     # SSR providers (provideServerRendering)
│   └── app.routes.ts
├── tailwind.css                 # @import "tailwindcss" + @theme tokens
├── styles.scss                  # Reset global + overrides Material
├── index.html
├── main.ts                      # Browser entry
└── main.server.ts               # SSR entry (used only at build time)

public/                          # Copia verbatim al build (no pasa por Webpack)
├── favicon.svg
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
└── icons/                       # Iconos PWA (SVG, any + maskable)
```

> No hay `src/assets/`. Los datos estáticos (config, mensajes i18n) viven
> dentro de la feature que los consume y se importan estáticamente desde TS.
> Ver §"📦 Assets estáticos como imports" más abajo.

La raíz tiene un `public/` que Angular copia verbatim al build (favicon,
manifest, robots, sitemap, iconos PWA). Ver §"📱 PWA + SSG" más abajo.

---

## 📱 PWA + SSG (Static Site Generation)

El proyecto está pre-renderizado y es instalable como PWA. El output sigue
siendo estático (sin servidor Node en runtime); nginx lo sirve tal cual.

### Prerender (SSG)

- `angular.json` → `architect.build.options.outputMode: "static"` +
  `server: "src/main.server.ts"`. Con esto Angular ejecuta el server entry
  en build time, prerenderea cada ruta y emite HTML estático.
- Rutas prerenderizadas: `/` y `/404`. La 404 es ruta explícita
  (`{ path: '404', component: NotFoundComponent }`) + wildcard
  `{ path: '**', redirectTo: '/404' }` — el wildcard solo no se prerenderea.
- `app.config.ts` añade `provideClientHydration(withEventReplay())` para
  re-hidratar sin parpadeo en el cliente.
- `app.config.server.ts` solo añade `provideServerRendering()` y se mergea
  con el `appConfig` del browser.

### SSR-safety

- Los servicios que tocan `window`/`document`/`localStorage` deben guardar
  con `isPlatformBrowser(inject(PLATFORM_ID))`. Ejemplo en
  `deploy.service.ts`: la inicialización del constructor (debug mode,
  interval, IP detect) solo corre en browser.
- No uses `setInterval`/`setTimeout` con cleanup manual en el servicio
  durante SSR — déjalo solo para el browser.
- `HttpClient` con `withFetch()` es obligatorio para que el server-side
  rendering funcione (el `XMLHttpRequest` nativo no existe en Node).

### PWA / Service Worker

- `@angular/service-worker` configurado en `ngsw-config.json` (en root).
- En `app.config.ts`: `provideServiceWorker('ngsw-worker.js', { enabled:
  !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })`. El
  flag `enabled: !isDevMode()` evita el SW en `ng serve`.
- `ngsw-config.json` define dos asset groups:
  - `app-shell` (prefetch): `index.html`, `favicon.*`, `manifest`,
    `robots.txt`, `sitemap.xml`, `*.css`, `*.js`.
  - `static-assets` (lazy): `icons/**` y archivos de imagen/fuentes.
- `dataGroups` para la única llamada HTTP saliente (`ipapi.co/json/`) con
  estrategia `freshness`, maxSize 4, maxAge 1d, timeout 3s.
- `navigationUrls` declara qué URLs son "rutas de app" (todo lo que no
  sea archivo con extensión).

### nginx

- `nginx.conf` sirve el `dist/.../browser/` como SPA fallback. Service
  worker en `/ngsw-worker.js` con header `Service-Worker-Allowed: /` y
  `Cache-Control: no-cache` (Angular invalida con `ngsw.json`).
- Assets hasheados (`main-*.js`, `styles-*.css`) llevan
  `Cache-Control: public, immutable` por 1 año.
- Headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` (deshabilita geolocation/mic/
  camera que la app no usa).

---

## 📦 Assets estáticos como imports

- Los JSON pequeños (config, mensajes, fixtures) se importan estáticamente
  desde TS en vez de pedirlos por HTTP.
- Requisitos en `tsconfig.json`:
  ```json
  "compilerOptions": {
    "resolveJsonModule": true,
    "moduleResolution": "bundler"
  }
  ```
- Y los `include` deben cubrir los `.json`:
  ```jsonc
  // tsconfig.app.json y tsconfig.spec.json
  "include": ["src/**/*.ts", "src/**/*.json"]
  ```
- Uso típico en un servicio:
  ```typescript
  import config from '../data/deploy-config.json';
  import messages from '../data/responses/es.json';
  ```
- Trade-off: el bundle crece en KB pero el cold start pierde RTTs. Solo
  recomendable para assets < 100KB. Si crecen, vuelve a HTTP.

---

## 🎨 Design tokens (Tailwind v4)

- El proyecto usa **Tailwind v4**. Los tokens NO van en `tailwind.config.js`
  sino en bloques `@theme` dentro de `src/tailwind.css`:
  ```css
  @import "tailwindcss";

  @theme {
    --color-canvas: oklch(0.14 0.02 270);
    --color-fg: oklch(0.98 0 0);
    --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --animate-aurora: aurora-drift 24s ease-in-out infinite;
    --animate-fade-up: fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  @keyframes aurora-drift { /* ... */ }
  @keyframes fade-up { /* ... */ }
  ```
- PostCSS usa `.postcssrc.json` (no `.js`); Angular solo busca
  `postcss.config.json` o `.postcssrc.json`:
  ```json
  { "plugins": { "@tailwindcss/postcss": {}, "autoprefixer": {} } }
  ```
- Utilidades reutilizables en `src/styles.scss`: `.aurora` (fondo animado),
  `.glass` (glassmorphism), `.skeleton` (shimmer de carga).
- Al añadir un sub-componente nuevo, recuerda `:host { display: block; }` o
  el `space-y-*` del padre no funcionará (los custom elements son inline
  por defecto).

---

## 🏗️ Arquitectura y Patrones

### Principios de Diseño

- **Separación de Responsabilidades**: Cada componente/servicio tiene una
  responsabilidad única.
- **Inyección de Dependencias**: Usar DI para servicios y configuración.
- **Lazy Loading**: Implementar carga diferida para rutas/feature areas
  grandes (`loadComponent` / `loadChildren`).
- **OnPush Change Detection**: Usar `ChangeDetectionStrategy.OnPush` para
  mejor rendimiento.
- **Reactive Programming**: Preferir **Signals** y RxJS sobre callbacks
  tradicionales. Usa `toSignal()` / `toObservable()` para interoperar.
- **Standalone-first**: por defecto, todo es standalone. No crear `NgModule`
  salvo que sea estrictamente necesario (p. ej. configuración global).
- **Nuevo control flow**: usa `@if`, `@for`, `@switch` en vez de las
  directivas estructurales antiguas.

### Patrones de Componentes

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-feature-name',
  standalone: true,
  templateUrl: './feature-name.component.html',
  styleUrls: ['./feature-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureNameComponent implements OnInit, OnDestroy {
  private readonly service = inject(FeatureService);
  private readonly destroy$ = new Subject<void>();

  protected readonly items = signal<Item[]>([]);

  ngOnInit(): void {
    this.service
      .getItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => this.items.set(items));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 🎨 Estilos y UI/UX

### Framework de UI

- **Angular Material**: Componentes base del sistema de diseño.
- **Tailwind CSS**: Utilidades CSS para estilos personalizados.
- **SCSS**: Variables, mixins y funciones para consistencia.

### Variables de Diseño

```scss
// _variables.scss
:root {
  // Colores
  --primary-color: #1976d2;
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --error-color: #f44336;

  // Tipografía
  --font-family: 'Roboto', sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  // Espaciado
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  // Breakpoints
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}
```

---

## 🔧 Configuración y Herramientas

### ESLint y Prettier

```json
{
  "extends": [
    "@angular-eslint/recommended",
    "@angular-eslint/template/recommended"
  ],
  "rules": {
    "@angular-eslint/component-selector": [
      "error",
      {
        "type": "element",
        "prefix": "app",
        "style": "kebab-case"
      }
    ],
    "@angular-eslint/directive-selector": [
      "error",
      {
        "type": "attribute",
        "prefix": "app",
        "style": "camelCase"
      }
    ]
  }
}
```

### Husky y Git Hooks

- Pre-commit: Linting y formateo automático.
- Pre-push: Tests unitarios.
- Commit message: Convenciones de Conventional Commits.

---

## 📊 Estado y Gestión de Datos

### NgRx Store (Para aplicaciones complejas)

```typescript
interface AppState {
  auth: AuthState;
  user: UserState;
  [feature]: FeatureState;
}

// Actions
export const featureActions = createActionGroup({
  source: 'Feature',
  events: {
    'Load Items': emptyProps(),
    'Load Items Success': props<{ items: Item[] }>(),
    'Load Items Failure': props<{ error: string }>(),
  },
});

// Reducers
export const featureReducer = createReducer(
  initialState,
  on(featureActions.loadItems, (state) => ({ ...state, loading: true })),
  on(featureActions.loadItemsSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
  })),
);
```

### Servicios con HttpClient + RxJS

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/items`).pipe(
      retry(3),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong'));
  }
}
```

---

## 🧪 Testing

### Testing Unitario (Jasmine + TestBed)

```typescript
describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  let service: jasmine.SpyObj<FeatureService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FeatureService', ['getData']);

    await TestBed.configureTestingModule({
      imports: [FeatureComponent], // standalone
      providers: [{ provide: FeatureService, useValue: spy }],
    }).compileComponents();

    service = TestBed.inject(FeatureService) as jasmine.SpyObj<FeatureService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Testing E2E con Playwright

```typescript
import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

---

## 🚀 Performance y Optimización

### Estrategias de Rendimiento

- **Lazy Loading**: Cargar rutas/feature areas bajo demanda.
- **Preloading**: Precargar módulos críticos.
- **Virtual Scrolling**: `cdk-virtual-scroll-viewport` para listas grandes.
- **`track` expression en `@for`**: obligatorio en listas largas.
- **OnPush Change Detection**: Reducir ciclos de detección.
- **Signals + computed**: derivar estado en lugar de recomputar en
  templates.

### Bundle Optimization

```jsonc
// angular.json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "aot": true,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true
            }
          }
        }
      }
    }
  }
}
```

---

## 🔒 Seguridad

### Mejores Prácticas

- **XSS Prevention**: nunca uses `innerHTML`/`bypassSecurityTrust*` sin
  sanitizar. Angular ya escapa por defecto; respeta el binding `[innerText]`.
- **CSRF Protection**: tokens en requests sensibles.
- **Content Security Policy**: headers de seguridad.
- **HTTPS Only**: en producción.
- **Input Validation**: validación tanto cliente como servidor.

### Guards de Autenticación (standalone, funcional)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
```

---

## 📱 Responsive Design

### Breakpoints y Media Queries

```scss
// Mobile First approach
.container {
  padding: var(--spacing-md);

  @media (min-width: 768px) {
    padding: var(--spacing-lg);
  }

  @media (min-width: 1024px) {
    padding: var(--spacing-xl);
  }
}
```

---

## 🌐 Internacionalización

### i18n Setup

```typescript
import { HttpClient } from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'es',
    }),
  ],
})
export class AppModule {}
```

---

## 📝 Convenciones de Código

### Nomenclatura

- **Componentes**: `feature-name.component.ts`
- **Servicios**: `feature.service.ts`
- **Interfaces / Types**: `feature.interface.ts` o `feature.model.ts`
- **Enums**: `feature.enum.ts`
- **Constantes**: `feature.constants.ts`
- **Signals**: `readonly items = signal<Item[]>([])` + camelCase.

### Imports Organizados

```typescript
// 1. Angular
import { Component, inject } from '@angular/core';

// 2. Third-party
import { Observable } from 'rxjs';

// 3. Application
import { FeatureService } from './feature.service';
import { FeatureModel } from './models/feature.model';
```

---

## 🔄 CI/CD

### Pipeline para Pull Requests (Solo Tests)

```yaml
# .github/workflows/pull-request.yml
name: Pull Request Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run e2e tests
        run: npm run e2e

      - name: Check bundle size
        run: npm run build:analyze

      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Pipeline para Main Branch (Tests + Deploy)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run e2e
      - run: npm run build:prod
      - uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist/
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - run: npm audit --audit-level=high

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    environment: staging
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist-files
          path: dist/
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist-files
          path: dist/
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
```

---

## 📚 Documentación

> La descripción completa del proyecto (funcionalidad, casos de uso,
> instalación, etc.) está en `README.md`. Cuando generes documentación,
> respeta el tono humorístico del proyecto pero mantén la información
> técnica precisa y en español.

---

## 🎯 Metas de Calidad

### Métricas Objetivo

- **Lighthouse Score**: >90 en todas las categorías.
- **Bundle Size**: <500KB inicial.
- **First Contentful Paint**: <1.5s.
- **Time to Interactive**: <3.5s.
- **Test Coverage**: >80%.

### Monitoreo

- **Error Tracking**: Sentry o similar.
- **Performance Monitoring**: Google Analytics, Web Vitals.
- **User Analytics**: Hotjar, Google Analytics.

---

## 💡 Consejos Adicionales

1. **Mantén el código simple**: evita over-engineering.
2. **Documenta decisiones importantes** (ADRs) cuando cambien patrones.
3. **Code Reviews**: revisa el código antes de merge.
4. **Refactoring continuo**: mejora el código constantemente.
5. **Mantén dependencias actualizadas**: `npm audit` regularmente.
6. **TypeScript strict mode**: ya activo, mantenlo.
7. **Manejo de errores**: implementa `ErrorHandler` global y boundaries.
8. **Optimiza imágenes**: WebP, lazy loading, responsive images.

---

## 🤖 Notas para asistentes de IA

- **opencode**: lee este `AGENTS.md` automáticamente al iniciar sesión en
  este directorio. Para cargar reglas adicionales desde otros archivos,
  puedes usar `opencode.json` con el campo `instructions` (ver docs de
  opencode → Rules).
- **Cursor (>=0.45)**: detecta `AGENTS.md` en la raíz. `.cursorrules`
  contiene solo un puntero a este archivo para versiones antiguas.
- **Claude Code**: usa `CLAUDE.md` como alias compatible si renombras o
  symlinkeas este archivo.
- **GitHub Copilot / Cody / Continue / Aider**: también consumen
  `AGENTS.md` o lo que se les indique en su configuración como
  "custom instructions". Mantén este archivo en la raíz del repo.
- **Cuando generes código nuevo**: respeta las convenciones existentes del
  repo. Antes de añadir una dependencia, busca primero en `package.json`
  si ya existe una alternativa.

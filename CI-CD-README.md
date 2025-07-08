# CI/CD - Workflow de Pull Requests

## 📋 Descripción

Este archivo describe el pipeline de CI/CD configurado para este proyecto Angular. El workflow se ejecuta automáticamente en cada Pull Request hacia las ramas `main` y `develop`.

## 🔄 Flujo de Trabajo

### Workflow: `pull-request.yml`

El workflow de Pull Request incluye los siguientes pasos:

#### 1. **Checkout del código**
```yaml
- uses: actions/checkout@v4
```
- Descarga el código fuente del repositorio

#### 2. **Configuración de Node.js**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```
- Configura Node.js versión 20 (requerida por Angular CLI)
- Habilita el cache de npm para acelerar builds

#### 3. **Instalación de dependencias**
```bash
npm ci
```
- Instala todas las dependencias del proyecto
- Usa `npm ci` para instalaciones más rápidas y deterministas

#### 4. **Linting del código**
```bash
npm run lint
```
- Ejecuta ESLint para verificar calidad del código
- Verifica TypeScript y templates HTML
- Configurado para no fallar el build (`continue-on-error: true`)

#### 5. **Tests unitarios con coverage**
```bash
npm run test:ci
```
- Ejecuta todos los tests unitarios
- Genera reporte de coverage en múltiples formatos:
  - HTML (para visualización local)
  - LCOV (para integración con herramientas)
  - Cobertura (para GitHub Actions)

#### 6. **Build de producción**
```bash
npm run build:prod
```
- Construye la aplicación para producción
- Verifica que no hay errores de compilación
- Optimiza el código para deploy

#### 7. **Subida de coverage**
- **Codecov**: Sube el coverage a Codecov para tracking histórico
- **GitHub Artifacts**: Guarda reportes de coverage como artifacts
- **PR Comment**: Comenta el coverage directamente en el Pull Request

## 📊 Reportes de Coverage

### Tipos de reporte generados:

1. **HTML Report**: Visualización completa del coverage
2. **LCOV**: Formato estándar para integración con herramientas
3. **Cobertura**: Formato XML para GitHub Actions
4. **Text Summary**: Resumen en consola

### Configuración de Coverage:

```javascript
// karma.conf.js
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/deberia-desplegar-hoy'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' },
    { type: 'lcovonly' },
    { type: 'cobertura' }
  ]
}
```

## 🎯 Métricas de Calidad

### Coverage Mínimo:
- **Configurado**: 75% de cobertura mínima
- **Comportamiento**: No falla el build si está por debajo
- **Reporte**: Siempre se genera y comenta en el PR

### ESLint Rules:
- Prefijos de componentes: `app-`
- Prefijos de directivas: `app`
- Estilo de componentes: `kebab-case`
- Estilo de directivas: `camelCase`
- TypeScript strict mode habilitado

## 🚀 Scripts Disponibles

```json
{
  "scripts": {
    "build:prod": "ng build --configuration production",
    "build:analyze": "ng build --stats-json && npx webpack-bundle-analyzer dist/stats.json",
    "test:ci": "ng test --watch=false --code-coverage --browsers ChromeHeadless",
    "test:coverage": "ng test --watch=false --code-coverage",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix"
  }
}
```

## 📦 Artifacts Generados

Cada build genera los siguientes artifacts:

1. **Coverage Reports**: Reportes de cobertura completos
2. **Build Output**: Aplicación construida para producción
3. **Test Results**: Resultados de tests unitarios

## 🔧 Configuración Local

Para ejecutar localmente las mismas verificaciones:

```bash
# Instalar dependencias
npm ci

# Ejecutar linting
npm run lint

# Ejecutar tests with coverage
npm run test:coverage

# Build de producción
npm run build:prod
```

## 🐛 Troubleshooting

### Error de Linting:
```bash
# Intentar reparar automáticamente
npm run lint:fix
```

### Error de Tests:
```bash
# Ejecutar tests en modo watch
npm test
```

### Error de Build:
```bash
# Verificar dependencias
npm audit
npm audit fix
```

## 📈 Próximos Pasos

### Mejoras Planificadas:
1. **E2E Tests**: Agregar tests end-to-end con Playwright
2. **Security Scan**: Audit de dependencias y vulnerabilidades
3. **Performance Budget**: Límites de tamaño de bundle
4. **Lighthouse CI**: Auditoría de performance automática

### Integración con Herramientas:
- **SonarQube**: Análisis de calidad de código
- **Dependabot**: Actualizaciones automáticas de dependencias
- **CodeClimate**: Métricas de mantenibilidad

---

## 🔗 Links Útiles

- [Angular CLI Documentation](https://angular.io/cli)
- [ESLint Angular Rules](https://github.com/angular-eslint/angular-eslint)
- [Karma Configuration](https://karma-runner.github.io/6.4/config/configuration-file.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)

---

*Este workflow está diseñado para mantener la calidad del código y facilitar el desarrollo colaborativo. ¡Contribuye con mejoras! 🚀* 
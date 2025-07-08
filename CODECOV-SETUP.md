# 📊 Configuración de Codecov

## 🎯 ¿Qué es Codecov?

Codecov es una herramienta que te permite:
- 📈 **Rastrear coverage** de código a lo largo del tiempo
- 🔍 **Visualizar reportes** detallados de cobertura
- 📝 **Comentarios automáticos** en Pull Requests
- 📊 **Métricas históricas** de calidad del código

## 🚀 Configuración Paso a Paso

### **Paso 1: Crear Cuenta**

1. **Ir a [codecov.io](https://codecov.io)**
2. **Clic en "Sign up"**
3. **Seleccionar "Sign up with GitHub"**
4. **Autorizar la aplicación**

### **Paso 2: Agregar Repositorio**

1. **Dashboard de Codecov**: Una vez logueado, verás tu dashboard
2. **Buscar repositorio**: Busca `lumialvarez/deberia-desplegar-hoy`
3. **Activar**: Haz clic en "Set up repository"
4. **Configurar permisos**: Codecov necesita acceso de lectura

### **Paso 3: Token (solo para repos privados)**

**❗ IMPORTANTE**: Si tu repositorio es **público**, puedes saltar este paso.

**Si tu repositorio es privado**:

1. **Obtener token**:
   - Ve a tu repositorio en Codecov
   - Settings → Repository Upload Token
   - Copia el token que aparece

2. **Agregar a GitHub Secrets**:
   - Ve a tu repositorio en GitHub
   - Settings → Secrets and variables → Actions
   - Clic en "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: [pegar el token]

### **Paso 4: Verificar Configuración**

El workflow ya está configurado automáticamente. Incluye:

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: false
    token: ${{ secrets.CODECOV_TOKEN }}
```

## 📁 Archivos de Configuración

### **codecov.yml**
Archivo que personaliza el comportamiento de Codecov:

```yaml
# Coverage targets
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 1%
    patch:
      default:
        target: 60%
        threshold: 5%

# Archivos ignorados
ignore:
  - "*.spec.ts"
  - "src/environments/*"
  - "src/assets/*"
```

## 🎯 Configuración Personalizada

### **Targets de Coverage**
- **Proyecto general**: Target automático, threshold 1%
- **Nuevos cambios**: Target 60%, threshold 5%
- **Rango aceptable**: 50-90%

### **Archivos Ignorados**
- Tests (`*.spec.ts`)
- Configuración (`karma.conf.js`)
- Assets (`src/assets/*`)
- Ambientes (`src/environments/*`)

### **Comentarios en PR**
- **Layout**: Diff, flags, y archivos
- **Comportamiento**: Default (comenta siempre)
- **Ramas**: main, develop

## 📊 Qué Esperar

### **En el Dashboard**
- 📈 **Gráficos de coverage** a lo largo del tiempo
- 📊 **Métricas por commit** y pull request
- 🔍 **Análisis detallado** archivo por archivo

### **En Pull Requests**
- 📝 **Comentario automático** con resumen de coverage
- 📉 **Comparación** con la rama base
- 🎯 **Status checks** verdes/rojos

### **Ejemplo de Comentario**
```
## [Codecov](https://codecov.io/gh/lumialvarez/deberia-desplegar-hoy) Report
> Coverage: 73.45% (+2.10%) compared to base

| Coverage | Δ | File |
|----------|---|------|
| 85.00% | +5.00% | src/app/services/deploy.service.ts |
| 67.50% | -2.50% | src/app/app.component.ts |
```

## 🔧 Troubleshooting

### **Error: "No coverage reports found"**
```yaml
# Verificar que el archivo existe
- name: Check coverage files
  run: ls -la coverage/
```

### **Error: "Invalid token"**
1. Verificar que el token esté correctamente configurado
2. Regenerar token en Codecov
3. Actualizar secret en GitHub

### **Coverage muy bajo**
- Revisar archivos ignorados en `codecov.yml`
- Verificar que los tests cubran código importante
- Ajustar targets según el proyecto

## 🎯 Mejores Prácticas

### **1. Mantener Coverage Estable**
- Target realista (no 100%)
- Threshold gradual
- Ignorar archivos de configuración

### **2. Revisar Reportes**
- Verificar nuevos archivos
- Identificar código sin tests
- Priorizar funcionalidad crítica

### **3. Usar en Code Review**
- Revisar comentarios de Codecov
- Verificar que nuevos cambios tengan tests
- Mantener o mejorar coverage

## 🔗 Links Útiles

- [Codecov Dashboard](https://codecov.io)
- [Documentación Codecov](https://docs.codecov.com)
- [GitHub Actions Integration](https://docs.codecov.com/docs/github-actions)
- [Codecov YAML Reference](https://docs.codecov.com/docs/codecov-yaml)

---

## 🎉 ¡Listo!

Una vez configurado, Codecov:
- ✅ **Recibe automáticamente** reportes de coverage
- ✅ **Comenta en cada PR** con métricas
- ✅ **Trackea progreso** a lo largo del tiempo
- ✅ **Ayuda a mantener** calidad del código

**¡Tu proyecto ahora tiene monitoreo profesional de coverage!** 🚀 
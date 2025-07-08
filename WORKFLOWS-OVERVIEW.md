# 🔄 Configuración de Workflows

## 📋 Resumen del Sistema Dual

Este proyecto utiliza una configuración dual de workflows para maximizar la calidad del código y el tracking de coverage:

### **1. Pull Request Workflow** (`pull-request.yml`)
- **Trigger**: Cada Pull Request hacia `main` o `develop`
- **Propósito**: Validación temprana y feedback
- **Coverage**: Comparación con rama base

### **2. Main Branch Workflow** (`main.yml`)
- **Trigger**: Push a rama `main`
- **Propósito**: Coverage oficial y preparación para deploy
- **Coverage**: Tracking histórico oficial

## 🔧 Configuración Detallada

### **Pull Request Workflow**
```yaml
# .github/workflows/pull-request.yml
name: Pull Request Checks
on:
  pull_request:
    branches: [main, develop]
```

**Pasos:**
1. ✅ **Checkout** código
2. ✅ **Setup Node.js** 20
3. ✅ **Install** dependencias
4. ✅ **Linting** (no falla build)
5. ✅ **Tests** con coverage
6. ✅ **Build** de producción
7. ✅ **Upload** coverage a Codecov (`codecov-pr`)
8. ✅ **Upload** artifacts a GitHub

### **Main Branch Workflow**
```yaml
# .github/workflows/main.yml
name: Main Branch CI/CD
on:
  push:
    branches: [main]
```

**Jobs:**

#### **1. test-and-build**
1. ✅ **Checkout** código
2. ✅ **Setup Node.js** 20
3. ✅ **Install** dependencias
4. ✅ **Linting** (no falla build)
5. ✅ **Tests** con coverage
6. ✅ **Build** de producción
7. ✅ **Upload** coverage a Codecov (`codecov-main`)
8. ✅ **Upload** artifacts (coverage y build)
9. ✅ **Create** summary con métricas

#### **2. security-scan**
1. ✅ **Checkout** código
2. ✅ **Setup Node.js** 20
3. ✅ **Install** dependencias
4. ✅ **Security audit** (moderate level)
5. ✅ **Dependency check** (high level)

#### **3. deploy-ready**
1. ✅ **Download** build artifacts
2. ✅ **Deployment** ready notification
3. ✅ **Summary** con checklist completo

## 📊 Codecov Configuration

### **Diferencias entre PRs y Main**

| Aspecto | Pull Requests | Main Branch |
|---------|---------------|-------------|
| **Nombre** | `codecov-pr` | `codecov-main` |
| **Propósito** | Comparación y feedback | Tracking histórico oficial |
| **Comentarios** | ✅ Automáticos en PR | ❌ No comenta |
| **Status Checks** | ✅ Verde/Rojo | ✅ Verde/Rojo |
| **Base Comparison** | ✅ Vs rama base | ❌ Absoluto |

### **Configuración en `codecov.yml`**

```yaml
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
        only_pulls: true
```

## 🎯 Flujo de Trabajo Completo

### **1. Durante Desarrollo**
```
Feature Branch → Pull Request → pull-request.yml ejecuta
↓
✅ Tests, linting, build
✅ Coverage comparado con main
✅ Comentarios automáticos de Codecov
✅ Status checks verde/rojo
```

### **2. Al Hacer Merge**
```
PR aprobado → Merge a main → main.yml ejecuta
↓
✅ Tests, linting, build
✅ Coverage oficial a Codecov
✅ Security scan
✅ Build artifacts listos
✅ Deploy ready notification
```

## 🚀 Beneficios del Sistema Dual

### **Para Pull Requests**
- 📝 **Feedback inmediato** antes del merge
- 📊 **Comparación visual** del coverage
- 🔍 **Detección temprana** de problemas
- 🎯 **Status checks** claros

### **Para Main Branch**
- 📈 **Tracking histórico** limpio
- 🔒 **Coverage oficial** de producción
- 🛡️ **Security scanning** completo
- 🚀 **Deploy preparation** automática

## 📋 Próximos Pasos

### **Configuración Inicial**
1. ✅ **Workflows** creados
2. ⏳ **Codecov** configurar cuenta
3. ⏳ **GitHub Secrets** agregar `CODECOV_TOKEN`
4. ⏳ **Primer PR** para probar

### **Mejoras Futuras**
- 🔄 **E2E Tests** con Playwright
- 📱 **Lighthouse CI** para performance
- 🐳 **Docker** para despliegue
- 📊 **SonarQube** para análisis de código

## 🔗 Links Relacionados

- [Pull Request Workflow](/.github/workflows/pull-request.yml)
- [Main Branch Workflow](/.github/workflows/main.yml)
- [Codecov Configuration](/codecov.yml)
- [Codecov Setup Guide](/CODECOV-SETUP.md)

---

**¡Tu proyecto ahora tiene un sistema profesional de CI/CD con tracking dual de coverage!** 🎉 
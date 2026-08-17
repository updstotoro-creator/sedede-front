# Configuración inicial de sedede-frontend — Plan de implementación

> **Para agentes de trabajo:** SUB-SKILL REQUERIDO: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan sintaxis de casilla (`- [ ]`) para seguimiento.

**Objetivo:** Dejar el scaffold de `sedede-frontend` configurado con Vue 3 estable, ramas `main`/`desarrollo`, protección de `main` en GitHub y todo el contenido en español.

**Arquitectura:** SPA de Vue 3 + Vite + Pinia + Vue Router que consume la API de Laravel 12 por HTTP (`VITE_API_URL`). Los cambios son de configuración y contenido; no se implementan rutas ni componentes de la app real.

**Stack técnico:** Vue 3.5.41, Vue Router 5.2.0, Pinia 4.0.3, Vite 8.2.1, GitHub CLI (`gh`).

## Restricciones globales

- Todo el contenido en español: textos de la UI (`App.vue`), `index.html`, `README.md` y mensajes de commit.
- Vue 3 estable: `vue@^3.5.41`, sin `"vue": "rc"` ni `overrides` de `@vue/*`.
- Nombre del proyecto: `sedede-frontend`.
- Ramas: `main` (estable, protegida) y `desarrollo` (trabajo diario).
- SPA independiente: sin Inertia, sin Blade.
- Commit inicial actual: `2a83c2e` (scaffold). Documento de diseño en `70cbb6a` (rama `primera`).

---

### Task 1: Estructura de ramas — crear `desarrollo` y eliminar `primera`

**Archivos:**
- No modifica archivos; operaciones de git únicamente.

**Interfaces:**
- Consume: commit `70cbb6a` (scaffold + doc de diseño) como HEAD actual de `primera`.
- Produce: rama local `desarrollo` en el HEAD actual, lista para los Tasks 2 y 3; rama `primera` eliminada.

- [ ] **Paso 1: Crear y cambiar a `desarrollo` desde el HEAD actual**

Run: `git checkout -b desarrollo`
Expected: `Switched to a new branch 'desarrollo'` — el HEAD de `desarrollo` incluye el commit del scaffold (`2a83c2e`) y el del diseño (`70cbb6a`).

- [ ] **Paso 2: Eliminar la rama local `primera`**

Run: `git branch -d primera`
Expected: `Deleted branch primera (was 70cbb6a).` (eliminación segura porque `desarrollo` contiene su HEAD).

- [ ] **Paso 3: Verificar el estado de ramas**

Run: `git branch`
Expected:
```
  main
* desarrollo
```

- [ ] **Paso 4: Commit** — no aplica (solo operaciones de ramas). Continuar al Task 2.

---

### Task 2: Vue 3 estable en `package.json`

**Archivos:**
- Modify: `package.json`

**Interfaces:**
- Consume: rama `desarrollo` (Task 1).
- Produce: `package.json` con dependencias estables; lockfile actualizado.

- [ ] **Paso 1: Editar `package.json` — sección `dependencies`**

Reemplazar el bloque actual:
```json
  "dependencies": {
    "pinia": "^4.0.2",
    "vue": "rc",
    "vue-router": "^5.2.0"
  },
```
por:
```json
  "dependencies": {
    "pinia": "^4.0.3",
    "vue": "^3.5.41",
    "vue-router": "^5.2.0"
  },
```

- [ ] **Paso 2: Eliminar el bloque `overrides` completo**

Eliminar del final de `package.json`:
```json
  "overrides": {
    "vue": "rc",
    "@vue/compiler-core": "rc",
    "@vue/compiler-dom": "rc",
    "@vue/compiler-sfc": "rc",
    "@vue/compiler-ssr": "rc",
    "@vue/compiler-vapor": "rc",
    "@vue/reactivity": "rc",
    "@vue/runtime-core": "rc",
    "@vue/runtime-dom": "rc",
    "@vue/runtime-vapor": "rc",
    "@vue/server-renderer": "rc",
    "@vue/shared": "rc",
    "@vue/compat": "rc"
  }
```
El JSON final debe terminar en la propiedad `engines` (conservar las comas correctas).

- [ ] **Paso 3: Instalar dependencias y verificar versión estable**

Run: `npm install`
Expected: sin errores. Luego verificar que vue instalado es estable:
Run: `npm ls vue`
Expected: `vue@3.5.41` (u otra 3.x estable, nunca `3.6.0-rc.x`).

- [ ] **Paso 4: Verificar el build**

Run: `npm run build`
Expected: build completado sin errores, con salida `✓ built in ...`.

- [ ] **Paso 5: Commit**

Run:
```bash
git add package.json package-lock.json
git commit -m "chore: usa versión estable de Vue 3"
```

---

### Task 3: Traducción y limpieza a español

**Archivos:**
- Modify: `README.md`
- Modify: `index.html`
- Modify: `src/App.vue`

**Interfaces:**
- Consume: `package.json` estable (Task 2).
- Produce: contenido del proyecto íntegramente en español y `lang`/título correctos.

- [ ] **Paso 1: Reemplazar `README.md` completo**

Reescribir con:
```markdown
# sedede-frontend

Frontend SPA en Vue 3 que consume la API de Laravel 12.

## Requisitos

- Node.js 22.18+ o 24.12+ (ver `engines` en `package.json`)
- npm

## Instalación

```sh
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar los valores:

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API de Laravel | `http://localhost:8000/api` |

## Comandos

- `npm run dev` — servidor de desarrollo con recarga en caliente
- `npm run build` — compilar y minificar para producción
- `npm run preview` — previsualizar el build de producción
- `npm run lint` — lint y auto-corrección (oxlint + eslint)
- `npm run format` — formatear el código con oxfmt

## Flujo de ramas

- `main` — rama estable protegida; solo se actualiza mediante PR desde `desarrollo`
- `desarrollo` — rama de trabajo diario

Proceso:

1. Trabajar en `desarrollo` (o en ramas de feature derivadas de ella)
2. Abrir un PR de `desarrollo` hacia `main`
3. Obtener al menos 1 aprobación (requisito de la protección de `main`)
4. Mergear el PR en GitHub

## IDE recomendado

[VS Code](https://code.visualstudio.com/) + extensión [Vue (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar).
```

- [ ] **Paso 2: Editar `index.html`**

Cambiar la línea `<html lang="">` por:
```html
<html lang="es">
```
Cambiar `<title>Vite App</title>` por:
```html
<title>sedede-frontend</title>
```

- [ ] **Paso 3: Editar `src/App.vue` — texto placeholder en español**

Reemplazar el bloque `<template>` por:
```vue
<template>
  <h1>¡Lo lograste!</h1>
  <p>
    Visita <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> para leer la
    documentación
  </p>
</template>
```

- [ ] **Paso 4: Verificar lint y build**

Run: `npm run lint`
Expected: sin errores.
Run: `npm run build`
Expected: build completado sin errores.

- [ ] **Paso 5: Commit**

Run:
```bash
git add README.md index.html src/App.vue
git commit -m "docs: traduce contenido del proyecto a español"
```

---

### Task 4: Publicar `desarrollo` y proteger `main` en GitHub

**Archivos:**
- No modifica archivos; operaciones de git y de GitHub CLI.

**Interfaces:**
- Consume: rama `desarrollo` con Tasks 2 y 3 (commit `docs: traduce contenido...`).
- Produce: `desarrollo` publicado en GitHub y `main` con branch protection (PR obligatorio + 1 aprobación + aplica a administradores).

- [ ] **Paso 1: Publicar `desarrollo` en GitHub**

Run: `git push -u origin desarrollo`
Expected: `remote: ... * [new branch] desarrollo` y `branch 'desarrollo' set up to track 'origin/desarrollo'`.

- [ ] **Paso 2: Instalar GitHub CLI (`gh`)**

Run: `winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements`
Expected: instalación completada (`Successfully installed`). Si `gh` no queda en el PATH de la sesión actual, abrir una terminal nueva o usar la ruta completa `"C:\Program Files\GitHub CLI\gh.exe"`.

- [ ] **Paso 3: Verificar instalación**

Run: `gh --version`
Expected: `gh version X.Y.Z (...)`.

- [ ] **Paso 4: Autenticarse con GitHub**

Run: `gh auth login --web -h github.com`
Expected: abre el navegador con un código; seguir los pasos y verificar `✓ Logged in as <usuario>`. Este paso es interactivo; requerirá confirmación del usuario.

- [ ] **Paso 5: Configurar protección de la rama `main`**

Run:
```bash
gh api --method PUT repos/updstotoro-creator/sedede-front/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "enforce_admins": true,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```
Expected: respuesta JSON con `"url": "...branches/main/protection"`.

- [ ] **Paso 6: Verificar la protección**

Run: `gh api repos/updstotoro-creator/sedede-front/branches/main/protection`
Expected: JSON con `"required_pull_request_reviews": { "required_approving_review_count": 1, ... }` y `"enforce_admins": { "enabled": true }`.

---

### Task 5: PR inicial de `desarrollo` a `main`

**Archivos:**
- No modifica archivos; operación de GitHub.

**Interfaces:**
- Consume: `main` protegido (Task 4) y `desarrollo` actualizado (Tasks 2-3).
- Produce: PR abierto de `desarrollo` → `main` listo para revisión/aprobación.

- [ ] **Paso 1: Crear el PR**

Run:
```bash
gh pr create --base main --head desarrollo --title "feat: configuración inicial del frontend" --body "Configura Vue 3 estable, ramas main/desarrollo, protección de main y contenido en español."
```
Expected: URL del PR en la salida.

- [ ] **Paso 2: Solicitar aprobación del usuario**

Informar al usuario que debe aprobar y mergear el PR en GitHub (requisito de la protección: 1 aprobación). Alternativamente:
Run: `gh pr view --json number,url,state`
Expected: estado del PR; si el usuario lo aprobó, mergear con:
Run: `gh pr merge --merge --auto`

- [ ] **Paso 3: Verificar estado final de ramas**

Run: `git fetch origin && git ls-remote --heads origin`
Expected: `main` y `desarrollo` presentes; `primera` ausente.

---

## Auto-revisión del plan

- **Cobertura del spec:** Vue estable (Task 2), ramas + eliminación de `primera` (Task 1), protección `main` (Task 4), traducción/limpieza (Task 3), documentación del flujo (Task 3/README). Criterios de éxito 1-6 cubiertos por los pasos de verificación.
- **Placeholders:** sin TBD/TODO; todo paso tiene comandos y contenido exactos.
- **Consistencia de tipos:** comandos y rutas coherentes entre tasks; nombre del repo remoto `updstotoro-creator/sedede-front` idéntico en Tasks 4-5.

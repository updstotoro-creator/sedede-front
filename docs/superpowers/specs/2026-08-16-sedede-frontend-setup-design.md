# Configuración inicial de sedede-frontend

Fecha: 2026-08-16
Estado: aprobado

## Objetivo

Dejar el proyecto `sedede-frontend` (scaffold de Vue 3) listo para desarrollo, con:

1. Versión estable de Vue 3 compatible con Laravel 12.
2. Flujo de ramas `main` (estable) y `desarrollo` (trabajo diario).
3. Protección de la rama `main` en GitHub.
4. Todo el contenido en español (código, textos, documentación, commits).

## Contexto

El proyecto ya existe como scaffold de Vue 3 + Vite + Pinia + Vue Router en
`C:\xampp\htdocs\sedede-frontend`, con un commit inicial en la rama `primera`
que también está en `main`/`origin/main`. El remoto es
`https://github.com/updstotoro-creator/sedede-front.git`.

El frontend es una SPA independiente que consume la API de Laravel 12 vía
`VITE_API_URL` (configuración ya presente en `.env.example`).

Estado actual relevante:

- `package.json` usa `"vue": "rc"` (release candidate) y `overrides` de `@vue/*`
  en `rc`; no es una versión estable.
- Textos del scaffold en inglés (`App.vue`, `index.html`, `README.md`).
- Existe la rama local `primera` (huérfana respecto a la convención).

## Stack y versión

- Vue 3 estable (última 3.x estable disponible en npm).
- Pinia y Vue Router en versiones estables compatibles.
- Vite como build tool.
- SPA independiente + API Laravel 12 (HTTP, sin Inertia, sin Blade).

## Ramas de git

- `main`: rama estable y protegida; solo se actualiza vía PR desde `desarrollo`.
- `desarrollo`: rama de trabajo diario.
- Se elimina la rama local `primera`.
- Se crea `desarrollo` desde `main` y se publica en GitHub.

## Protección de main en GitHub

- Instalar GitHub CLI (`gh`) vía winget (requiere autenticación interactiva).
- Configurar branch protection en `main`:
  - Requiere pull request (sin push directo).
  - Requiere 1 aprobación de revisor.
  - Aplica también a administradores.

## Traducción y limpieza

- `README.md`: reescrito en español con el flujo de trabajo.
- `index.html`: `lang="es"` y título en español.
- `App.vue`: texto placeholder en español.
- `package.json`: nombre `sedede-frontend`; quitar `"vue": "rc"` y los
  `overrides`; usar versiones estables.
- Mensajes de commit en español.

## Documentación

- Sección en el README explicando el flujo de ramas: trabajar en `desarrollo`,
  crear PR hacia `main`, protección de la rama estable.

## Criterios de éxito

1. `npm install` resuelve dependencias con Vue 3 estable (sin `rc`).
2. `npm run lint` pasa sin errores.
3. `npm run build` genera el bundle correctamente.
4. Existen `main` y `desarrollo` en el remoto; `primera` eliminada.
5. `main` tiene protección en GitHub (PR obligatorio + 1 aprobación).
6. README, textos de la app e index.html en español.

## Fuera de alcance

- No se crea CI (GitHub Actions).
- No se implementan rutas ni componentes de la aplicación real (se mantiene el
  placeholder del scaffold).

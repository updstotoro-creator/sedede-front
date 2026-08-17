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

# SEDEDE Chuquisaca — Frontend

Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router + Axios.

## Setup

```bash
npm install
cp .env.example .env   # ajusta VITE_API_BASE_URL al backend Laravel
npm run dev
```

## Estructura

```
src/
├── components/
│   ├── landing/   # Navbar, Hero, Servicios, Footer (landing pública)
│   └── auth/      # LoginForm.vue (con estados loading/error)
├── views/
│   ├── LandingView.vue
│   └── LoginView.vue
├── services/
│   ├── api.js         # instancia axios + interceptores
│   └── authService.js # login/logout/me contra Sanctum
├── stores/
│   └── auth.js    # Pinia: estado de sesión, loading, error
└── router/
    └── index.js   # guards requiresAuth / guestOnly
```

## Notas de integración con Laravel

- El flujo asume **Sanctum SPA (cookie-based)**: `GET /sanctum/csrf-cookie`
  antes de `POST /login`. Si el backend usa tokens Bearer clásicos, basta
  con quitar esa llamada en `authService.js`; el interceptor de `api.js`
  ya adjunta el token guardado en `localStorage`.
- El backend Laravel debe tener `SANCTUM_STATEFUL_DOMAINS` y `SESSION_DOMAIN`
  configurados para el dominio del frontend, y CORS con `supports_credentials: true`.

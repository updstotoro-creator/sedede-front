# Módulo Core (Frontend) — Roles, Permisos y Visibilidad de Vistas

- **Prefijo de IDs:** `RF-FRONT-CORE-001` … `RF-FRONT-CORE-008`
- **Rutas asociadas:** `/dashboard/*` (`router/index.js`)
- **Estado:** Especificado — alineado a la matriz RBAC institucional.

---

## 1. Alcance

Define las reglas de presentación, visibilidad condicional de elementos del Sidebar (`AppSidebar.vue`), guardas de enrutamiento y restricciones de acción en formularios según el rol del usuario autenticado (`authStore.user.role`).

---

## 2. Visibilidad de Vistas y Elementos de Navegación

| Ruta | Nombre de Vista | `admin` | `sedede` | `asociacion` | `club` | `deportista` |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `/dashboard` | Resumen General | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/users` | Gestión de Usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/dashboard/roles` | Gestión de Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/dashboard/asociaciones` | Padrón de Asociaciones | ✅ | ✅ *(Supervisión)* | ✅ *(Ficha propia)* | 👁️ *(Informativo)* | 👁️ *(Informativo)* |
| `/dashboard/deportistas` | Padrón RUN | ✅ | ✅ *(Auditoría)* | ✅ *(Su disciplina)*| ✅ *(Sus atletas)* | ✅ *(Perfil propio)* |
| `/dashboard/tramites` | Trámites y Apoyos | ✅ | ✅ *(Evaluador)* | ✅ *(Acreditador)* | ✅ *(Seguimiento)* | ✅ *(Solicitante)* |
| `/dashboard/escenarios` | Escenarios Deportivos | ✅ | ✅ *(Programador)*| ✅ *(Solicitante)* | ✅ *(Solicitante)* | 👁️ *(Cartelera)* |
| `/dashboard/tarifario` | Tarifario & Ingresos | ✅ | ✅ *(Cajero/Admin)*| 👁️ *(Consulta)* | 👁️ *(Consulta)* | ❌ |

---

## 3. Requerimientos de Interfaz

1. **Sidebar Reactivo (`RF-FRONT-CORE-001`):** Los enlaces del sidebar deben filtrarse dinámicamente según los permisos del usuario para no mostrar opciones inaccesibles.
2. **Botones de Mutación Condicionales (`RF-FRONT-CORE-002`):** Los botones "Crear Deportista", "Editar Asociación", etc., no deben renderizarse si el usuario no tiene potestad sobre el registro.
3. **Guardas de Navegación (`RF-FRONT-CORE-003`):** El `router.beforeEach` debe redirigir a `/dashboard` si un usuario intenta forzar la URL hacia una vista para la cual su rol no tiene acceso.

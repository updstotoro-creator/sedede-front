import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        name: 'dashboard-users',
        component: () => import('../views/UsersView.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'roles',
        name: 'dashboard-roles',
        component: () => import('../views/RolesView.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'asociaciones',
        name: 'dashboard-asociaciones',
        component: () => import('../views/AsociacionesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club'] },
      },
      {
        path: 'asociaciones/:asociacionId',
        name: 'dashboard-asociacion-detalle',
        component: () => import('../views/AsociacionDetailView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club'] },
      },
      {
        path: 'clubes',
        name: 'dashboard-clubes',
        component: () => import('../views/ClubesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club'] },
      },
      {
        path: 'asociaciones/:asociacionId/clubes/:clubId',
        name: 'dashboard-club-detalle',
        component: () => import('../views/ClubDetailView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club'] },
      },
      {
        path: 'deportistas',
        name: 'dashboard-deportistas',
        component: () => import('../views/DeportistasView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club', 'entrenador', 'deportista'] },
      },
      {
        path: 'escenarios',
        name: 'dashboard-escenarios',
        component: () => import('../views/EscenariosView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_eventos', 'coordinador_asociacion', 'asociacion', 'entrenador', 'invitado'] },
      },
      {
        path: 'tramites',
        name: 'dashboard-tramites',
        component: () => import('../views/TramitesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_asociacion', 'asociacion', 'club', 'deportista'] },
      },
      {
        path: 'tarifario',
        name: 'dashboard-tarifario',
        component: () => import('../views/TarifarioView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_eventos', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'calendario-anual',
        name: 'dashboard-calendario-anual',
        component: () => import('../views/CalendarioAnualView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_eventos', 'coordinador_asociacion', 'asociacion', 'deportista', 'invitado'] },
      },
      {
        path: 'comunidades',
        name: 'dashboard-comunidades',
        component: () => import('../views/MancomunidadesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'comunidades', 'representante_mancomunidad'] },
      },
      // Inventario
      {
        path: 'inventario/tipos-item',
        name: 'dashboard-inventario-tipos-item',
        component: () => import('../views/TiposItemView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      {
        path: 'inventario/almacenes',
        name: 'dashboard-inventario-almacenes',
        component: () => import('../views/AlmacenesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      {
        path: 'inventario/lotes',
        name: 'dashboard-inventario-lotes',
        component: () => import('../views/LotesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      {
        path: 'inventario/lotes/nuevo',
        name: 'dashboard-inventario-lotes-nuevo',
        component: () => import('../views/LoteNuevoView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      {
        path: 'inventario/movimientos',
        name: 'dashboard-inventario-movimientos',
        component: () => import('../views/MovimientosView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      {
        path: 'inventario/existencias',
        name: 'dashboard-inventario-existencias',
        component: () => import('../views/ExistenciasView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'encargado_inventarios'] },
      },
      // POA
      {
        path: 'poa',
        name: 'dashboard-poa',
        component: () => import('../views/PoaView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'poa/dashboard',
        name: 'dashboard-poa-dashboard',
        component: () => import('../views/PoaDashboard.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'poa/planes',
        name: 'dashboard-poa-planes',
        component: () => import('../views/PoaPlanesView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'poa/actividad/:id',
        name: 'dashboard-poa-actividad',
        component: () => import('../views/PoaActividadDetail.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'poa/techos',
        name: 'dashboard-poa-techos',
        component: () => import('../views/PoaTechosView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      {
        path: 'poa/bitacora',
        name: 'dashboard-poa-bitacora',
        component: () => import('../views/PoaBitacoraView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'coordinador_poa', 'encargado_contable'] },
      },
      // Formación deportiva
      {
        path: 'formacion/inscripciones',
        name: 'dashboard-formacion-inscripciones',
        component: () => import('../views/InscripcionEscuelasView.vue'),
        meta: { roles: ['admin', 'sedede', 'personal_sedede', 'entrenador', 'coordinador_asociacion', 'asociacion', 'club'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

function getHomeRouteForRole(role) {
  switch (role) {
    case 'comunidades':
    case 'representante_mancomunidad':
      return 'dashboard-comunidades'
    case 'encargado_inventarios':
      return 'dashboard-inventario-almacenes'
    case 'coordinador_poa':
    case 'encargado_contable':
      return 'dashboard-poa-dashboard'
    case 'coordinador_eventos':
      return 'dashboard-escenarios'
    case 'asociacion':
    case 'coordinador_asociacion':
      return 'dashboard-asociaciones'
    case 'club':
      return 'dashboard-clubes'
    case 'entrenador':
      return 'dashboard-formacion-inscripciones'
    default:
      return 'dashboard'
  }
}

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (guestOnly && auth.isAuthenticated) {
    const role = auth.user?.role?.nombre
    return { name: getHomeRouteForRole(role) }
  }

  // Restricciones basadas en roles por ruta
  if (auth.isAuthenticated) {
    const role = auth.user?.role?.nombre

    // Rol comunidades: aislamiento absoluto a su módulo
    if (role === 'comunidades' || role === 'representante_mancomunidad') {
      if (to.name !== 'dashboard-comunidades' && to.path !== '/dashboard/comunidades') {
        return { name: 'dashboard-comunidades' }
      }
    }

    // Validación de roles permitidos
    const allowedRoles = to.meta?.roles
    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (role !== 'admin' && !allowedRoles.includes(role)) {
        return { name: getHomeRouteForRole(role) }
      }
    }
  }

  return true
})

export default router

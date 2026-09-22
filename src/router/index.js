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
      },
      {
        path: 'roles',
        name: 'dashboard-roles',
        component: () => import('../views/RolesView.vue'),
      },
      {
        path: 'asociaciones',
        name: 'dashboard-asociaciones',
        component: () => import('../views/AsociacionesView.vue'),
      },
      {
        path: 'asociaciones/:asociacionId',
        name: 'dashboard-asociacion-detalle',
        component: () => import('../views/AsociacionDetailView.vue'),
      },
      {
        path: 'asociaciones/:asociacionId/clubes/:clubId',
        name: 'dashboard-club-detalle',
        component: () => import('../views/ClubDetailView.vue'),
      },
      {
        path: 'deportistas',
        name: 'dashboard-deportistas',
        component: () => import('../views/DeportistasView.vue'),
      },
      {
        path: 'escenarios',
        name: 'dashboard-escenarios',
        component: () => import('../views/EscenariosView.vue'),
      },
      {
        path: 'tramites',
        name: 'dashboard-tramites',
        component: () => import('../views/TramitesView.vue'),
      },
      {
        path: 'tarifario',
        name: 'dashboard-tarifario',
        component: () => import('../views/TarifarioView.vue'),
      },
      {
        path: 'calendario-anual',
        name: 'dashboard-calendario-anual',
        component: () => import('../views/CalendarioAnualView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

export default router

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
        path: 'inventario/tipos-item',
        name: 'dashboard-inventario-tipos-item',
        component: () => import('../views/TiposItemView.vue'),
      },
      {
        path: 'inventario/almacenes',
        name: 'dashboard-inventario-almacenes',
        component: () => import('../views/AlmacenesView.vue'),
      },
      {
        path: 'poa',
        name: 'dashboard-poa',
        component: () => import('../views/PoaView.vue'),
      },
      {
        path: 'poa/dashboard',
        name: 'dashboard-poa-dashboard',
        component: () => import('../views/PoaDashboard.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
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


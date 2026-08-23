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
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global: bloquea /dashboard y todas sus subrutas (users, roles, etc.)
// sin sesión, y evita que un usuario ya autenticado vuelva a ver el login.
// `to.matched` incluye la ruta padre, así que basta con requiresAuth en
// /dashboard para que se herede a /dashboard/users y /dashboard/roles.
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

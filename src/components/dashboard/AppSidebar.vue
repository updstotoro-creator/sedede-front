<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/images/logo-sedede.png'

const auth = useAuthStore()

const props = defineProps({
  filter: { type: String, default: '' },
})

const icons = {
  grid: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  buildingLibrary: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A4.814 4.814 0 0012 9.75c-2.552 0-5.056.4-7 1.242V21M3 21h18M12 6.75h.008v.008H12V6.75z',
  creditCard: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  chartBar: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
  list: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  banknotes: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
  book: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  cube: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  tag: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z',
  clipboard: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
  archiveBox: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  arrows: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
}

const groups = computed(() => {
  const role = auth.user?.role?.nombre
  if (role === 'deportista') {
    return [
      {
        id: 'resumen-deportista',
        label: 'Mi Panel',
        links: [
          { to: '/dashboard', label: 'Mi Panel & Perfil', exact: true, icon: 'user' },
        ],
      },
      {
        id: 'tramites-deportista',
        label: 'Mis Trámites y Eventos',
        links: [
          { to: '/dashboard/tramites', label: 'Mis Solicitudes y Apoyos', icon: 'document' },
          { to: '/dashboard/calendario-anual', label: 'Eventos del Calendario', icon: 'calendar' },
        ],
      },
    ]
  }

  if (role === 'representante_mancomunidad' || role === 'comunidades') {
    return [
      {
        id: 'gestion-comunidades',
        label: 'Mi Registro',
        links: [
          { to: '/dashboard/comunidades', label: 'Mi Registro & Solicitudes', exact: true, icon: 'home' },
        ],
      },
    ]
  }

  return [
    {
      id: 'resumen',
      label: 'Panel de Control',
      links: [
        { to: '/dashboard', label: 'Resumen Principal', exact: true, icon: 'grid' },
        { to: '/dashboard/users', label: 'Usuarios', icon: 'users' },
        { to: '/dashboard/roles', label: 'Roles y Permisos', icon: 'shield' },
      ],
    },
    {
      id: 'gestion-deportiva',
      label: 'Gestión Deportiva',
      links: [
        { to: '/dashboard/asociaciones', label: 'Asociaciones', icon: 'users' },
        { to: '/dashboard/clubes', label: 'Clubes', icon: 'buildingLibrary' },
        { to: '/dashboard/calendario-anual', label: 'Calendario Anual', icon: 'calendar' },
      ],
    },
    {
      id: 'deportistas-tramites',
      label: 'Deportistas y Trámites',
      links: [
        { to: '/dashboard/deportistas', label: 'Deportistas', icon: 'user' },
        { to: '/dashboard/tramites', label: 'Trámites de Apoyo', icon: 'document' },
      ],
    },
    {
      id: 'mancomunidades-rural',
      label: 'Mancomunidades',
      links: [
        { to: '/dashboard/comunidades', label: 'Mancomunidades Rurales', icon: 'home' },
      ],
    },
    {
      id: 'escenarios-tarifario',
      label: 'Infraestructura y Tarifas',
      links: [
        { to: '/dashboard/escenarios', label: 'Escenarios Deportivos', icon: 'building' },
        { to: '/dashboard/tarifario', label: 'Tarifario Departamental', icon: 'creditCard' },
      ],
    },
    {
      id: 'poa-gestion',
      label: 'Planificación (POA)',
      links: [
        { to: '/dashboard/poa/dashboard', label: 'Dashboard POA', icon: 'chartBar' },
        { to: '/dashboard/poa/planes', label: 'Planes POA', icon: 'folder' },
        { to: '/dashboard/poa', label: 'Estructura POA', icon: 'list' },
        { to: '/dashboard/poa/techos', label: 'Techos Presupuestarios', icon: 'banknotes' },
        { to: '/dashboard/poa/bitacora', label: 'Bitácora POA', icon: 'book' },
      ],
    },
    {
      id: 'inventario-almacenes',
      label: 'Logística y Materiales',
      links: [
        { to: '/dashboard/inventario/almacenes', label: 'Almacenes', icon: 'cube' },
        { to: '/dashboard/inventario/tipos-item', label: 'Familias de Ítems', icon: 'tag' },
        { to: '/dashboard/inventario/existencias', label: 'Existencias', icon: 'clipboard' },
        { to: '/dashboard/inventario/lotes', label: 'Lotes de Inventario', icon: 'archiveBox' },
        { to: '/dashboard/inventario/movimientos', label: 'Movimientos (Kardex)', icon: 'arrows' },
      ],
    },
  ]
})

const filteredGroups = computed(() => {
  const q = props.filter.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value
    .map((g) => ({ ...g, links: g.links.filter((l) => l.label.toLowerCase().includes(q)) }))
    .filter((g) => g.links.length > 0)
})

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
</script>

<template>
  <aside class="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm select-none">
    <!-- Header del Sidebar con Marca Institucional -->
    <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
      <img :src="logo" alt="Logo SEDEDE" class="h-11 w-11 object-contain" />
      <div class="leading-tight">
        <p class="font-display text-base font-extrabold uppercase tracking-tight text-brand-800">SEDEDE</p>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Chuquisaca · Gestión</p>
      </div>
    </div>

    <!-- Navegación por Módulos (Scrollable) -->
    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      <div v-for="group in filteredGroups" :key="group.id">
        <span class="mb-2 block px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ group.label }}</span>
        <ul class="space-y-1">
          <li v-for="link in group.links" :key="link.to">
            <router-link
              :to="link.to"
              custom
              v-slot="{ href, navigate, isActive, isExactActive }"
            >
              <a
                :href="href"
                class="group flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-semibold transition-all"
                :class="(link.exact ? isExactActive : isActive)
                  ? 'border-brand-800 bg-brand-50 text-brand-800 shadow-sm'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-brand-800'"
                @click="navigate"
              >
                <svg
                  class="h-5 w-5 shrink-0"
                  :class="(link.exact ? isExactActive : isActive) ? 'text-brand-700' : 'text-slate-400 group-hover:text-brand-700'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="icons[link.icon]" />
                </svg>
                <span>{{ link.label }}</span>
              </a>
            </router-link>
          </li>
        </ul>
      </div>
      <p v-if="filteredGroups.length === 0" class="px-3 text-xs text-slate-400">
        Sin resultados para “{{ filter }}”
      </p>
    </nav>

    <!-- Footer del Sidebar: Perfil de Usuario Activo -->
    <div class="border-t border-slate-200 bg-slate-50/70 p-4">
      <div class="mb-3 flex items-center gap-3">
        <div class="relative">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white shadow-sm ring-2 ring-white">
            {{ initials(auth.user?.name) }}
          </div>
          <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="En línea"></span>
        </div>
        <div class="min-w-0 leading-tight">
          <p class="truncate text-xs font-bold text-slate-900">{{ auth.user?.name }}</p>
          <p class="truncate text-[11px] text-slate-500">{{ auth.user?.email ?? auth.user?.role?.nombre }}</p>
        </div>
      </div>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
        @click="auth.logout()"
      >
        <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="icons.logout" />
        </svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

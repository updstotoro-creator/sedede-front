# Toggle de Alertas del Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permite que cada usuario muestre u oculte el Centro de Alertas del dashboard ejecutivo con una preferencia persistida; al apagarlo, el backend deja de calcular alertas.

**Architecture:** Se agrega `users.alertas_habilitadas` (boolean, default `true`) y un endpoint `PATCH /core/me/alertas`. El dashboard ejecutivo lee esa preferencia: si es falsa, omite la construcción de alertas y devuelve listas vacías junto con `alertas_habilitadas`. El frontend agrega el Centro de Alertas con un switch accesible y sincroniza el estado con la respuesta del dashboard.

**Tech Stack:** Laravel 11 + Sanctum + PHPUnit (backend), Vue 3 + Pinia + Tailwind CSS + Vite (frontend), MySQL 8 para pruebas.

## Global Constraints

- No ejecutar `git add` ni `git commit` sin autorización explícita del usuario.
- Backend en `C:\xampp\htdocs\backend-SEDEDE`; frontend en `C:\xampp\htdocs\sedede-front`.
- Las pruebas backend requieren la base `sedede_testing` creada y vacía (ver `phpunit.xml`).
- No modificar la lógica de KPIs ni módulos fuera del alcance del spec.
- Mantener el estilo existente: PHP con tipo de retorno y comentarios en español; Vue sin punto y coma al final de línea en `DashboardView.vue`.
- Un único switch global; sin switches por nivel, módulo o tipo.

---

### Task 1: Persistencia y endpoint de preferencia

**Files:**
- Create: `C:\xampp\htdocs\backend-SEDEDE\database\migrations\2026_10_19_000000_add_alertas_habilitadas_to_users_table.php`
- Modify: `C:\xampp\htdocs\backend-SEDEDE\app\Models\User.php:19-44`
- Modify: `C:\xampp\htdocs\backend-SEDEDE\routes\api\core.php:27`
- Modify: `C:\xampp\htdocs\backend-SEDEDE\app\Http\Controllers\Api\Core\AuthController.php:88-95`
- Create: `C:\xampp\htdocs\backend-SEDEDE\tests\Feature\Core\AlertasPreferenciaTest.php`

**Interfaces:**
- Consumes: `User` de `App\Models\User`, autenticación Sanctum.
- Produces: columna `users.alertas_habilitadas` (boolean, default `true`) y `PATCH /api/v1/core/me/alertas` con body `{ "alertas_habilitadas": boolean }`, que responde `{ "data": User }`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/Feature/Core/AlertasPreferenciaTest.php`:

```php
<?php

namespace Tests\Feature\Core;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertasPreferenciaTest extends TestCase
{
    use RefreshDatabase;

    private const PREFERENCIA_URL = '/api/v1/core/me/alertas';

    private function usuario(array $permisos = []): User
    {
        $rol = Role::create([
            'nombre' => 'rol_'.uniqid(),
            'descripcion' => 'rol de prueba',
            'permisos' => json_encode($permisos),
            'activo' => true,
        ]);

        return User::factory()->create(['role_id' => $rol->id]);
    }

    public function test_usuario_nuevo_tiene_alertas_habilitadas_por_defecto(): void
    {
        $usuario = $this->usuario();

        $this->assertTrue($usuario->fresh()->alertas_habilitadas);
    }

    public function test_actualiza_la_preferencia_y_la_persiste(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)
            ->patchJson(self::PREFERENCIA_URL, ['alertas_habilitadas' => false])
            ->assertOk()
            ->assertJsonPath('data.alertas_habilitadas', false);

        $this->assertFalse($usuario->fresh()->alertas_habilitadas);
    }

    public function test_rechaza_valores_no_booleanos(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)
            ->patchJson(self::PREFERENCIA_URL, ['alertas_habilitadas' => 'tal vez'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('alertas_habilitadas');
    }

    public function test_requiere_autenticacion(): void
    {
        $this->patchJson(self::PREFERENCIA_URL, ['alertas_habilitadas' => false])
            ->assertUnauthorized();
    }
}
```

- [ ] **Step 2: Ejecutar las pruebas para verificar que fallan**

Run (desde `C:\xampp\htdocs\backend-SEDEDE`):

```bash
php artisan test --filter=AlertasPreferenciaTest
```

Expected: FAIL. Las pruebas fallan porque `users.alertas_habilitadas` no existe y porque `PATCH /api/v1/core/me/alertas` todavía devuelve 404.

- [ ] **Step 3: Crear la migración**

Crear `database/migrations/2026_10_19_000000_add_alertas_habilitadas_to_users_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('alertas_habilitadas')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('alertas_habilitadas');
        });
    }
};
```

- [ ] **Step 4: Actualizar el modelo User**

En `app/Models/User.php`, agregar la columna al `$fillable` (después de `'activo'`) y el cast booleano:

```php
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'mancomunidad_id',
        'activo',
        'alertas_habilitadas',
        'email_verified_at',
        'fecha_ultimo_login',
        'created_by',
    ];
```

```php
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
            'alertas_habilitadas' => 'boolean',
            'fecha_ultimo_login' => 'datetime',
        ];
    }
```

- [ ] **Step 5: Registrar la ruta**

En `routes/api/core.php`, dentro del grupo `auth:sanctum`, agregar después de `Route::get('/me', ...)`:

```php
        Route::patch('/me/alertas', [AuthController::class, 'updateAlertasPreference']);
```

- [ ] **Step 6: Implementar la acción del controlador**

En `app/Http/Controllers/Api/Core/AuthController.php`, agregar después de `me()`:

```php
    public function updateAlertasPreference(Request $request)
    {
        $validated = $request->validate([
            'alertas_habilitadas' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->update(['alertas_habilitadas' => $validated['alertas_habilitadas']]);
        $user->load(['role', 'deportista.asociacion', 'deportista.club']);

        return response()->json(['data' => $user]);
    }
```

- [ ] **Step 7: Ejecutar las pruebas nuevas**

```bash
php artisan test --filter=AlertasPreferenciaTest
```

Expected: PASS (4 tests).

- [ ] **Step 8: Ejecutar los tests existentes del módulo Core**

```bash
php artisan test tests/Feature/Core
```

Expected: PASS. No debe romperse `AlertasOperativasTest`.

- [ ] **Step 9: Ejecutar la migración en desarrollo**

```bash
php artisan migrate
```

Expected: la migración `2026_10_19_000000_add_alertas_habilitadas_to_users_table` se aplica sin errores.

---

### Task 2: El dashboard respeta la preferencia

**Files:**
- Modify: `C:\xampp\htdocs\backend-SEDEDE\app\Http\Controllers\Api\Core\ExecutiveDashboardController.php:54-163`
- Modify: `C:\xampp\htdocs\backend-SEDEDE\tests\Feature\Core\AlertasPreferenciaTest.php`

**Interfaces:**
- Consumes: `users.alertas_habilitadas` y `AlertasOperativasService`.
- Produces: en `GET /api/v1/core/dashboard/executive`, el campo `alertas_habilitadas`; con preferencia falsa, `alertas: []`, `alertas_total: 0` y `alertas_por_nivel` en cero.

- [ ] **Step 1: Agregar las pruebas que fallan**

Añadir al final de `AlertasPreferenciaTest.php`, antes del cierre de la clase:

```php
    public function test_dashboard_omite_alertas_cuando_esta_deshabilitada(): void
    {
        $usuario = $this->usuario(['escenarios.ver', 'asociaciones.ver_aportes']);
        $usuario->update(['alertas_habilitadas' => false]);

        ReservaEscenario::create([
            'codigo_reserva' => 'RES-PREF-1',
            'escenario_nombre' => 'Estadio Patria',
            'espacio' => 'Cancha auxiliar',
            'solicitante_nombre' => 'Club Prueba',
            'fecha_uso' => Carbon::tomorrow()->toDateString(),
            'estado' => 'PENDIENTE',
        ]);

        $this->actingAs($usuario)
            ->getJson('/api/v1/core/dashboard/executive')
            ->assertOk()
            ->assertJsonPath('alertas', [])
            ->assertJsonPath('alertas_total', 0)
            ->assertJsonPath('alertas_habilitadas', false)
            ->assertJsonPath('alertas_por_nivel', [
                'urgente' => 0,
                'advertencia' => 0,
                'info' => 0,
            ]);
    }

    public function test_dashboard_devuelve_el_flag_cuando_esta_habilitada(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)
            ->getJson('/api/v1/core/dashboard/executive')
            ->assertOk()
            ->assertJsonPath('alertas_habilitadas', true);
    }
```

Agregar los imports al inicio de `AlertasPreferenciaTest.php`:

```php
use App\Models\Escenarios\ReservaEscenario;
use Illuminate\Support\Carbon;
```

- [ ] **Step 2: Ejecutar las pruebas para verificar que fallan**

```bash
php artisan test --filter=AlertasPreferenciaTest
```

Expected: FAIL. El dashboard todavía no devuelve `alertas_habilitadas` y sigue calculando alertas con la preferencia apagada.

- [ ] **Step 3: Extraer la construcción de alertas y condicionarla**

En `app/Http/Controllers/Api/Core/ExecutiveDashboardController.php`, reemplazar el bloque que va desde el comentario `// 4. Centro de Alertas en Tiempo Real` hasta la línea `$alertas = $alertasOperativas->ordenar($alertas);` por:

```php
        // 4. Centro de Alertas en Tiempo Real
        $alertasHabilitadas = (bool) ($request->user()?->alertas_habilitadas ?? true);
        $alertas = $alertasHabilitadas ? $this->construirAlertas($request, $alertasOperativas) : [];
```

Agregar el método privado antes del cierre de la clase:

```php
    /**
     * @return array<int, array<string, mixed>>
     */
    private function construirAlertas(Request $request, AlertasOperativasService $alertasOperativas): array
    {
        $alertas = [];

        // Alertas de Trámites próximos a fecha de evento (< 15 días)
        $tramitesProximos = Tramite::where('activo', true)
            ->whereNotNull('fecha_evento')
            ->whereDate('fecha_evento', '>=', Carbon::now())
            ->whereDate('fecha_evento', '<=', Carbon::now()->addDays(15))
            ->get();

        foreach ($tramitesProximos as $tp) {
            $dias = Carbon::now()->diffInDays(Carbon::parse($tp->fecha_evento), false);
            $alertas[] = [
                'id' => 'tramite-plazo-' . $tp->id,
                'tipo' => 'PLAZO',
                'nivel' => 'urgente',
                'titulo' => 'Alerta de Plazo (15 Días): ' . $tp->codigo_tramite,
                'mensaje' => 'Evento "' . $tp->evento_nombre . '" inicia en ' . $dias . ' días. Requiere priorización.',
                'fecha' => $tp->created_at->toDateTimeString(),
            ];
        }

        // Alertas de Trámites Observados sin subsanar
        $obsTramites = Tramite::where('estado', 'like', '%Observada%')->get();
        foreach ($obsTramites as $ot) {
            $alertas[] = [
                'id' => 'tramite-obs-' . $ot->id,
                'tipo' => 'OBSERVACION',
                'nivel' => 'advertencia',
                'titulo' => 'Solicitud Observada: ' . $ot->codigo_tramite,
                'mensaje' => 'Pendiente de subsanación por el solicitante (' . $ot->evento_nombre . ').',
                'fecha' => $ot->updated_at->toDateTimeString(),
            ];
        }

        // Alertas Financieras (Nuevos Recibos Pagados Recientemente)
        $recibosRecientes = ReciboIngreso::latest()->take(3)->get();
        foreach ($recibosRecientes as $rr) {
            $alertas[] = [
                'id' => 'recibo-pago-' . $rr->id,
                'tipo' => 'FINANCIERO',
                'nivel' => 'info',
                'titulo' => 'Recibo Emitido: ' . $rr->numero,
                'mensaje' => 'Cobro de Bs ' . number_format($rr->monto_bs, 2) . ' registrado vía ' . $rr->forma_cobro . '.',
                'fecha' => $rr->created_at->toDateTimeString(),
            ];
        }

        // Alertas de Eventos del Calendario Anual esta semana
        $eventosSemana = EventoCalendarioAnual::where('activo', true)
            ->whereDate('fecha_inicio', '>=', Carbon::now()->startOfWeek())
            ->whereDate('fecha_inicio', '<=', Carbon::now()->endOfWeek())
            ->get();

        foreach ($eventosSemana as $es) {
            $alertas[] = [
                'id' => 'calendario-evento-' . $es->id,
                'tipo' => 'CALENDARIO',
                'nivel' => 'info',
                'titulo' => 'Competencia Oficial esta Semana',
                'mensaje' => $es->nombre_evento . ' (' . $es->disciplina . ') programado en el recinto.',
                'fecha' => $es->fecha_inicio->toDateTimeString(),
            ];
        }

        // Alertas operativas de Reservas de escenarios y Aportes (tarea #175).
        // Cada grupo solo lo ve quien tiene el permiso que ya protege ese mismo dato
        // en su módulo: aportes -> asociaciones.ver_aportes, reservas -> escenarios.ver.
        $rolUsuario = $request->user()?->role;
        if ($rolUsuario?->hasPermission('escenarios.ver')) {
            $alertas = array_merge($alertas, $alertasOperativas->reservas());
        }
        if ($rolUsuario?->hasPermission('asociaciones.ver_aportes')) {
            $alertas = array_merge($alertas, $alertasOperativas->aportes());
        }

        return $alertasOperativas->ordenar($alertas);
    }
```

- [ ] **Step 4: Agregar el flag a la respuesta**

En el `return response()->json([...])` del mismo controlador, agregar el campo después de `alertas_por_nivel`:

```php
            'alertas' => array_slice($alertas, 0, 8),
            'alertas_total' => count($alertas),
            'alertas_por_nivel' => $alertasOperativas->contarPorNivel($alertas),
            'alertas_habilitadas' => $alertasHabilitadas,
```

- [ ] **Step 5: Ejecutar las pruebas**

```bash
php artisan test --filter=AlertasPreferenciaTest
```

Expected: PASS (6 tests).

- [ ] **Step 6: Ejecutar toda la suite de Core**

```bash
php artisan test tests/Feature/Core
```

Expected: PASS. Los tests de `AlertasOperativasTest` deben seguir verdes porque la preferencia por defecto es `true`.

---

### Task 3: Servicio y store de autenticación en el frontend

**Files:**
- Modify: `C:\xampp\htdocs\sedede-front\src\services\authService.js:7-30`
- Modify: `C:\xampp\htdocs\sedede-front\src\stores\auth.js:16-55`

**Interfaces:**
- Consumes: `PATCH /api/v1/core/me/alertas`.
- Produces:
  - `authService.actualizarPreferenciaAlertas(alertasHabilitadas: boolean): Promise<User>`
  - `auth.actualizarAlertas(habilitadas: boolean): Promise<User>`

- [ ] **Step 1: Agregar el método al servicio**

En `src/services/authService.js`, agregar dentro de `authService`, después de `me()`:

```js
  async actualizarPreferenciaAlertas(alertasHabilitadas) {
    const { data } = await api.patch('/core/me/alertas', {
      alertas_habilitadas: alertasHabilitadas,
    })
    return data?.data ?? data
  },
```

El objeto queda así:

```js
export const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/core/login', { email, password })

    if (data?.token) {
      localStorage.setItem('sedede_token', data.token)
    }

    return data?.data ?? data?.user ?? data
  },

  async logout() {
    try {
      await api.post('/core/logout')
    } finally {
      localStorage.removeItem('sedede_token')
    }
  },

  async me() {
    const { data } = await api.get('/core/me')
    return data?.data ?? data
  },

  async actualizarPreferenciaAlertas(alertasHabilitadas) {
    const { data } = await api.patch('/core/me/alertas', {
      alertas_habilitadas: alertasHabilitadas,
    })
    return data?.data ?? data
  },
}
```

- [ ] **Step 2: Agregar la acción al store**

En `src/stores/auth.js`, agregar dentro de `actions`, después de `logout()`:

```js
    async actualizarAlertas(habilitadas) {
      const user = await authService.actualizarPreferenciaAlertas(habilitadas)
      this.user = { ...this.user, ...user }
      return this.user
    },
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run (desde `C:\xampp\htdocs\sedede-front`):

```bash
npm run build
```

Expected: `✓ built in ...` sin errores.

---

### Task 4: Centro de Alertas y switch en el dashboard

**Files:**
- Modify: `C:\xampp\htdocs\sedede-front\src\views\DashboardView.vue:45-260` (estado y funciones)
- Modify: `C:\xampp\htdocs\sedede-front\src\views\DashboardView.vue:843-845` (inserción del template)

**Interfaces:**
- Consumes: `auth.actualizarAlertas()`, `metrics.alertas`, `metrics.alertas_total`, `metrics.alertas_por_nivel`, `metrics.alertas_habilitadas`.
- Produces: sección visual "Centro de Alertas" con switch accesible y estados habilitado/deshabilitado.

- [ ] **Step 1: Agregar estado y computadas**

En `src/views/DashboardView.vue`, después de `const metrics = ref(null)`:

```js
const alertasHabilitadas = ref(true)
const alertasGuardando = ref(false)
const alertasError = ref('')

const alertas = computed(() => metrics.value?.alertas ?? [])
const alertasTotal = computed(() => metrics.value?.alertas_total ?? 0)
const alertasPorNivel = computed(() => ({
  urgente: metrics.value?.alertas_por_nivel?.urgente ?? 0,
  advertencia: metrics.value?.alertas_por_nivel?.advertencia ?? 0,
  info: metrics.value?.alertas_por_nivel?.info ?? 0,
}))
```

- [ ] **Step 2: Sincronizar el estado al cargar métricas**

En `fetchMetrics()`, después de `metrics.value = res`, agregar:

```js
    alertasHabilitadas.value = res.alertas_habilitadas ?? true
```

El bloque queda así:

```js
    const res = await dashboardService.getExecutiveMetrics(params)
    metrics.value = res
    alertasHabilitadas.value = res.alertas_habilitadas ?? true
```

- [ ] **Step 3: Agregar helpers y la acción del switch**

Después de `formatMoney()` (línea ~250), agregar:

```js
const ALERTA_ESTILOS = {
  urgente: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
  advertencia: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    card: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
}

function estiloAlerta(nivel) {
  return ALERTA_ESTILOS[nivel] ?? ALERTA_ESTILOS.info
}

function formatFechaAlerta(fecha) {
  if (!fecha) return ''
  const valor = new Date(String(fecha).replace(' ', 'T'))
  if (Number.isNaN(valor.getTime())) return ''
  return valor.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function toggleAlertas() {
  if (alertasGuardando.value) return

  const nuevoValor = !alertasHabilitadas.value
  alertasGuardando.value = true
  alertasError.value = ''

  try {
    const usuario = await auth.actualizarAlertas(nuevoValor)
    alertasHabilitadas.value = usuario?.alertas_habilitadas ?? nuevoValor
    await fetchMetrics()
  } catch {
    alertasError.value = 'No se pudo guardar la preferencia de alertas. Intenta nuevamente.'
  } finally {
    alertasGuardando.value = false
  }
}
```

- [ ] **Step 4: Insertar la sección en el template**

En la vista ejecutiva, después del cierre del `<section>` del grid de KPIs y antes del comentario `<!-- Accesos Rápidos -->`, insertar:

```html
              <!-- Centro de Alertas -->
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Centro de Alertas</h4>
                      <span
                        v-if="alertasHabilitadas"
                        class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800"
                      >
                        {{ alertasTotal }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ alertasHabilitadas
                        ? 'Situaciones que requieren atención en los módulos del SEDEDE.'
                        : 'Las alertas están ocultas y no se calculan mientras el switch esté apagado.' }}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <span
                      class="text-xs font-semibold"
                      :class="alertasHabilitadas ? 'text-brand-800' : 'text-slate-400'"
                    >
                      {{ alertasHabilitadas ? 'Alertas activas' : 'Alertas desactivadas' }}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="alertasHabilitadas"
                      aria-label="Mostrar alertas del dashboard"
                      :disabled="alertasGuardando"
                      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                      :class="alertasHabilitadas ? 'bg-brand-800' : 'bg-slate-300'"
                      @click="toggleAlertas"
                    >
                      <span
                        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                        :class="alertasHabilitadas ? 'translate-x-5' : 'translate-x-0'"
                      />
                    </button>
                  </div>
                </div>

                <p
                  v-if="alertasError"
                  role="alert"
                  class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  {{ alertasError }}
                </p>

                <div v-if="alertasHabilitadas" class="mt-5">
                  <div class="mb-4 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span class="rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                      {{ alertasPorNivel.urgente }} urgentes
                    </span>
                    <span class="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                      {{ alertasPorNivel.advertencia }} advertencias
                    </span>
                    <span class="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      {{ alertasPorNivel.info }} informativas
                    </span>
                  </div>

                  <div v-if="alertas.length > 0" class="space-y-3">
                    <article
                      v-for="alerta in alertas"
                      :key="alerta.id"
                      class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                      :class="estiloAlerta(alerta.nivel).card"
                    >
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <span
                            class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            :class="estiloAlerta(alerta.nivel).badge"
                          >
                            {{ alerta.nivel }}
                          </span>
                          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {{ alerta.tipo }}
                          </span>
                          <h5 class="text-sm font-bold text-slate-900">{{ alerta.titulo }}</h5>
                        </div>
                        <p class="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                          {{ alerta.mensaje }}
                        </p>
                      </div>
                      <time class="shrink-0 text-[11px] font-semibold text-slate-400">
                        {{ formatFechaAlerta(alerta.fecha) }}
                      </time>
                    </article>

                    <p
                      v-if="alertasTotal > alertas.length"
                      class="text-right text-[11px] font-semibold text-slate-400"
                    >
                      Mostrando {{ alertas.length }} de {{ alertasTotal }}
                    </p>
                  </div>

                  <div
                    v-else
                    class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center"
                  >
                    <p class="text-sm font-semibold text-slate-600">Sin alertas activas</p>
                    <p class="mt-1 text-xs text-slate-400">
                      No hay situaciones pendientes por atender en este momento.
                    </p>
                  </div>
                </div>

                <div
                  v-else
                  class="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center"
                >
                  <p class="text-sm font-semibold text-slate-600">Alertas desactivadas</p>
                  <p class="mt-1 text-xs text-slate-400">
                    Activa el switch para volver a ver y calcular las alertas del dashboard.
                  </p>
                </div>
              </section>
```

- [ ] **Step 5: Verificar que el proyecto compila**

```bash
npm run build
```

Expected: `✓ built in ...` sin errores.

- [ ] **Step 6: Verificación manual**

Con backend y frontend corriendo:

1. Entrar al dashboard ejecutivo con un usuario no deportista.
2. Confirmar que aparece "Centro de Alertas" con el switch activo.
3. Apagar el switch: debe mostrarse "Alertas desactivadas" y la respuesta del dashboard debe traer `alertas_habilitadas: false` y `alertas: []`.
4. Encender el switch: deben volver las alertas.
5. Recargar la página: la preferencia debe conservarse.
6. Probar el switch con teclado (Tab + Enter/Espacio) y verificar que `aria-checked` cambia.

---

## Self-Review

**Cobertura del spec:**

- Columna `users.alertas_habilitadas` → Task 1.
- Endpoint `PATCH /core/me/alertas` con validación y respuesta → Task 1.
- Dashboard omite cálculo y devuelve flag → Task 2.
- Servicio y store frontend → Task 3.
- Centro de Alertas con switch, estados y accesibilidad → Task 4.
- Pruebas backend y build frontend → Tasks 1, 2, 3 y 4.
- Fuera de alcance respetado: no se tocan KPIs, correo ni switches por categoría.

**Chequeo de placeholders:** no hay `TBD`, `TODO`, pasos sin código ni referencias a funciones inexistentes.

**Consistencia de tipos y nombres:**

- `alertas_habilitadas` se usa igual en migración, modelo, endpoint, dashboard, servicio, store y UI.
- `authService.actualizarPreferenciaAlertas` y `auth.actualizarAlertas` coinciden entre Task 3 y Task 4.
- `alertas`, `alertas_total`, `alertas_por_nivel` y `alertas_habilitadas` coinciden con la respuesta del backend.

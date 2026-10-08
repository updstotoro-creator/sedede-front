# Módulo POA - Plan de Implementación

> **Para agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o superpowers:executing-plans para implementar este plan tarea por tarea.

**Objetivo:** Crear el módulo completo de POA (Plan Operativo Anual) con backend Laravel y frontend Vue.

**Arquitectura:** Backend con modelos Eloquent, controladores REST y rutas API. Frontend con service axios, store Pinia y vistas Vue con árbol expandible.

**Tech Stack:** Laravel 11, PHP 8+, MySQL, Vue 3, Pinia, Axios, Tailwind CSS

## Restricciones Globales

- PHP 8.2+, Laravel 11
- Vue 3 Composition API (`<script setup>`)
- Pinia para stores
- Axios para HTTP
- Tailwind CSS para estilos
- Convenciones existentes del proyecto

---

## Archivos a crear/modificar

### Backend
- `app/Models/Poa/Programa.php`
- `app/Models/Poa/Proyecto.php`
- `app/Models/Poa/Plan.php`
- `app/Models/Poa/Actividad.php`
- `app/Models/Poa/Indicador.php`
- `app/Models/Poa/Meta.php`
- `app/Models/Poa/ProgramacionPeriodo.php`
- `app/Models/Poa/TechoPresupuestario.php`
- `app/Http/Controllers/Api/Poa/ProgramaController.php`
- `app/Http/Controllers/Api/Poa/ProyectoController.php`
- `app/Http/Controllers/Api/Poa/PlanController.php`
- `app/Http/Controllers/Api/Poa/ActividadController.php`
- `app/Http/Controllers/Api/Poa/IndicadorController.php`
- `app/Http/Controllers/Api/Poa/MetaController.php`
- `app/Http/Controllers/Api/Poa/DashboardController.php`
- `app/Http/Resources/Poa/ProgramaResource.php`
- `app/Http/Resources/Poa/ProyectoResource.php`
- `app/Http/Resources/Poa/PlanResource.php`
- `app/Http/Resources/Poa/ActividadResource.php`
- `app/Http/Resources/Poa/IndicadorResource.php`
- `app/Http/Resources/Poa/MetaResource.php`
- `routes/api/poa.php`

### Frontend
- `src/services/poaService.js`
- `src/stores/poa.js`
- `src/views/PoaDashboard.vue`
- `src/views/PoaView.vue`
- `src/components/poa/PoaTree.vue`
- `src/components/poa/PoaNode.vue`
- `src/components/poa/PoaModal.vue`
- `src/router/index.js` (modificar)
- `src/components/dashboard/AppSidebar.vue` (modificar)

---

### Tarea 1: Modelos Backend

**Archivos:**
- Crear: `app/Models/Poa/Programa.php`
- Crear: `app/Models/Poa/Proyecto.php`
- Crear: `app/Models/Poa/Plan.php`
- Crear: `app/Models/Poa/Actividad.php`
- Crear: `app/Models/Poa/Indicador.php`
- Crear: `app/Models/Poa/Meta.php`
- Crear: `app/Models/Poa/ProgramacionPeriodo.php`
- Crear: `app/Models/Poa/TechoPresupuestario.php`

- [ ] **Paso 1: Crear modelo Programa**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Programa extends Model
{
    protected $table = 'poa_programas';
    protected $fillable = ['gestion_id', 'codigo', 'denominacion', 'objetivo_ptdi', 'activo'];
    protected $casts = ['activo' => 'boolean'];

    public function proyectos(): HasMany
    {
        return $this->hasMany(Proyecto::class);
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class);
    }
}
```

- [ ] **Paso 2: Crear modelo Proyecto**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proyecto extends Model
{
    protected $table = 'poa_proyectos';
    protected $fillable = ['programa_id', 'codigo', 'denominacion', 'activo'];
    protected $casts = ['activo' => 'boolean'];

    public function programa(): BelongsTo
    {
        return $this->belongsTo(Programa::class);
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class);
    }
}
```

- [ ] **Paso 3: Crear modelo Plan**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $table = 'poa_planes';
    protected $fillable = [
        'gestion_id', 'unidad_ejecutora_id', 'denominacion', 'estado',
        'origen', 'tipo_periodo', 'cantidad_periodos', 'resolucion_aprobacion',
        'fecha_aprobacion', 'usuario_aprobador_id', 'fecha_linea_base', 'fecha_cierre'
    ];
    protected $casts = [
        'fecha_aprobacion' => 'date',
        'fecha_linea_base' => 'datetime',
        'fecha_cierre' => 'date',
        'cantidad_periodos' => 'integer',
    ];
}
```

- [ ] **Paso 4: Crear modelo Actividad**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Actividad extends Model
{
    protected $table = 'poa_actividades';
    protected $fillable = [
        'plan_id', 'programa_id', 'gestion_id', 'proyecto_id', 'codigo',
        'denominacion', 'producto_esperado', 'unidad_organizacional_id', 'estado'
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function programa(): BelongsTo
    {
        return $this->belongsTo(Programa::class);
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function indicadores(): HasMany
    {
        return $this->hasMany(Indicador::class);
    }
}
```

- [ ] **Paso 5: Crear modelo Indicador**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Indicador extends Model
{
    protected $table = 'poa_indicadores';
    protected $fillable = ['actividad_id', 'codigo', 'denominacion', 'unidad_medida', 'tipo', 'formula'];

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class);
    }

    public function metas(): HasMany
    {
        return $this->hasMany(Meta::class);
    }
}
```

- [ ] **Paso 6: Crear modelo Meta**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meta extends Model
{
    protected $table = 'poa_metas';
    protected $fillable = [
        'indicador_id', 'version', 'linea_base', 'meta_anual',
        'motivo', 'reformulacion_id', 'usuario_registro_id'
    ];
    protected $casts = [
        'linea_base' => 'decimal:4',
        'meta_anual' => 'decimal:4',
        'version' => 'integer',
    ];

    public function indicador(): BelongsTo
    {
        return $this->belongsTo(Indicador::class);
    }

    public function programaciones(): HasMany
    {
        return $this->hasMany(ProgramacionPeriodo::class);
    }
}
```

- [ ] **Paso 7: Crear modelo ProgramacionPeriodo**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramacionPeriodo extends Model
{
    protected $table = 'poa_programacion_periodos';
    protected $fillable = ['meta_id', 'numero_periodo', 'meta_periodo'];
    protected $casts = ['meta_periodo' => 'decimal:4', 'numero_periodo' => 'integer'];

    public function meta(): BelongsTo
    {
        return $this->belongsTo(Meta::class);
    }
}
```

- [ ] **Paso 8: Crear modelo TechoPresupuestario**

```php
<?php

namespace App\Models\Poa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TechoPresupuestario extends Model
{
    protected $table = 'poa_techos_presupuestarios';
    protected $fillable = ['actividad_id', 'gestion_id', 'monto_solicitado_bs', 'version', 'motivo'];
    protected $casts = ['monto_solicitado_bs' => 'decimal:2', 'version' => 'integer'];

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class);
    }
}
```

- [ ] **Paso 9: Verificar modelos**

Run: `cd C:\xampp\htdocs\backend-SEDEDE && php artisan tinker --execute="echo count(get_declared_classes());"`

- [ ] **Paso 10: Commit**

```bash
git add app/Models/Poa/
git commit -m "feat(poa): crear modelos Eloquent para el módulo POA"
```

---

### Tarea 2: Resources Backend

**Archivos:**
- Crear: `app/Http/Resources/Poa/ProgramaResource.php`
- Crear: `app/Http/Resources/Poa/ProyectoResource.php`
- Crear: `app/Http/Resources/Poa/PlanResource.php`
- Crear: `app/Http/Resources/Poa/ActividadResource.php`
- Crear: `app/Http/Resources/Poa/IndicadorResource.php`
- Crear: `app/Http/Resources/Poa/MetaResource.php`

- [ ] **Paso 1: Crear ProgramaResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'gestion_id' => $this->gestion_id,
            'codigo' => $this->codigo,
            'denominacion' => $this->denominacion,
            'objetivo_ptdi' => $this->objetivo_ptdi,
            'activo' => $this->activo,
            'proyectos_count' => $this->whenCounted('proyectos'),
            'actividades_count' => $this->whenCounted('actividades'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 2: Crear ProyectoResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProyectoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'programa_id' => $this->programa_id,
            'codigo' => $this->codigo,
            'denominacion' => $this->denominacion,
            'activo' => $this->activo,
            'actividades_count' => $this->whenCounted('actividades'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 3: Crear PlanResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'gestion_id' => $this->gestion_id,
            'unidad_ejecutora_id' => $this->unidad_ejecutora_id,
            'denominacion' => $this->denominacion,
            'estado' => $this->estado,
            'origen' => $this->origen,
            'tipo_periodo' => $this->tipo_periodo,
            'cantidad_periodos' => $this->cantidad_periodos,
            'resolucion_aprobacion' => $this->resolucion_aprobacion,
            'fecha_aprobacion' => $this->fecha_aprobacion,
            'fecha_linea_base' => $this->fecha_linea_base,
            'fecha_cierre' => $this->fecha_cierre,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 4: Crear ActividadResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActividadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan_id' => $this->plan_id,
            'programa_id' => $this->programa_id,
            'gestion_id' => $this->gestion_id,
            'proyecto_id' => $this->proyecto_id,
            'codigo' => $this->codigo,
            'denominacion' => $this->denominacion,
            'producto_esperado' => $this->producto_esperado,
            'unidad_organizacional_id' => $this->unidad_organizacional_id,
            'estado' => $this->estado,
            'indicadores' => IndicadorResource::collection($this->whenLoaded('indicadores')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 5: Crear IndicadorResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IndicadorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actividad_id' => $this->actividad_id,
            'codigo' => $this->codigo,
            'denominacion' => $this->denominacion,
            'unidad_medida' => $this->unidad_medida,
            'tipo' => $this->tipo,
            'formula' => $this->formula,
            'meta_vigente' => new MetaResource($this->whenLoaded('metas')->last()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 6: Crear MetaResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MetaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'indicador_id' => $this->indicador_id,
            'version' => $this->version,
            'linea_base' => $this->linea_base,
            'meta_anual' => $this->meta_anual,
            'motivo' => $this->motivo,
            'usuario_registro_id' => $this->usuario_registro_id,
            'programaciones' => ProgramacionPeriodoResource::collection($this->whenLoaded('programaciones')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 7: Crear ProgramacionPeriodoResource**

```php
<?php

namespace App\Http\Resources\Poa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramacionPeriodoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meta_id' => $this->meta_id,
            'numero_periodo' => $this->numero_periodo,
            'meta_periodo' => $this->meta_periodo,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

- [ ] **Paso 8: Commit**

```bash
git add app/Http/Resources/Poa/
git commit -m "feat(poa): crear resources para respuestas API"
```

---

### Tarea 3: Controladores Backend

**Archivos:**
- Crear: `app/Http/Controllers/Api/Poa/ProgramaController.php`
- Crear: `app/Http/Controllers/Api/Poa/ProyectoController.php`
- Crear: `app/Http/Controllers/Api/Poa/PlanController.php`
- Crear: `app/Http/Controllers/Api/Poa/ActividadController.php`
- Crear: `app/Http/Controllers/Api/Poa/IndicadorController.php`
- Crear: `app/Http/Controllers/Api/Poa/MetaController.php`
- Crear: `app/Http/Controllers/Api/Poa/DashboardController.php`

- [ ] **Paso 1: Crear ProgramaController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\ProgramaResource;
use App\Models\Poa\Programa;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProgramaController extends Controller
{
    public function index(Request $request)
    {
        $programas = Programa::withCount(['proyectos', 'actividades'])
            ->when($request->gestion_id, fn($q, $g) => $q->where('gestion_id', $g))
            ->orderBy('codigo')
            ->paginate(15);

        return ProgramaResource::collection($programas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gestion_id' => 'required|integer',
            'codigo' => 'required|string|max:10',
            'denominacion' => 'required|string|max:240',
            'objetivo_ptdi' => 'nullable|string',
        ]);

        $programa = Programa::create($validated);

        return response()->json(new ProgramaResource($programa), 201);
    }

    public function show(Programa $programa)
    {
        $programa->loadCount(['proyectos', 'actividades']);
        return new ProgramaResource($programa);
    }

    public function update(Request $request, Programa $programa): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|max:10',
            'denominacion' => 'sometimes|string|max:240',
            'objetivo_ptdi' => 'nullable|string',
            'activo' => 'sometimes|boolean',
        ]);

        $programa->update($validated);

        return response()->json(new ProgramaResource($programa));
    }

    public function destroy(Programa $programa): JsonResponse
    {
        $programa->delete();
        return response()->json(['message' => 'Programa eliminado']);
    }
}
```

- [ ] **Paso 2: Crear ProyectoController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\ProyectoResource;
use App\Models\Poa\Proyecto;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProyectoController extends Controller
{
    public function index(Request $request)
    {
        $proyectos = Proyecto::withCount('actividades')
            ->when($request->programa_id, fn($q, $p) => $q->where('programa_id', $p))
            ->orderBy('codigo')
            ->paginate(15);

        return ProyectoResource::collection($proyectos);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'programa_id' => 'required|exists:poa_programas,id',
            'codigo' => 'required|string|max:10',
            'denominacion' => 'required|string|max:240',
        ]);

        $proyecto = Proyecto::create($validated);

        return response()->json(new ProyectoResource($proyecto), 201);
    }

    public function show(Proyecto $proyecto)
    {
        $proyecto->loadCount('actividades');
        return new ProyectoResource($proyecto);
    }

    public function update(Request $request, Proyecto $proyecto): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|max:10',
            'denominacion' => 'sometimes|string|max:240',
            'activo' => 'sometimes|boolean',
        ]);

        $proyecto->update($validated);

        return response()->json(new ProyectoResource($proyecto));
    }

    public function destroy(Proyecto $proyecto): JsonResponse
    {
        $proyecto->delete();
        return response()->json(['message' => 'Proyecto eliminado']);
    }
}
```

- [ ] **Paso 3: Crear PlanController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\PlanResource;
use App\Models\Poa\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $planes = Plan::when($request->gestion_id, fn($q, $g) => $q->where('gestion_id', $g))
            ->when($request->estado, fn($q, $e) => $q->where('estado', $e))
            ->orderByDesc('created_at')
            ->paginate(15);

        return PlanResource::collection($planes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gestion_id' => 'required|integer',
            'unidad_ejecutora_id' => 'required|integer',
            'denominacion' => 'required|string|max:240',
            'tipo_periodo' => 'required|in:mensual,trimestral,semestral',
        ]);

        $cantidadPeriodos = match($validated['tipo_periodo']) {
            'mensual' => 12,
            'trimestral' => 4,
            'semestral' => 2,
        };

        $validated['cantidad_periodos'] = $cantidadPeriodos;
        $validated['estado'] = 'borrador';

        $plan = Plan::create($validated);

        return response()->json(new PlanResource($plan), 201);
    }

    public function show(Plan $plan)
    {
        return new PlanResource($plan);
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        if ($plan->estado !== 'borrador') {
            return response()->json(['message' => 'Solo se pueden editar planes en borrador'], 422);
        }

        $validated = $request->validate([
            'denominacion' => 'sometimes|string|max:240',
            'tipo_periodo' => 'sometimes|in:mensual,trimestral,semestral',
        ]);

        if (isset($validated['tipo_periodo'])) {
            $validated['cantidad_periodos'] = match($validated['tipo_periodo']) {
                'mensual' => 12,
                'trimestral' => 4,
                'semestral' => 2,
            };
        }

        $plan->update($validated);

        return response()->json(new PlanResource($plan));
    }

    public function aprobar(Plan $plan): JsonResponse
    {
        if ($plan->estado !== 'borrador') {
            return response()->json(['message' => 'El plan no está en borrador'], 422);
        }

        $plan->update([
            'estado' => 'aprobado',
            'fecha_linea_base' => now(),
            'fecha_aprobacion' => now(),
        ]);

        return response()->json(new PlanResource($plan));
    }
}
```

- [ ] **Paso 4: Crear ActividadController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\ActividadResource;
use App\Models\Poa\Actividad;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActividadController extends Controller
{
    public function index(Request $request)
    {
        $actividades = Actividad::with(['indicadores.metas.programaciones'])
            ->when($request->plan_id, fn($q, $p) => $q->where('plan_id', $p))
            ->when($request->programa_id, fn($q, $p) => $q->where('programa_id', $p))
            ->when($request->estado, fn($q, $e) => $q->where('estado', $e))
            ->orderBy('codigo')
            ->paginate(15);

        return ActividadResource::collection($actividades);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:poa_planes,id',
            'programa_id' => 'required|exists:poa_programas,id',
            'gestion_id' => 'required|integer',
            'proyecto_id' => 'nullable|exists:poa_proyectos,id',
            'codigo' => 'required|string|max:20',
            'denominacion' => 'required|string|max:240',
            'producto_esperado' => 'nullable|string',
            'unidad_organizacional_id' => 'required|integer',
        ]);

        $validated['estado'] = 'borrador';

        $actividad = Actividad::create($validated);

        return response()->json(new ActividadResource($actividad), 201);
    }

    public function show(Actividad $actividad)
    {
        $actividad->load(['indicadores.metas.programaciones']);
        return new ActividadResource($actividad);
    }

    public function update(Request $request, Actividad $actividad): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|max:20',
            'denominacion' => 'sometimes|string|max:240',
            'producto_esperado' => 'nullable|string',
            'estado' => 'sometimes|in:borrador,vigente,anulada',
        ]);

        $actividad->update($validated);

        return response()->json(new ActividadResource($actividad));
    }

    public function destroy(Actividad $actividad): JsonResponse
    {
        $actividad->delete();
        return response()->json(['message' => 'Actividad eliminada']);
    }
}
```

- [ ] **Paso 5: Crear IndicadorController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\IndicadorResource;
use App\Models\Poa\Indicador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IndicadorController extends Controller
{
    public function index(Request $request)
    {
        $indicadores = Indicador::with('metas')
            ->when($request->actividad_id, fn($q, $a) => $q->where('actividad_id', $a))
            ->orderBy('codigo')
            ->paginate(15);

        return IndicadorResource::collection($indicadores);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actividad_id' => 'required|exists:poa_actividades,id',
            'codigo' => 'required|string|max:20',
            'denominacion' => 'required|string|max:240',
            'unidad_medida' => 'required|string|max:40',
            'tipo' => 'required|in:proceso,producto,resultado',
            'formula' => 'nullable|string',
        ]);

        $indicador = Indicador::create($validated);

        return response()->json(new IndicadorResource($indicador), 201);
    }

    public function show(Indicador $indicador)
    {
        $indicador->load('metas');
        return new IndicadorResource($indicador);
    }

    public function update(Request $request, Indicador $indicador): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|max:20',
            'denominacion' => 'sometimes|string|max:240',
            'unidad_medida' => 'sometimes|string|max:40',
            'tipo' => 'sometimes|in:proceso,producto,resultado',
            'formula' => 'nullable|string',
        ]);

        $indicador->update($validated);

        return response()->json(new IndicadorResource($indicador));
    }

    public function destroy(Indicador $indicador): JsonResponse
    {
        $indicador->delete();
        return response()->json(['message' => 'Indicador eliminado']);
    }
}
```

- [ ] **Paso 6: Crear MetaController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Http\Resources\Poa\MetaResource;
use App\Models\Poa\Meta;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    public function index(Request $request)
    {
        $metas = Meta::with('programaciones')
            ->when($request->indicador_id, fn($q, $i) => $q->where('indicador_id', $i))
            ->orderByDesc('version')
            ->paginate(15);

        return MetaResource::collection($metas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'indicador_id' => 'required|exists:poa_indicadores,id',
            'linea_base' => 'required|numeric|min:0',
            'meta_anual' => 'required|numeric|min:0',
            'usuario_registro_id' => 'required|exists:users,id',
        ]);

        $ultimaVersion = Meta::where('indicador_id', $validated['indicador_id'])->max('version') ?? 0;
        $validated['version'] = $ultimaVersion + 1;

        $meta = Meta::create($validated);

        return response()->json(new MetaResource($meta), 201);
    }

    public function show(Meta $meta)
    {
        $meta->load('programaciones');
        return new MetaResource($meta);
    }

    public function update(Request $request, Meta $meta): JsonResponse
    {
        $validated = $request->validate([
            'linea_base' => 'sometimes|numeric|min:0',
            'meta_anual' => 'sometimes|numeric|min:0',
        ]);

        $meta->update($validated);

        return response()->json(new MetaResource($meta));
    }
}
```

- [ ] **Paso 7: Crear DashboardController**

```php
<?php

namespace App\Http\Controllers\Api\Poa;

use App\Http\Controllers\Controller;
use App\Models\Poa\Actividad;
use App\Models\Poa\Meta;
use App\Models\Poa\Plan;
use App\Models\Poa\Programa;
use App\Models\Poa\Proyecto;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'programas' => Programa::count(),
            'proyectos' => Proyecto::count(),
            'actividades' => Actividad::count(),
            'actividades_por_estado' => Actividad::selectRaw('estado, count(*) as total')
                ->groupBy('estado')
                ->pluck('total', 'estado'),
            'planes' => Plan::count(),
            'ultimo_plan' => Plan::latest()->first(),
            'metas_total' => Meta::count(),
        ];

        return response()->json(['data' => $stats]);
    }
}
```

- [ ] **Paso 8: Commit**

```bash
git add app/Http/Controllers/Api/Poa/
git commit -m "feat(poa): crear controladores CRUD para el módulo POA"
```

---

### Tarea 4: Rutas Backend

**Archivos:**
- Modificar: `routes/api/poa.php`

- [ ] **Paso 1: Actualizar rutas POA**

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Poa\ProgramaController;
use App\Http\Controllers\Api\Poa\ProyectoController;
use App\Http\Controllers\Api\Poa\PlanController;
use App\Http\Controllers\Api\Poa\ActividadController;
use App\Http\Controllers\Api\Poa\IndicadorController;
use App\Http\Controllers\Api\Poa\MetaController;
use App\Http\Controllers\Api\Poa\DashboardController;

Route::prefix('poa')->name('poa.')->group(function (): void {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Programas
    Route::apiResource('programas', ProgramaController::class);

    // Proyectos
    Route::apiResource('proyectos', ProyectoController::class);

    // Planes POA
    Route::apiResource('planes', PlanController::class);
    Route::post('/planes/{plan}/aprobar', [PlanController::class, 'aprobar'])->name('planes.aprobar');

    // Actividades
    Route::apiResource('actividades', ActividadController::class);

    // Indicadores
    Route::apiResource('indicadores', IndicadorController::class);

    // Metas
    Route::apiResource('metas', MetaController::class)->only(['index', 'store', 'show', 'update']);
});
```

- [ ] **Paso 2: Verificar rutas**

Run: `cd C:\xampp\htdocs\backend-SEDEDE && php artisan route:list --path=poa`

- [ ] **Paso 3: Commit**

```bash
git add routes/api/poa.php
git commit -m "feat(poa): definir rutas API del módulo POA"
```

---

### Tarea 5: Service y Store Frontend

**Archivos:**
- Crear: `src/services/poaService.js`
- Crear: `src/stores/poa.js`

- [ ] **Paso 1: Crear poaService.js**

```javascript
import api from './api'

export const poaService = {
  // Dashboard
  async getDashboard() {
    const { data } = await api.get('/poa/dashboard')
    return data.data
  },

  // Programas
  async listProgramas(params = {}) {
    const { data } = await api.get('/poa/programas', { params })
    return { items: data.data, meta: data.meta }
  },
  async createPrograma(payload) {
    const { data } = await api.post('/poa/programas', payload)
    return data.data
  },
  async updatePrograma(id, payload) {
    const { data } = await api.put(`/poa/programas/${id}`, payload)
    return data.data
  },
  async deletePrograma(id) {
    await api.delete(`/poa/programas/${id}`)
  },

  // Proyectos
  async listProyectos(params = {}) {
    const { data } = await api.get('/poa/proyectos', { params })
    return { items: data.data, meta: data.meta }
  },
  async createProyecto(payload) {
    const { data } = await api.post('/poa/proyectos', payload)
    return data.data
  },
  async updateProyecto(id, payload) {
    const { data } = await api.put(`/poa/proyectos/${id}`, payload)
    return data.data
  },
  async deleteProyecto(id) {
    await api.delete(`/poa/proyectos/${id}`)
  },

  // Planes
  async listPlanes(params = {}) {
    const { data } = await api.get('/poa/planes', { params })
    return { items: data.data, meta: data.meta }
  },
  async createPlan(payload) {
    const { data } = await api.post('/poa/planes', payload)
    return data.data
  },
  async updatePlan(id, payload) {
    const { data } = await api.put(`/poa/planes/${id}`, payload)
    return data.data
  },
  async aprobarPlan(id) {
    const { data } = await api.post(`/poa/planes/${id}/aprobar`)
    return data.data
  },

  // Actividades
  async listActividades(params = {}) {
    const { data } = await api.get('/poa/actividades', { params })
    return { items: data.data, meta: data.meta }
  },
  async createActividad(payload) {
    const { data } = await api.post('/poa/actividades', payload)
    return data.data
  },
  async updateActividad(id, payload) {
    const { data } = await api.put(`/poa/actividades/${id}`, payload)
    return data.data
  },
  async deleteActividad(id) {
    await api.delete(`/poa/actividades/${id}`)
  },

  // Indicadores
  async listIndicadores(params = {}) {
    const { data } = await api.get('/poa/indicadores', { params })
    return { items: data.data, meta: data.meta }
  },
  async createIndicador(payload) {
    const { data } = await api.post('/poa/indicadores', payload)
    return data.data
  },
  async updateIndicador(id, payload) {
    const { data } = await api.put(`/poa/indicadores/${id}`, payload)
    return data.data
  },
  async deleteIndicador(id) {
    await api.delete(`/poa/indicadores/${id}`)
  },

  // Metas
  async listMetas(params = {}) {
    const { data } = await api.get('/poa/metas', { params })
    return { items: data.data, meta: data.meta }
  },
  async createMeta(payload) {
    const { data } = await api.post('/poa/metas', payload)
    return data.data
  },
  async updateMeta(id, payload) {
    const { data } = await api.put(`/poa/metas/${id}`, payload)
    return data.data
  },
}
```

- [ ] **Paso 2: Crear poa.js store**

```javascript
import { defineStore } from 'pinia'
import { poaService } from '../services/poaService'

export const usePoaStore = defineStore('poa', {
  state: () => ({
    dashboard: null,
    programas: [],
    proyectos: [],
    planes: [],
    actividades: [],
    indicadores: [],
    metas: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDashboard() {
      this.loading = true
      try {
        this.dashboard = await poaService.getDashboard()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchProgramas(params = {}) {
      this.loading = true
      try {
        const { items } = await poaService.listProgramas(params)
        this.programas = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async createPrograma(payload) {
      const programa = await poaService.createPrograma(payload)
      this.programas.push(programa)
      return programa
    },

    async updatePrograma(id, payload) {
      const updated = await poaService.updatePrograma(id, payload)
      const idx = this.programas.findIndex(p => p.id === id)
      if (idx !== -1) this.programas[idx] = updated
      return updated
    },

    async deletePrograma(id) {
      await poaService.deletePrograma(id)
      this.programas = this.programas.filter(p => p.id !== id)
    },

    async fetchProyectos(params = {}) {
      this.loading = true
      try {
        const { items } = await poaService.listProyectos(params)
        this.proyectos = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async createProyecto(payload) {
      const proyecto = await poaService.createProyecto(payload)
      this.proyectos.push(proyecto)
      return proyecto
    },

    async fetchPlanes(params = {}) {
      this.loading = true
      try {
        const { items } = await poaService.listPlanes(params)
        this.planes = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async createPlan(payload) {
      const plan = await poaService.createPlan(payload)
      this.planes.push(plan)
      return plan
    },

    async aprobarPlan(id) {
      const updated = await poaService.aprobarPlan(id)
      const idx = this.planes.findIndex(p => p.id === id)
      if (idx !== -1) this.planes[idx] = updated
      return updated
    },

    async fetchActividades(params = {}) {
      this.loading = true
      try {
        const { items } = await poaService.listActividades(params)
        this.actividades = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async createActividad(payload) {
      const actividad = await poaService.createActividad(payload)
      this.actividades.push(actividad)
      return actividad
    },
  },
})
```

- [ ] **Paso 3: Commit**

```bash
git add src/services/poaService.js src/stores/poa.js
git commit -m "feat(poa): crear service y store para el módulo POA"
```

---

### Tarea 6: Vistas Frontend

**Archivos:**
- Crear: `src/views/PoaDashboard.vue`
- Crear: `src/views/PoaView.vue`
- Crear: `src/components/poa/PoaTree.vue`
- Crear: `src/components/poa/PoaNode.vue`
- Crear: `src/components/poa/PoaModal.vue`

- [ ] **Paso 1: Crear PoaDashboard.vue**

```vue
<script setup>
import { onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()

onMounted(() => {
  store.fetchDashboard()
})
</script>

<template>
  <section class="mt-8">
    <h2 class="mb-6 font-display text-xl font-bold text-ink">Dashboard POA</h2>

    <div v-if="store.loading" class="py-10 text-center text-sm text-slate-400">
      Cargando estadísticas…
    </div>

    <div v-else-if="store.dashboard" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Programas</p>
        <p class="mt-1 font-display text-2xl font-bold text-ink">{{ store.dashboard.programas }}</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Proyectos</p>
        <p class="mt-1 font-display text-2xl font-bold text-ink">{{ store.dashboard.proyectos }}</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Actividades</p>
        <p class="mt-1 font-display text-2xl font-bold text-ink">{{ store.dashboard.actividades }}</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Metas</p>
        <p class="mt-1 font-display text-2xl font-bold text-ink">{{ store.dashboard.metas_total }}</p>
      </div>
    </div>

    <div v-if="store.dashboard?.ultimo_plan" class="mt-6 rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Último Plan POA</h3>
      <p class="font-medium text-ink">{{ store.dashboard.ultimo_plan.denominacion }}</p>
      <span class="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="{
          'bg-teal-100 text-teal-700': store.dashboard.ultimo_plan.estado === 'aprobado',
          'bg-amber-100 text-amber-700': store.dashboard.ultimo_plan.estado === 'borrador',
          'bg-slate-100 text-slate-500': store.dashboard.ultimo_plan.estado === 'cerrado'
        }">
        {{ store.dashboard.ultimo_plan.estado }}
      </span>
    </div>
  </section>
</template>
```

- [ ] **Paso 2: Crear PoaView.vue**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'
import PoaTree from '../components/poa/PoaTree.vue'
import PoaModal from '../components/poa/PoaModal.vue'

const store = usePoaStore()
const showModal = ref(false)
const modalType = ref('')
const editingItem = ref(null)
const parentItem = ref(null)

onMounted(async () => {
  await store.fetchProgramas()
})

function openCreate(type, parent = null) {
  modalType.value = type
  editingItem.value = null
  parentItem.value = parent
  showModal.value = true
}

function openEdit(type, item) {
  modalType.value = type
  editingItem.value = item
  parentItem.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingItem.value = null
  parentItem.value = null
}
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="font-display text-xl font-bold text-ink">Plan Operativo Anual</h2>
      <button class="btn-primary" @click="openCreate('programa')">+ Nuevo programa</button>
    </div>

    <div v-if="store.loading" class="py-10 text-center text-sm text-slate-400">
      Cargando estructura POA…
    </div>

    <PoaTree
      v-else
      :programas="store.programas"
      @create="openCreate"
      @edit="openEdit"
    />

    <PoaModal
      v-if="showModal"
      :type="modalType"
      :item="editingItem"
      :parent="parentItem"
      @close="closeModal"
    />
  </section>
</template>
```

- [ ] **Paso 3: Crear PoaTree.vue**

```vue
<script setup>
import PoaNode from './PoaNode.vue'

defineProps({
  programas: { type: Array, default: () => [] },
})

const emit = defineEmits(['create', 'edit'])
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div v-if="!programas.length" class="px-4 py-8 text-center text-sm text-slate-400">
      No hay programas registrados.
    </div>
    <PoaNode
      v-for="programa in programas"
      :key="programa.id"
      :item="programa"
      type="programa"
      @create="(type, parent) => emit('create', type, parent)"
      @edit="(type, item) => emit('edit', type, item)"
    />
  </div>
</template>
```

- [ ] **Paso 4: Crear PoaNode.vue**

```vue
<script setup>
import { ref } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  type: { type: String, required: true },
})

const emit = defineEmits(['create', 'edit'])
const expanded = ref(false)

const childType = {
  programa: 'proyecto',
  proyecto: 'actividad',
  actividad: 'indicador',
}

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="border-b border-slate-100 last:border-b-0">
    <div
      class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
      @click="toggle"
    >
      <span class="text-xs text-slate-400" :class="{ 'rotate-90': expanded }">▶</span>
      <span class="font-mono text-xs font-semibold text-brand-600">{{ item.codigo }}</span>
      <span class="flex-1 text-sm font-medium text-ink">{{ item.denominacion }}</span>
      <span
        v-if="item.estado"
        class="rounded-full px-2 py-0.5 text-xs font-semibold"
        :class="{
          'bg-teal-100 text-teal-700': item.estado === 'vigente' || item.estado === 'aprobado',
          'bg-amber-100 text-amber-700': item.estado === 'borrador',
          'bg-slate-100 text-slate-500': item.estado === 'anulada' || item.estado === 'cerrado'
        }"
      >
        {{ item.estado }}
      </span>
      <button
        class="text-xs font-semibold text-slate-500 hover:underline"
        @click.stop="emit('edit', type, item)"
      >
        Editar
      </button>
      <button
        v-if="childType[type]"
        class="text-xs font-semibold text-brand-600 hover:underline"
        @click.stop="emit('create', childType[type], item)"
      >
        + Agregar
      </button>
    </div>
    <div v-if="expanded" class="ml-6">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Paso 5: Crear PoaModal.vue**

```vue
<script setup>
import { ref, reactive } from 'vue'
import { usePoaStore } from '../stores/poa'

const props = defineProps({
  type: { type: String, required: true },
  item: { type: Object, default: null },
  parent: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const store = usePoaStore()
const saving = ref(false)
const error = ref('')

const form = reactive({
  codigo: props.item?.codigo || '',
  denominacion: props.item?.denominacion || '',
  objetivo_ptdi: props.item?.objetivo_ptdi || '',
})

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const payload = { ...form }
    if (props.parent) {
      if (props.type === 'proyecto') payload.programa_id = props.parent.id
      if (props.type === 'actividad') {
        payload.plan_id = props.parent.plan_id || props.parent.id
        payload.programa_id = props.parent.programa_id
        payload.gestion_id = props.parent.gestion_id
      }
    }

    if (props.item) {
      await store[`update${props.type.charAt(0).toUpperCase() + props.type.slice(1)}`](props.item.id, payload)
    } else {
      await store[`create${props.type.charAt(0).toUpperCase() + props.type.slice(1)}`](payload)
    }
    emit('close')
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h3 class="mb-4 font-display text-lg font-bold text-ink">
        {{ item ? `Editar ${type}` : `Nuevo ${type}` }}
      </h3>

      <form novalidate class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
          <input v-model="form.codigo" type="text" class="input-field" required :disabled="saving" />
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Denominación</label>
          <input v-model="form.denominacion" type="text" class="input-field" required :disabled="saving" />
        </div>

        <div v-if="type === 'programa'">
          <label class="mb-1 block text-xs font-semibold text-slate-600">Objetivo PTDI</label>
          <textarea v-model="form.objetivo_ptdi" class="input-field" rows="3" :disabled="saving"></textarea>
        </div>

        <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" :disabled="saving" @click="emit('close')">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
```

- [ ] **Paso 6: Commit**

```bash
git add src/views/PoaDashboard.vue src/views/PoaView.vue src/components/poa/
git commit -m "feat(poa): crear vistas y componentes del módulo POA"
```

---

### Tarea 7: Router y Sidebar

**Archivos:**
- Modificar: `src/router/index.js`
- Modificar: `src/components/dashboard/AppSidebar.vue`

- [ ] **Paso 1: Agregar rutas POA**

Agregar al array `routes` dentro de `children` de dashboard:

```javascript
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
```

- [ ] **Paso 2: Agregar enlace al sidebar**

Agregar al array `links`:

```javascript
{ to: '/dashboard/poa', label: 'POA' },
{ to: '/dashboard/poa/dashboard', label: 'Dashboard POA' },
```

- [ ] **Paso 3: Commit**

```bash
git add src/router/index.js src/components/dashboard/AppSidebar.vue
git commit -m "feat(poa): agregar rutas y sidebar del módulo POA"
```

---

### Tarea 8: Verificación Final

- [ ] **Paso 1: Verificar backend**

Run: `cd C:\xampp\htdocs\backend-SEDEDE && php artisan route:list --path=poa`

- [ ] **Paso 2: Verificar frontend**

Run: `cd C:\xampp\htdocs\sedede-front && npm run dev`

- [ ] **Paso 3: Probar endpoints**

```bash
curl http://localhost:8000/api/v1/poa/dashboard
curl http://localhost:8000/api/v1/poa/programas
curl http://localhost:8000/api/v1/poa/actividades
```

- [ ] **Paso 4: Commit final**

```bash
git add -A
git commit -m "feat(poa): módulo POA completo"
```

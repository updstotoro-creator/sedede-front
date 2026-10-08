# Diseño: Módulo POA (Plan Operativo Anual)

## Objetivo

Crear el módulo completo de POA en backend (Laravel) y frontend (Vue), permitiendo visualizar y gestionar la estructura programática institucional: Programas → Proyectos → Actividades → Indicadores → Metas.

## Alcance

### Backend (Laravel)
- **Modelos:** Programa, Proyecto, Plan, Actividad, Indicador, Meta, ProgramacionPeriodo, TechoPresupuestario
- **Controladores:** CRUD completo para cada entidad
- **Rutas:** API REST bajo `/api/v1/poa/`
- **Resources:** Formateo de respuestas API
- **Requests:** Validación de datos

### Frontend (Vue)
- **Service:** `poaService.js` - Comunicación con la API
- **Store:** `poa.js` (Pinia) - Estado global del módulo
- **Vistas:**
  - `PoaDashboard.vue` - Resumen y estadísticas
  - `PoaView.vue` - Árbol completo de la estructura POA
- **Componentes:** Árbol expandible, modales CRUD
- **Router:** Rutas para el módulo POA
- **Sidebar:** Enlace al módulo POA

## Estructura de datos (migraciones existentes)

```
poa_programas (gestion_id, codigo, denominacion, objetivo_ptdi)
  └── poa_proyectos (programa_id, codigo, denominacion)
        └── poa_actividades (plan_id, programa_id, proyecto_id, codigo, denominacion, producto_esperado, estado)
              ├── poa_indicadores (actividad_id, codigo, denominacion, unidad_medida, tipo)
              │     └── poa_metas (indicador_id, version, linea_base, meta_anual)
              │           └── poa_programacion_periodos (meta_id, numero_periodo, meta_periodo)
              └── poa_techos_presupuestarios (actividad_id, monto_solicitado_bs)

poa_planes (gestion_id, unidad_ejecutora_id, denominacion, estado, tipo_periodo, cantidad_periodos)
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/poa/programas` | Listar programas |
| POST | `/api/v1/poa/programas` | Crear programa |
| PUT | `/api/v1/poa/programas/{id}` | Actualizar programa |
| DELETE | `/api/v1/poa/programas/{id}` | Eliminar programa |
| GET | `/api/v1/poa/proyectos` | Listar proyectos |
| POST | `/api/v1/poa/proyectos` | Crear proyecto |
| PUT | `/api/v1/poa/proyectos/{id}` | Actualizar proyecto |
| DELETE | `/api/v1/poa/proyectos/{id}` | Eliminar proyecto |
| GET | `/api/v1/poa/planes` | Listar planes POA |
| POST | `/api/v1/poa/planes` | Crear plan POA |
| PUT | `/api/v1/poa/planes/{id}` | Actualizar plan POA |
| POST | `/api/v1/poa/planes/{id}/aprobar` | Aprobar plan POA |
| GET | `/api/v1/poa/actividades` | Listar actividades |
| POST | `/api/v1/poa/actividades` | Crear actividad |
| PUT | `/api/v1/poa/actividades/{id}` | Actualizar actividad |
| DELETE | `/api/v1/poa/actividades/{id}` | Eliminar actividad |
| GET | `/api/v1/poa/indicadores` | Listar indicadores |
| POST | `/api/v1/poa/indicadores` | Crear indicador |
| PUT | `/api/v1/poa/indicadores/{id}` | Actualizar indicador |
| DELETE | `/api/v1/poa/indicadores/{id}` | Eliminar indicador |
| GET | `/api/v1/poa/metas` | Listar metas |
| POST | `/api/v1/poa/metas` | Crear meta |
| PUT | `/api/v1/poa/metas/{id}` | Actualizar meta |
| GET | `/api/v1/poa/dashboard` | Estadísticas del POA |

## Vistas Frontend

### PoaDashboard.vue
- Total de programas, proyectos, actividades
- Actividades por estado (borrador, vigente, anulada)
- Metas totales y promedio de cumplimiento
- Último plan POA y su estado

### PoaView.vue
- Árbol expandible con la jerarquía completa
- Cada nodo muestra código, denominación, estado
- Botones de acción: Editar, Eliminar, Agregar hijo
- Modales para CRUD de cada entidad
- Filtro por gestión y estado

## Orden de implementación

1. **Backend - Modelos** (8 modelos)
2. **Backend - Resources** (8 resources)
3. **Backend - Requests** (8 requests)
4. **Backend - Controladores** (8 controladores)
5. **Backend - Rutas** (actualizar poa.php)
6. **Frontend - Service** (poaService.js)
7. **Frontend - Store** (poa.js)
8. **Frontend - Vistas** (PoaDashboard.vue, PoaView.vue)
9. **Frontend - Router y Sidebar**

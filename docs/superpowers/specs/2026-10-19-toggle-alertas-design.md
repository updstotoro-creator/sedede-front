# Toggle de alertas del dashboard ejecutivo — Diseño

**Fecha:** 2026-10-19
**Estado:** Aprobado para planificación
**Alcance:** Backend Laravel (`backend-SEDEDE`) + Frontend Vue (`sedede-front`)

## 1. Contexto

Hoy las alertas del dashboard ejecutivo se calculan al vuelo en
`ExecutiveDashboardController::index()` con apoyo de
`AlertasOperativasService`. No existe una tabla de alertas ni una preferencia
de usuario: el frontend recibe `alertas`, `alertas_total` y
`alertas_por_nivel`, pero la vista ejecutiva de `DashboardView.vue` todavía no
las renderiza.

Las fuentes de datos relacionadas son:

- `tramites` (plazos y solicitudes observadas).
- `recibos_ingreso` (movimientos financieros recientes).
- `eventos_calendario_anual` (eventos de la semana).
- `reservas_escenario` (reservas pendientes, vencidas o sin liquidar).
- `aportes_sedede` (aportes sin ejecutar o con ejecución parcial).
- `inventario_lotes` (vencimientos, cálculo independiente del dashboard).

No hay columna, tabla ni permiso adecuado para activar o desactivar las
alertas por usuario. El permiso `poa.generar_alerta` pertenece al módulo POA y
no aplica a esta preferencia.

## 2. Objetivo

Permitir que cada usuario autenticado muestre u oculte el Centro de Alertas
del dashboard ejecutivo mediante un único switch global, persistido en la base
de datos. Cuando la preferencia está apagada, el backend no calcula ni envía
alertas.

## 3. Decisiones

- **Persistencia elegida:** columna booleana `users.alertas_habilitadas`, con
  valor por defecto `true`. Se descartó un JSON de preferencias y una tabla
  `user_preferences` por ser sobredimensionados para un solo flag.
- **Granularidad:** un único switch global; no hay switches por nivel ni por
  módulo.
- **Comportamiento apagado:** además de ocultar la sección, el backend omite
  el cálculo de alertas y responde listas/conteos vacíos.
- **Ubicación:** el switch vive en el encabezado del Centro de Alertas de la
  vista ejecutiva del dashboard. La sección no aparece en el Portal del
  Deportista ni en la vista restringida de comunidades.
- **Fuera de alcance:** corregir la desalineación existente entre los KPIs del
  frontend (`recaudacion`, `tramites`) y la respuesta del backend
  (`kpis_financieros`, `kpis_gestion`). Se documenta como issue separado.

## 4. Modelo de datos

Migración nueva en `backend-SEDEDE/database/migrations`:

```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('alertas_habilitadas')->default(true);
});
```

- Usuarios existentes y nuevos: `true` por defecto.
- `down()` elimina la columna.
- En `User`: agregar `alertas_habilitadas` a `$fillable` y el cast
  `'alertas_habilitadas' => 'boolean'`.

## 5. API

### 5.1 Actualizar preferencia

```
PATCH /api/v1/core/me/alertas
Authorization: Bearer <token>
Body: { "alertas_habilitadas": true | false }
```

- Ruta dentro del grupo `auth:sanctum`, junto a `/core/me`.
- Acción en `AuthController::updateAlertasPreference()`.
- Validación: `alertas_habilitadas` requerido y booleano (`422` si no cumple).
- Actualiza solo al usuario autenticado.
- Respuesta `200`:

```json
{
  "data": {
    "id": 1,
    "name": "Nombre",
    "alertas_habilitadas": false
  }
}
```

La respuesta sigue el formato de `/core/me` (`data.data ?? data` en el
frontend).

### 5.2 Dashboard ejecutivo

```
GET /api/v1/core/dashboard/executive
```

Agregar `alertas_habilitadas` a la respuesta. Comportamiento:

- Preferencia `true`: respuesta actual sin cambios (`alertas`,
  `alertas_total`, `alertas_por_nivel` con datos).
- Preferencia `false`: `alertas: []`, `alertas_total: 0`,
  `alertas_por_nivel: { urgente: 0, advertencia: 0, info: 0 }` y
  `alertas_habilitadas: false`.
- Con la preferencia apagada no se ejecutan las consultas de trámites,
  recibos, eventos, reservas ni aportes destinadas a alertas.

## 6. Cambios en backend

1. Migración `add_alertas_habilitadas_to_users_table`.
2. `app/Models/User.php`: `$fillable` y cast.
3. `routes/api/core.php`: `Route::patch('/me/alertas', ...)` dentro de
   `auth:sanctum`.
4. `app/Http/Controllers/Api/Core/AuthController.php`:
   - `updateAlertasPreference(Request $request)`.
5. `app/Http/Controllers/Api/Core/ExecutiveDashboardController.php`:
   - Leer `$request->user()?->alertas_habilitadas ?? true`.
   - Envolver el bloque de construcción de alertas en esa condición.
   - Devolver `alertas_habilitadas` y valores vacíos cuando esté apagada.
6. Tests nuevos en `tests/Feature/Core/AlertasPreferenciaTest.php`.

## 7. Cambios en frontend

### 7.1 Servicio y store

- `src/services/authService.js`: nuevo método
  `actualizarPreferenciaAlertas(alertasHabilitadas)` que ejecuta
  `PATCH /core/me/alertas` y devuelve el usuario.
- `src/stores/auth.js`: acción `actualizarAlertas(habilitadas)` que llama al
  servicio y reemplaza `this.user` con la respuesta.
- La preferencia no se guarda en `localStorage`: la fuente de verdad es la
  base de datos y el campo viene incluido en `/core/me`, login y dashboard.

### 7.2 Dashboard ejecutivo

En `src/views/DashboardView.vue`, dentro de la vista ejecutiva (rama distinta
a `isDeportista`):

- Nuevo estado:
  - `alertasHabilitadas` (inicial: `auth.user?.alertas_habilitadas ?? true`).
  - `alertasGuardando` para deshabilitar el switch durante la petición.
  - `alertasError` para errores de guardado.
- `fetchMetrics()` sincroniza `alertasHabilitadas` con
  `res.alertas_habilitadas ?? true`.
- Nueva sección **Centro de Alertas**, ubicada después del grid de KPIs y
  antes de "Accesos Rápidos".
- Encabezado de la sección:
  - Título "Centro de Alertas".
  - Badge con `alertas_total` cuando está habilitado.
  - Switch accesible: `role="switch"`, `aria-checked`, etiqueta visible
    "Alertas activas"/"Alertas desactivadas", `:disabled="alertasGuardando"`.
- Contenido habilitado:
  - Hasta 8 alertas (`metrics.alertas`), ordenadas por el backend.
  - Cada alerta muestra nivel, título, mensaje y fecha formateada.
  - Colores semánticos: urgente (rojo), advertencia (ámbar), info (azul).
  - Conteo por nivel desde `alertas_por_nivel`.
  - Si `alertas_total > 8`, indicar "Mostrando 8 de N".
  - Sin alertas: estado vacío "Sin alertas activas".
- Contenido deshabilitado:
  - Estado vacío "Alertas desactivadas" con texto que invita a reactivarlas.
  - El switch permanece visible.
- Acción del switch:
  1. Calcular el nuevo valor.
  2. Marcar `alertasGuardando = true` y limpiar `alertasError`.
  3. Llamar `auth.actualizarAlertas(nuevoValor)`.
  4. Actualizar `alertasHabilitadas` con la respuesta.
  5. Ejecutar `fetchMetrics()` para reflejar el nuevo estado del backend.
  6. Si falla, mostrar `alertasError` y no cambiar el switch.
  7. `finally`: `alertasGuardando = false`.

## 8. Flujo de datos

1. El usuario entra al dashboard ejecutivo.
2. `GET /core/dashboard/executive` lee `users.alertas_habilitadas`.
3. Si está habilitado, el backend calcula las alertas y las devuelve; si no,
   devuelve listas vacías y `alertas_habilitadas: false`.
4. El frontend renderiza la sección y fija el switch según ese valor.
5. Al cambiar el switch, `PATCH /core/me/alertas` persiste la preferencia y se
   recargan las métricas.
6. En otra sesión o dispositivo, el valor se recupera desde la base de datos.

## 9. Manejo de errores

- Validación del body: `422` con mensaje estándar de Laravel.
- Sin token o token inválido: `401` (manejado por el interceptor existente).
- Fallo de red al guardar: el switch no cambia y se muestra
  "No se pudo guardar la preferencia de alertas. Intenta nuevamente."
- Fallo al recargar métricas: se usa el manejo actual de `errorMessage` del
  dashboard.
- Si la preferencia es `false`, el dashboard no debe fallar por ausencia de
  alertas: la UI muestra el estado vacío.

## 10. Pruebas

### Backend (PHPUnit)

`tests/Feature/Core/AlertasPreferenciaTest.php` con `RefreshDatabase`:

1. Un usuario nuevo tiene `alertas_habilitadas = true`.
2. `PATCH /core/me/alertas` actualiza el valor y persiste en base de datos.
3. El endpoint devuelve `401` sin autenticación.
4. El endpoint devuelve `422` con valores no booleanos.
5. El dashboard con preferencia apagada devuelve `alertas: []`,
   `alertas_total: 0`, conteos en cero y `alertas_habilitadas: false`.
6. El dashboard con preferencia encendida mantiene el comportamiento actual;
   los casos existentes de `AlertasOperativasTest` cubren las fuentes de
   alertas y deben seguir pasando.

También deben seguir pasando los tests existentes de
`tests/Feature/Core/AlertasOperativasTest.php`.

### Frontend

No hay framework de tests instalado. Verificación:

- `npm run build` sin errores.
- Prueba manual:
  1. Activar/desactivar el switch.
  2. Recargar la página y confirmar que la preferencia se mantiene.
  3. Confirmar que al apagarlo desaparecen las alertas y el tráfico no las
     calcula (revisar respuesta con `alertas_habilitadas: false`).
  4. Confirmar que al encenderlo vuelven las alertas.
  5. Probar el switch con teclado y verificar `aria-checked`.

## 11. Criterios de aceptación

- Existe `users.alertas_habilitadas` con default `true`.
- El switch del Centro de Alertas muestra/oculta las alertas y persiste por
  usuario.
- Con el switch apagado, el backend responde sin alertas y sin ejecutar el
  cálculo.
- Al recargar o iniciar sesión en otro dispositivo, la preferencia se
  conserva.
- La suite PHPUnit del módulo Core pasa.
- `npm run build` pasa.
- No se modifica la lógica de KPIs ni otros módulos fuera del alcance.

## 12. Fuera de alcance

- Notificaciones por correo o push.
- Switches por nivel, módulo o tipo de alerta.
- Marcar alertas como leídas o descartadas.
- Corregir la forma de la respuesta de KPIs consumida por el dashboard.
- Alertas de inventario o POA.

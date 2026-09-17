# Módulo Tarifario e Ingresos Propios (Frontend) — Requerimientos

Interfaz de usuario para el cálculo en tiempo real de cánones de arrendamiento, emisión de liquidaciones, recibos oficiales imprimibles y control de depósitos en 24 horas de acuerdo a la **Resolución Administrativa Gubernamental CH/N.º 011/2024**.

- **Prefijo de IDs:** `RF-FRONT-TAR-###` / `RNF-FRONT-TAR-###`
- **Ruta Vue:** `/dashboard/tarifario` (`TarifarioView.vue`)
- **Servicio API:** `src/services/tarifarioService.js`
- **Estado:** Implementado

---

## 1. Alcance del módulo

### ¿Qué entra?
- **Calculadora & Cotizador RAG 011/2024**: Selección interactiva de Escenario, Espacio, Concepto, Tipo de Usuario y Turno (Día/Noche con recargo CESSA).
- **Emisión de Liquidaciones & Recibos**: Formulario de orden de alquiler con cálculo de subtotal, CESSA y total.
- **Impresión de Recibo Oficial GADCH/SEDEDE**: Formato fiscal en pantalla listo para impresión con número correlativo.
- **Registro de Exenciones**: Formulario con tipificación de motivo normativo, recomendación Director SEDEDE y aprobación MAE.
- **Catálogo Tarifario**: Vista tabulada del arancel oficial.
- **Tablero KPI**: Métricas de recaudación, saldos por cobrar y cumplimiento del depósito dentro de las 24 horas (SAFCO art. 27).

### ¿Qué NO entra?
- Cobro con pasarela de tarjeta de crédito (pago en caja / depósito bancario / transferencia).

---

## 2. Actores y roles

| Actor | Descripción | Permisos en la interfaz |
|---|---|---|
| Admin SEDEDE / Tesorería | Personal encargado de liquidaciones y cobros | Cotizar, emitir liquidación, registrar cobro, exención e imprimir recibo |
| Director SEDEDE | Autoridad ejecutiva | Aprobar exenciones y visualizar reportes de recaudación |
| Operador de Escenario | Encargado del recinto deportivo | Consultar el catálogo de tarifas y verificar disponibilidad |

---

## 3. Requerimientos funcionales

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-FRONT-TAR-001 | Selección interactiva de parámetros tarifarios | Alta | Implementado |
| RF-FRONT-TAR-002 | Cálculo automático de subtotal y recargo CESSA nocturno | Alta | Implementado |
| RF-FRONT-TAR-003 | Generación de Orden de Liquidación con datos de solicitante | Alta | Implementado |
| RF-FRONT-TAR-004 | Emisión de Recibo Oficial con método de pago y comprobante | Alta | Implementado |
| RF-FRONT-TAR-005 | Formulario de registro de exención legal justificada | Alta | Implementado |
| RF-FRONT-TAR-006 | Vista imprimible de recibo oficial GADCH / SEDEDE | Media | Implementado |
| RF-FRONT-TAR-007 | Indicadores KPI de cumplimiento de depósito en 24h | Alta | Implementado |

---

## 4. Componentes y Servicios

| Archivo | Función |
|---|---|
| `src/views/TarifarioView.vue` | Componente principal con pestañas (Cotizador, Liquidaciones, Catálogo) y modales |
| `src/services/tarifarioService.js` | Métodos de interacción con endpoints `/api/v1/tarifario/*` |
| `src/components/dashboard/AppSidebar.vue` | Enlace de navegación principal `/dashboard/tarifario` |

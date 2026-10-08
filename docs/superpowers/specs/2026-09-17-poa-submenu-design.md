# Diseño: Submenú desplegable POA

## Resumen
Consolidar los 5 elementos del POA en el sidebar en un solo botón "POA" con submenú desplegable hacia arriba.

## Estructura actual
- POA (ruta: /dashboard/poa)
- Dashboard POA (ruta: /dashboard/poa/dashboard)
- Planes POA (ruta: /dashboard/poa/planes)
- Techos Presup. (ruta: /dashboard/poa/techos)
- Bitácora (ruta: /dashboard/poa/bitacora)

## Estructura propuesta
```
Resumen
Usuarios
Roles
Asociaciones
Tipos de Ítem
Almacenes
☰ POA  ← Botón principal con icono de menú
   ├─ Dashboard POA
   ├─ Planes POA
   ├─ Techos Presup.
   └─ Bitácora
```

## Comportamiento
1. **Botón POA**: Muestra icono ☰ + texto "POA"
2. **Al hacer clic**: Se despliegan los submenús hacia arriba
3. **Estilo**: Submenús con fondo blanco, sombra sutil, bordes redondeados
4. **Posicionamiento**: CSS `position: absolute` con `bottom: 100%`

## Archivos a modificar
- `src/components/dashboard/AppSidebar.vue` - Agregar lógica del submenú

## Enfoque de implementación
CSS Positioning para el posicionamiento del submenú hacia arriba.

## Criterios de aceptación
1. El botón POA muestra icono ☰ y texto "POA"
2. Al hacer clic se despliegan los submenús hacia arriba
3. Los submenús incluyen: Dashboard POA, Planes POA, Techos Presup., Bitácora
4. El submenú se cierra al hacer clic fuera de él
5. Los submenús mantienen el mismo estilo que los demás enlaces del sidebar

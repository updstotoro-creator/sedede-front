# Documentación Técnica Frontend — SEDEDE Chuquisaca

Especificación de requerimientos, módulos de interfaz, componentes Vue 3 y servicios de integración para el sistema del Servicio Departamental de Deportes.

## Estructura de Documentación de Módulos

```
docs/
└── modulos/
    ├── core/              # Autenticación, usuarios, roles y permisos
    ├── asociaciones/      # Padrón de asociaciones y clubes (drill-down)
    ├── deportistas/       # Registro Único de Deportistas (RUN) y Tutores
    ├── escenarios/        # Programación y reserva de escenarios deportivos
    ├── tramites/          # Solicitudes y trámites institucionales
    └── tarifario/         # Cotizador RAG 011/2024 e Ingresos Propios
```

## Estándar de Documentación

Todos los archivos de requerimientos de módulo siguen la estructura homologada con el backend:
1. Alcance del módulo (Qué entra / Qué no entra)
2. Actores y roles
3. Requerimientos funcionales (`RF-FRONT-###`)
4. Requerimientos no funcionales (`RNF-FRONT-###`)
5. Componentes Vue y servicios API

# SEDEDE Chuquisaca — Directorio Oficial de Usuarios y Credenciales
**Fecha de actualización:** 17 de noviembre de 2026  
**Entorno:** Demostración y Pruebas (`sedede_db` / `sedede_main`)  
**URL de Acceso:** `http://181.188.171.38/sedede` o `http://localhost/sedede`  
**Endpoint API:** `http://181.188.171.38/sedede/api/v1`

---

## 🔑 Contraseña Estándar del Sistema
> **Contraseña universal para todas las cuentas de prueba:**  
> `admin123`

*(Todas las cuentas han sido unificadas con esta clave para facilitar las pruebas del equipo).*

---

## 1. Usuarios Canónicos por Rol del Sistema (14 Roles)

Todos los usuarios cuentan con rol asignado, estado activo y redirección automática a su módulo correspondiente al iniciar sesión.

| # | Rol del Sistema | Nombre de Usuario | Correo Institucional | Contraseña | Entidad / Scoping Vinculado | Ruta Inicial |
|---|---|---|---|:---:|---|---|
| 1 | `admin` | Administrador General SEDEDE | `admin@sedede.gob.bo` | `admin123` | Acceso global a todos los módulos | `/dashboard` |
| 2 | `sedede` | Funcionario Técnico SEDEDE | `sedede@sedede.gob.bo` | `admin123` | Evaluación técnica institucional | `/dashboard` |
| 3 | `personal_sedede` | Personal Administrativo SEDEDE | `personal_sedede@sedede.gob.bo` | `admin123` | Soporte operativo administrativo | `/dashboard` |
| 4 | `asociacion` | Presidente ADFC (Fútbol Chuquisaca) | `asociacion@sedede.gob.bo` | `admin123` | Asociación 1 (ADFC) | `/dashboard/aprobacion-deportistas` |
| 5 | `coordinador_asociacion` | Coordinador ADAC (Atletismo) | `coordinador_asociacion@sedede.gob.bo` | `admin123` | Asociación 4 (ADAC) | `/dashboard/aprobacion-deportistas` |
| 6 | `club` | Delegado Club Atlético Sucre | `club@sedede.gob.bo` | `admin123` | Club 1 (Club Atlético Sucre - CAS) | `/dashboard/mi-club` |
| 7 | `deportista` | Sebastián Vargas Medina | `deportista@sedede.gob.bo` | `admin123` | Deportista 1 (Mayor de edad) | `/dashboard` |
| 8 | `representante_mancomunidad` | Representante Mancomunidades Chuquisaca | `comunidades@sedede.gob.bo` | `admin123` | Mancomunidad 1 (MATUR) | `/dashboard/comunidades` |
| 9 | `representante_mancomunidad` | Representante MATUR | `representante@matur.gob.bo` | `admin123` | Mancomunidad 1 (MATUR) | `/dashboard/comunidades` |
| 10 | `entrenador` | Entrenador Deportivo SEDEDE | `entrenador@sedede.gob.bo` | `admin123` | Escuelas y formación deportiva | `/dashboard/formacion/inscripciones` |
| 11 | `coordinador_poa` | Coordinador Planificación POA | `coordinador_poa@sedede.gob.bo` | `admin123` | Estructura y seguimiento POA | `/dashboard/poa/dashboard` |
| 12 | `encargado_contable` | Encargado Contable y Financiero | `encargado_contable@sedede.gob.bo` | `admin123` | Techos presupuestarios y tarifario | `/dashboard/poa/dashboard` |
| 13 | `encargado_inventarios` | Encargado Almacenes e Inventarios | `encargado_inventarios@sedede.gob.bo` | `admin123` | Almacenes, lotes y existencias | `/dashboard/inventario/almacenes` |
| 14 | `coordinador_eventos` | Coordinador Eventos y Escenarios | `coordinador_eventos@sedede.gob.bo` | `admin123` | Escenarios y calendario oficial | `/dashboard/escenarios` |
| 15 | `invitado` | Usuario Invitado / Público | `invitado@sedede.gob.bo` | `admin123` | Consulta pública y disponibilidad | `/dashboard/escenarios` |

---

## 2. Cuentas del Módulo Deportistas (Atletas Vinculados)

Para validar tanto deportistas **mayores de edad** como **menores de edad con tutor legal**:

| ID | Nombre del Atleta | Correo de Acceso | Contraseña | C.I. | Condición Legal | Tutor Legal Registrado | Disciplina | Asociación | Club Afiliado |
|:---:|---|---|:---:|:---:|:---:|---|---|---|---|
| **1** | Sebastián Vargas Medina | `deportista@sedede.gob.bo`<br>`sebastian.vargas@deportista.sedede.gob.bo` | `admin123` | 7548962 CH | **Mayor de edad** (22 años) | *No requiere* | Atletismo | ADAC (Atletismo) | Club Saeta Sucre |
| **2** | Camila Flores Quiroga | `camila.flores@deportista.sedede.gob.bo` | `admin123` | 10254789 CH | **Menor de edad** (16 años) | Roberto Flores Arteaga (CI: 3652148 CH, Tel: 72895632) | Natación | ADNC (Natación) | Club Neptuno Natación |
| **3** | Mateo Gutiérrez Soliz | `mateo.gutierrez@deportista.sedede.gob.bo` | `admin123` | 8965412 CH | **Mayor de edad** (21 años) | *No requiere* | Ajedrez | ADAJ (Ajedrez) | Club Torre Blanca Ajedrez |
| **4** | Lucía Mendoza Morales | `lucia.mendoza@deportista.sedede.gob.bo` | `admin123` | 11547896 CH | **Menor de edad** (17 años) | María Morales de Mendoza (CI: 4589632 CH, Tel: 73456128) | Tenis | ADTC (Tenis) | Club Sucre Tenis |
| **5** | Alejandro Jancko Torrez | `alejandro.jancko@deportista.sedede.gob.bo` | `admin123` | 6548932 CH | **Mayor de edad** (23 años) | *No requiere* | Fútbol | ADFC (Fútbol) | Club Atlético Sucre |

> **Nota para Pruebas de Trámites y Registro:**
> - Al entrar con **Camila Flores** o **Lucía Mendoza**, el sistema carga automáticamente la condición de menor de edad y los datos de su tutor en el perfil y solicitudes de apoyo.
> - Al entrar con **Sebastián Vargas** (`deportista@sedede.gob.bo`), se puede visualizar el histórico de trámites aprobados y desembolsados en SIGEP, además de agregar nuevos logros deportivos.

---

## 3. Cuentas Asignadas por Integrante del Equipo (Plan de Pruebas v2)

| Responsable | Módulo Asignado | Cuentas a Utilizar | Contraseña |
|---|---|---|:---:|
| **Horacio López Chumacero** | POA (Plan Operativo Anual) | `coordinador_poa@sedede.gob.bo`<br>`encargado_contable@sedede.gob.bo` | `admin123` |
| **Pedro Antonio López Chumacero** | Administración y accesos | `admin@sedede.gob.bo`<br>*(y todas las cuentas para la matriz)* | `admin123` |
| **Nestor Alfredo Avila Pereira** | Mancomunidades y Asociaciones | `admin@sedede.gob.bo`<br>`sedede@sedede.gob.bo`<br>`comunidades@sedede.gob.bo`<br>`asociacion@sedede.gob.bo`<br>`coordinador_asociacion@sedede.gob.bo` | `admin123` |
| **Lucas Vargas** | Clubes y Deportistas | `club@sedede.gob.bo`<br>`deportista@sedede.gob.bo`<br>`camila.flores@deportista.sedede.gob.bo`<br>`entrenador@sedede.gob.bo`<br>`sedede@sedede.gob.bo` | `admin123` |
| **Melvin Rioddy Chipana Peña** | Portal público, Escenarios y Calendario | *Sin sesión (público)*<br>`coordinador_eventos@sedede.gob.bo`<br>`invitado@sedede.gob.bo`<br>`asociacion@sedede.gob.bo` | `admin123` |
| **Cristian Mamani** | Inventario y Formación | `encargado_inventarios@sedede.gob.bo`<br>`entrenador@sedede.gob.bo` | `admin123` |
| **Alejandro Jancko** | Trámites y Tarifario | `deportista@sedede.gob.bo`<br>`camila.flores@deportista.sedede.gob.bo`<br>`sedede@sedede.gob.bo`<br>`encargado_contable@sedede.gob.bo`<br>`coordinador_eventos@sedede.gob.bo` | `admin123` |

---

## 4. Cuentas Alternativas con Prefijo Test (`test.<rol>@sedede.gob.bo`)

También se encuentran habilitadas con la contraseña `admin123` para compatibilidad con scripts automatizados de QA:

- `test.admin@sedede.gob.bo`
- `test.sedede@sedede.gob.bo`
- `test.personal_sedede@sedede.gob.bo`
- `test.asociacion@sedede.gob.bo`
- `test.coordinador_asociacion@sedede.gob.bo`
- `test.club@sedede.gob.bo`
- `test.deportista@sedede.gob.bo`
- `test.representante_mancomunidad@sedede.gob.bo`
- `test.entrenador@sedede.gob.bo`
- `test.coordinador_poa@sedede.gob.bo`
- `test.encargado_contable@sedede.gob.bo`
- `test.encargado_inventarios@sedede.gob.bo`
- `test.coordinador_eventos@sedede.gob.bo`
- `test.invitado@sedede.gob.bo`

---

## 5. Diagnóstico Técnico de los Problemas Previos

1. **Error HTTP 500 intermitente en Login:**
   - **Causa:** El middleware de protección contra fuerza bruta (`throttle:login`) generaba archivos de bloqueo en `storage/framework/cache/data`. Al ejecutarse procesos CLI con permisos mixtos entre el usuario del sistema y `www-data`, el servidor web no podía escribir en ciertas carpetas de caché y arrojaba un error `LockableFile::open / Failed to open stream` con código 500 ("Ocurrió un error inesperado").
   - **Solución implementada:** Se repararon y normalizaron los permisos de todo el árbol de `storage/framework/cache/` y se ejecutó `cache:clear`.

2. **Cuentas faltantes y contraseñas aleatorias de seeders:**
   - **Causa:** El seeder `AuthSeeder` solo creaba 6 usuarios y los seeders de demostración generaban contraseñas aleatorias (`Str::random(40)`) cuando el entorno era `production`. Además, los roles como `entrenador`, `coordinador_poa`, `encargado_inventarios`, etc., no contaban con cuentas canónicas directas sino únicamente con alias de prueba creados en tests anteriores con claves no documentadas.
   - **Solución implementada:** Se crearon las cuentas canónicas para los 14 roles del sistema y se vincularon los 5 deportistas existentes con sus perfiles, unificando la contraseña `admin123` en todas las cuentas tanto en `sedede_db` como en `sedede_main`.

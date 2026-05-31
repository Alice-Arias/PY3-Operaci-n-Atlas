# Proyecto 3 — Operación Atlas

<div align="center">

![Lenguaje](https://img.shields.io/badge/Lenguaje-Prolog-1f425f.svg)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/Versión-1.0-orange)
![Licencia](https://img.shields.io/badge/Licencia-Académico-lightgrey)

### Aventura espacial basada en lógica declarativa y Prolog

Sistema desarrollado en **Prolog** con una capa de **Node.js + Express** y un frontend en **React + Vite** para simular una misión espacial donde el jugador recorre una estación orbital, repara sistemas críticos y rescata tripulantes mediante inferencia lógica, backtracking y persistencia de estado.

</div>

---

## Integrantes

| Nombre |
|---|
| Alice Arias Salazar  2023104639 |
| Heldyis Agüero Espinoza  2023296812|
| Yeremi Calvo Porras  2023083332|

---

## Información académica

| Campo | Información |
|---|---|
| Curso | Lenguajes de Programación |
| Grupo | GR 60 |
| Semestre | I Semestre, 2026 |
| Proyecto | Proyecto Programado #3 |
| Fecha de entrega | 01/06/2026 |
| Estado | En desarrollo |

---

## Descripción

Operación Atlas es un juego de aventura espacial desarrollado con una arquitectura dividida en tres capas:

- La lógica principal del juego vive en Prolog.
- Un servidor en Node.js expone una API HTTP para conectar la lógica con la interfaz.
- Un frontend en React muestra la misión, el mapa, la consola y los controles de acción.

El jugador debe explorar la estación Atlas, recuperar artefactos, reparar sistemas, rescatar tripulantes y cumplir las condiciones de victoria.

---

## Objetivo del juego

- Restaurar sistemas críticos.
- Reparar energía y comunicaciones.
- Rescatar tripulantes.
- Acceder a módulos restringidos.
- Cumplir las condiciones de victoria.

---

## Funcionalidades

### Navegación

- Movimiento entre módulos.
- Validación de rutas.
- Búsqueda de caminos con backtracking.
- Registro de módulos visitados.

### Gestión de artefactos

- Recolección de objetos.
- Inventario del jugador.
- Uso de artefactos para desbloquear acciones.
- Soporte para acceso a módulos restringidos.

### Sistemas

- Reparación de sistemas críticos.
- Validación de requisitos.
- Dependencias entre acciones.

### Rescate

- Tripulantes atrapados en distintos módulos.
- Condiciones de rescate según el estado de la partida.

### Consultas y control

- Consulta de inventario.
- Consulta de ubicación de objetos.
- Estado general de la partida.
- Guardado y carga de progreso.

---

## Predicados principales

| Predicado | Función |
|---|---|
| `tomar/1` | Recoger artefactos |
| `usar/1` | Usar artefactos |
| `mover/1` | Moverse entre módulos |
| `puedo_ir/1` | Validar movimiento |
| `reparar/1` | Reparar sistemas |
| `rescatar/1` | Rescatar tripulantes |
| `ruta/3` | Encontrar caminos |
| `que_tengo/0` | Consultar inventario |
| `modulos_visitados/0` | Ver historial de módulos |
| `verifica_gane/0` | Verificar victoria |
| `como_gano/0` | Obtener sugerencia de progreso |

---

## Arquitectura del proyecto

```text
Programa/
├── main.pl
├── atlas.pl
├── estado_actual.pl
├── backend/
│   ├── ayudas.pl
│   ├── datos.pl
│   ├── estado.pl
│   ├── logica.pl
│   ├── logica_base.pl
│   ├── logica_acciones.pl
│   ├── logica_consultas.pl
│   ├── persistencia.pl
│   └── registro.pl
├── controller/
│   ├── server.js
│   ├── rutas_api.js
│   ├── ejecutor_prolog.js
│   ├── servicio_prolog_api.js
│   ├── traductor.pl
│   └── estado_persistente.pl
├── data/
│   ├── registro_partidas.pl
│   └── partidas guardadas (.sav)
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   └── Game.jsx
    │   ├── components/
    │   │   ├── StartCard.jsx
    │   │   └── game/
    │   │       ├── MapaVisual.jsx
    │   │       ├── ControlPanel.jsx
    │   │       └── TerminalConsole.jsx
    │   └── services/
    │       ├── api.js
    │       └── parserProlog.js
    └── package.json
```

---

## Componentes principales

### Backend Prolog

- `main.pl`: punto de entrada que carga los módulos del juego.
- `backend/datos.pl`: datos estáticos del mundo y sus relaciones.
- `backend/estado.pl`: estado dinámico de la partida.
- `backend/logica.pl`: ensamblador de la lógica del sistema.
- `backend/logica_base.pl`: reglas base y validaciones comunes.
- `backend/logica_acciones.pl`: acciones que alteran el estado.
- `backend/logica_consultas.pl`: consultas, rutas y victoria.
- `backend/persistencia.pl`: guardado y carga de partidas.
- `backend/registro.pl`: registro de partidas por jugador.

### Controller Node + Prolog

- `controller/server.js`: servidor Express.
- `controller/rutas_api.js`: rutas HTTP de la API.
- `controller/ejecutor_prolog.js`: ejecución de metas Prolog.
- `controller/servicio_prolog_api.js`: traducción de resultados para la API.
- `controller/traductor.pl`: capa de traducción entre API y lógica.

### Frontend

- `frontend/src/pages/Home.jsx`: pantalla de inicio.
- `frontend/src/pages/Game.jsx`: pantalla principal de juego.
- `frontend/src/components/game/MapaVisual.jsx`: visualización del mapa.
- `frontend/src/components/game/ControlPanel.jsx`: panel de acciones.
- `frontend/src/components/game/TerminalConsole.jsx`: bitácora de misión.
- `frontend/src/services/api.js`: cliente HTTP para consumir la API.

---

## Características técnicas

- Hechos y reglas en Prolog.
- Backtracking para exploración de estados y rutas.
- Recursividad para consultas sobre el mundo del juego.
- Base dinámica con `assert/retract`.
- Persistencia de partidas y registro de sesiones.
- Interfaz web desacoplada mediante una API HTTP.

---

## Interfaz gráfica

La interfaz web se encuentra en desarrollo y ya incluye:

- Pantalla de inicio con selección de jugador.
- Vista principal de misión.
- Mapa visual de módulos y conexiones.
- Panel de control para acciones del jugador.
- Consola de bitácora con eventos de la partida.

---

## Requisitos

- SWI-Prolog.
- Node.js 18 o superior.
- npm.

---

## Ejecución

### 1. Inicializar la lógica Prolog

Desde la raíz del proyecto:

```bash
swipl
```

Luego cargar el punto de entrada:

```prolog
?- [main].
```

### 2. Levantar el servidor de API

En otra terminal:

```bash
cd controller
npm install
npm start
```

El servidor queda disponible en `http://localhost:3000` por defecto.

### 3. Ejecutar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación web se abre normalmente en `http://localhost:5173`.

---

## API disponible

La capa `controller/` expone, entre otras, estas rutas:

- `GET /api/modulos`
- `GET /api/modulos_info`
- `GET /api/artefactos`
- `GET /api/conexiones`
- `GET /api/estado`
- `GET /api/registro`
- `GET /api/partida_actual`
- `POST /api/iniciar`
- `POST /api/mover`
- `POST /api/tomar`
- `POST /api/reparar`
- `POST /api/rescatar`
- `POST /api/guardar`
- `POST /api/cargar`
- `POST /api/ayuda`
- `POST /api/verificar`
- `POST /api/forzar_gane`

---

## Datos persistentes

- `data/registro_partidas.pl` almacena el registro de partidas.
- `data/*.sav` contiene partidas guardadas.
- `estado_actual.pl` y `controller/estado_persistente.pl` participan en la persistencia del estado entre ejecuciones.

---

## Licencia

Proyecto desarrollado únicamente con fines académicos para el curso de Lenguajes de Programación del Instituto Tecnológico de Costa Rica.

Operación Atlas © 2026

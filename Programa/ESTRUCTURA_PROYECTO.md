# Estructura Ordenada del Proyecto Atlas

## Entrada principal
- `main.pl`: carga todos los modulos de backend e inicializa estado y registro.
- `atlas.pl`: atajo para consultar `main.pl`.

## Backend Prolog (`backend/`)
- `datos.pl`: mundo estatico (modulos, enlaces, artefactos, objetivos).
- `estado.pl`: estado dinamico e inicializacion.
- `logica.pl`: ensamblador de logica modular.
- `logica_base.pl`: validaciones base y reglas comunes.
- `logica_acciones.pl`: acciones que cambian estado (mover, tomar, reparar, rescatar).
- `logica_consultas.pl`: consultas, rutas y victoria.
- `persistencia.pl`: guardar y cargar partida.
- `registro.pl`: registro de partidas por jugador.
- `ayudas.pl`: utilidades de normalizacion de datos.

## Controller Node + Prolog (`controller/`)
- `server.js`: arranque de Express y middlewares.
- `rutas_api.js`: endpoints REST.
- `servicio_prolog_api.js`: ejecucion de metas Prolog y mensajes de error amigables.
- `ejecutor_prolog.js`: llamada a SWI-Prolog.
- `traductor.pl`: capa UI entre API y logica del juego.
- `estado_persistente.pl`: persistencia de estado entre llamadas.

## Datos (`data/`)
- `registro_partidas.pl`: registro persistido de partidas.
- `partida_prueba_0.sav`: ejemplo de guardado.

## Frontend (`frontend/`)
- `src/pages/Home.jsx`: pantalla de bienvenida.
- `src/pages/Game.jsx`: pantalla principal de juego.
- `src/components/game/MapaVisual.jsx`: mapa y grafo de conexiones.
- `src/components/game/TerminalConsole.jsx`: bitacora.
- `src/components/game/ControlPanel.jsx`: acciones contextuales.
- `src/services/api.js`: cliente HTTP.
- `src/services/parserProlog.js`: parseo de respuestas Prolog.

## Limpieza recomendada
- `frontend/dist/` y `frontend/.vite/` son generados: se pueden borrar sin afectar el codigo fuente.
- `frontend/node_modules/` se reinstala con `npm install`.

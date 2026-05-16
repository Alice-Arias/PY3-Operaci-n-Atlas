<div align="center">

# Proyecto 3 — Operación Atlas

![Lenguaje](https://img.shields.io/badge/Lenguaje-Prolog-1f425f.svg)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/Versión-1.0-orange)
![Licencia](https://img.shields.io/badge/Licencia-Académico-lightgrey)

### Aventura espacial basada en lógica declarativa y Prolog

Sistema desarrollado en **Prolog** para simular una aventura espacial donde el jugador deberá recorrer una estación orbital, reparar sistemas críticos y rescatar tripulantes utilizando inferencia lógica y backtracking.

</div>

---

<div align="center">

# Integrantes

| Nombre |
|---|
| Alice Arias Salazar |
| Heldys Aguero Espinosa |
| Yeremi Calvo Porras |

</div>

---

<div align="center">

# Información académica

| Campo | Información |
|---|---|
| Curso | Lenguajes de Programación |
| Grupo | GR 60 |
| Semestre | I Semestre, 2026 |
| Proyecto | Proyecto Programado #3 |
| Fecha de entrega | 01/06/2026 |
| Estado | En desarrollo |

</div>

---

<div align="center">

# Descripción

Operación Atlas es un juego de aventura espacial desarrollado completamente en Prolog.

El jugador deberá recorrer la estación Aurora, reparar sistemas, recolectar artefactos y rescatar tripulantes.

---

</div>

# Objetivo del juego

- Restaurar sistemas críticos  
- Reparar energía y comunicaciones  
- Rescatar tripulantes  
- Acceder a módulos restringidos  
- Cumplir condiciones de victoria  

---

# Funcionalidades

## Navegación
- Movimiento entre módulos
- Validación de rutas
- Backtracking
- Registro de módulos visitados

## Gestión de artefactos
- Recolección
- Inventario
- Uso de objetos
- Desbloqueo de módulos

## Sistemas
- Reparación
- Validación de requisitos
- Dependencias

## Rescate
- Tripulantes atrapados
- Condiciones de rescate

## Consultas
- Inventario
- Ubicación de objetos
- Estado del juego

---

<div align="center">

# Predicados principales

| Predicado | Función |
|---|---|
| tomar/1 | Recoger artefactos |
| usar/1 | Usar artefactos |
| mover/1 | Moverse entre módulos |
| puedo_ir/1 | Validar movimiento |
| reparar/1 | Reparar sistemas |
| rescatar/1 | Rescatar tripulantes |
| ruta/3 | Encontrar caminos |
| que_tengo/0 | Inventario |
| modulos_visitados/0 | Historial |
| verifica_gane/0 | Verificar victoria |
| como_gano/0 | Sugerencia |

</div>

---

# Características técnicas

- Hechos y reglas en Prolog  
- Backtracking  
- Recursividad  
- Base dinámica (`assert/retract`)  
- Predicados dinámicos  
- Interacción por consola  

---

# Interfaz gráfica (en desarrollo)

- Visualización de módulos  
- Inventario del jugador  
- Acciones mediante botones  
- Estados del sistema  
- Integración con Prolog  

---

# Estructura del proyecto

```text
PP3/
├── documentacion/
│   └── Documentacion.pdf
├── programa/
│   ├── ...
└── info.txt
```

---

# Ejecución

```bash
swipl
```

```prolog
['.pl'].
```

```prolog
.
```

---

<div align="center">

# Licencia

Proyecto desarrollado únicamente con fines académicos para el curso de Lenguajes de Programación del Instituto Tecnológico de Costa Rica.

Operación Atlas © 2026

</div>

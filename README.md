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

# Integrantes

| Nombre |
|---|
| **Alice Arias Salazar** |
| **Heldys Aguero Espinosa** |
| **Yeremi Calvo Porras** |

---

# Información académica

| Campo | Información |
|---|---|
| **Curso** | Lenguajes de Programación |
| **Grupo** | GR 60 |
| **Semestre** | I Semestre, 2026 |
| **Proyecto** | Proyecto Programado #3 |
| **Fecha de entrega** | 01/06/2026 |
| **Estado** | En desarrollo |

---

# Descripción

**Operación Atlas** es un juego de aventura espacial desarrollado completamente en **Prolog**, donde el jugador asume el papel del ingeniero principal de la estación orbital **Aurora**.

Luego de una tormenta solar, varios módulos quedaron aislados y múltiples sistemas críticos dejaron de funcionar. El jugador deberá:

- Reparar sistemas
- Resolver restricciones lógicas
- Recolectar artefactos
- Desbloquear módulos
- Rescatar tripulantes
- Restaurar la estación espacial

El proyecto aplica conceptos fundamentales del paradigma lógico como:

- Hechos
- Reglas
- Inferencia lógica
- Backtracking
- Recursividad
- Estados dinámicos
- Consultas declarativas

---

# Objetivo del juego

El objetivo principal es restaurar completamente la estación espacial cumpliendo condiciones lógicas específicas.

## Objetivos principales

- Restaurar sistemas críticos
- Reparar energía y comunicaciones
- Rescatar tripulantes atrapados
- Acceder a módulos restringidos
- Cumplir todas las condiciones de victoria

---

# Funcionalidades

## Navegación

- Movimiento entre módulos conectados
- Validación de rutas disponibles
- Restricciones de acceso
- Registro de módulos visitados
- Búsqueda de rutas mediante backtracking

---

## Gestión de artefactos

- Recolección de artefactos
- Inventario dinámico
- Uso de objetos especiales
- Desbloqueo de módulos

---

## Sistemas reparables

- Reparación de sistemas críticos
- Validación de requisitos
- Cambio dinámico de estados
- Dependencias entre sistemas

---

## Rescate de tripulación

- Rescate de tripulantes atrapados
- Verificación de condiciones necesarias
- Actualización dinámica de estados

---

## Sistema de consultas

- Consulta de inventario
- Consulta de ubicación de artefactos
- Consulta de módulos visitados
- Verificación de objetivos pendientes
- Verificación de condiciones de victoria

---

# Predicados principales

| Predicado | Función |
|---|---|
| `tomar/1` | Permite recoger artefactos |
| `usar/1` | Permite usar artefactos |
| `mover/1` | Permite desplazarse entre módulos |
| `puedo_ir/1` | Valida si un movimiento es válido |
| `reparar/1` | Restaura sistemas dañados |
| `rescatar/1` | Rescata tripulantes |
| `ruta/3` | Encuentra rutas entre módulos |
| `que_tengo/0` | Muestra inventario |
| `modulos_visitados/0` | Muestra historial recorrido |
| `verifica_gane/0` | Verifica condiciones de victoria |
| `como_gano/0` | Sugiere cómo completar el juego |

---

# Características técnicas

<div align="center">

| Característica | Estado |
|---|---|
| Uso de hechos y reglas | 
| Base dinámica (`assert/retract`) | 
| Backtracking | 
| Recursividad | 
| Predicados dinámicos | 
| Interacción por consola | 
| Modelo declarativo |

</div>

---

# Interfaz gráfica (en desarrollo)

El sistema contará con una interfaz gráfica que permitirá:

- Visualizar módulos
- Mostrar inventario
- Facilitar interacción del usuario
- Ejecutar acciones mediante botones
- Mostrar estados del juego
- Integrar Prolog con una interfaz visual

*(Tecnología aún por definir)*

---

# Estructura general del proyecto

```text
PP3/
│
├── documentacion/
│   └── Documentacion.pdf
│
├── programa/
│   ├── 
│   ├── 
│   └── 
│
└── info.txt
```


# Ejecución

## Requisitos

- SWI-Prolog instalado
- Consola compatible con Prolog

---

## Ejecutar el proyecto

```bash
swipl
```

---

## Cargar el archivo principal

```prolog
[' .pl'].
```

---

## Iniciar el juego

```prolog
 .
```



# Licencia

<div align="center">

Proyecto desarrollado únicamente con fines académicos para el curso de **Lenguajes de Programación** del **Instituto Tecnológico de Costa Rica**.

Operación Atlas © 2026

</div>

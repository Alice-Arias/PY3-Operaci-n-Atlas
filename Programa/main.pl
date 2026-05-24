% Archivo principal del proyecto.
% Descripcion: junta todos los modulos para que el juego quede listo.
% Entrada: no recibe datos, solo se consulta al arrancar.
% Salida: carga todo el juego en memoria.
% Restricciones: debe usarse como punto de entrada.

:- consult('backend/datos.pl').
:- consult('backend/ayudas.pl').
:- consult('backend/estado.pl').
:- consult('backend/logica.pl').
:- consult('backend/persistencia.pl').
:- consult('backend/registro.pl').

:- initialization(estado_inicial).
:- initialization(cargar_registro_partidas).

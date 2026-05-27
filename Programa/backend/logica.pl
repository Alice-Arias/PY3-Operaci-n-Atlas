% Capa de ensamblado de logica de juego.
% Mantiene las mismas consultas publicas que usaba el resto del sistema,
% pero divide responsabilidades en archivos mas faciles de mantener.

:- consult('logica_base.pl').
:- consult('logica_acciones.pl').
:- consult('logica_consultas.pl').

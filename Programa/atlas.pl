% Archivo de arranque alternativo del proyecto.
% Descripcion: delega la carga principal al punto de entrada real del juego.
% Entrada: no recibe datos; se consulta al abrir este archivo.
% Salida: carga el bootstrap definido en main.pl.
% Restricciones: no contiene logica de negocio, solo redireccion de carga.

:- consult('main.pl').

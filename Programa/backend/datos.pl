% Archivo con los datos fijos del juego.
% Descripcion: aqui van los nombres y datos que no cambian durante la partida.
% Entrada: no recibe datos, solo se consulta al cargar el proyecto.
% Salida: deja disponibles los hechos del mapa, objetos y objetivos.
% Restricciones: estos hechos no deben modificarse al jugar.

% Archivo por defecto para guardar una partida si no hay nombre de jugador.
% Entrada: ninguna.
% Salida: ruta del archivo por defecto.
% Restricciones: la ruta debe existir o poder crearse.

archivo_partida_por_defecto('data/partida_atlas.sav').

% Archivo donde se guarda el registro de partidas de todos los jugadores.
% Entrada: ninguna.
% Salida: ruta del registro persistente.
% Restricciones: debe apuntar a la carpeta de guardados.

archivo_registro_partidas('data/registro_partidas.pl').

modulo(puente_mando, "Centro principal de la estacion.").
modulo(laboratorio, "Laboratorio cientifico parcialmente destruido.").
modulo(modulo_energia, "Modulo encargado del suministro energetico.").
modulo(enfermeria, "Area medica de emergencia.").
modulo(modulo_escape, "Zona de evacuacion orbital.").
modulo(centro_comunicaciones, "Nucleo de comunicaciones de la estacion.").
modulo(camaras_seguridad, "Zona de monitoreo y acceso restringido.").
modulo(modulo_medico, "Modulo medico auxiliar.").
modulo(almacen, "Almacen de suministros y herramientas."). % Modulo adicional para expandir el mapa
modulo(sala_ingenieria, "Sala de ingenieria con herramientas y recursos."). % Modulo adicional para expandir el mapa
modulo(bodega, "Bodega de carga con suministros y equipo."). % Modulo adicional para expandir el mapa

enlace(puente_mando, laboratorio).
enlace(laboratorio, modulo_energia).
enlace(puente_mando, enfermeria).
enlace(enfermeria, modulo_escape).
enlace(modulo_energia, centro_comunicaciones).
enlace(centro_comunicaciones, modulo_escape).
enlace(enfermeria, modulo_medico).
enlace(puente_mando, camaras_seguridad).
enlace(camaras_seguridad, modulo_medico).
enlace(laboratorio, sala_ingenieria). % Enlace adicional para expandir
enlace(sala_ingenieria, almacen). % Enlace adicional para expandir
enlace(almacen, bodega). % Enlace adicional para expandir
enlace(bodega, centro_comunicaciones). % Enlace adicional para expandir

artefacto(traje_espacial, enfermeria).
artefacto(fusible, laboratorio).
artefacto(tarjeta_seguridad, puente_mando).
artefacto(energia, modulo_energia).
artefacto(comunicaciones, centro_comunicaciones).
artefacto(medicina, modulo_medico).
artefacto(herramientas, sala_ingenieria). % Artefacto adicional para expandir
artefacto(suministros, bodega). % Artefacto adicional para expandir
artefacto(equipo_rescate, almacen). % Artefacto adicional para expandir


sistema_inicial(modulo_energia, energia, [fusible], fallo).
sistema_inicial(laboratorio, comunicaciones, [traje_espacial, fusible], fallo).
sistema_inicial(modulo_escape, escape, [energia], fallo).
sistema_inicial(centro_comunicaciones, comunicaciones, [energia], fallo).
sistema_inicial(modulo_medico, medicina, [medicina], fallo).


tripulante_inicial(elena, modulo_energia, [energia], atrapado).
tripulante_inicial(kai, enfermeria, [energia], atrapado).
tripulante_inicial(marcus, laboratorio, [comunicaciones], atrapado).
tripulante_inicial(sophia, camaras_seguridad, [tarjeta_seguridad], rescatado).
tripulante_inicial(ryan, sala_ingenieria, [herramientas], atrapado). % Tripulante adicional para expandir
tripulante_inicial(laura, bodega, [suministros], atrapado). % Tripulante adicional para expandir
tripulante_inicial(alex, almacen, [equipo_rescate], atrapado). % Tripulante adicional para expandir

necesita(modulo_energia, traje_espacial).
necesita(camaras_seguridad, tarjeta_seguridad).
necesita(modulo_escape, energia).
necesita(centro_comunicaciones, energia).
necesita(modulo_medico, medicina).
necesita(sala_ingenieria, herramientas). % Requisito adicional para expandir
necesita(bodega, suministros). % Requisito adicional para expandir

% El módulo médico originalmente listaba 'medicina' como requisito para acceder,
% lo cual generaba una condición circular (no se puede obtener la medicina sin
% entrar al módulo). Quitamos esa restricción para que el jugador pueda entrar
% desde `enfermeria` y tomar la medicina.
% necesita(modulo_medico, medicina).

necesita_estado(modulo_escape, energia, restaurado).
necesita_estado(centro_comunicaciones, comunicaciones, restaurado).
necesita_estado(modulo_medico, medicina, restaurado).
necesita_estado(sala_ingenieria, herramientas, restaurado). % Requisito adicional para expandir
% El módulo médico solo requiere el artefacto `medicina` para acceder.
% Evitamos requerir un "estado" inexistente asociado a 'medicina'.
% necesita_estado(modulo_medico, medicina, restaurado).

paso_previo(modulo_escape, modulo_energia).
paso_previo(centro_comunicaciones, modulo_energia).
paso_previo(modulo_medico, modulo_energia).
paso_previo(sala_ingenieria, modulo_energia).
paso_previo(modulo_medico, camaras_seguridad).
paso_previo(sala_ingenieria, laboratorio).
paso_previo(almacen, sala_ingenieria).

objetivo_sistema(energia, restaurado).
objetivo_sistema(comunicaciones, restaurado).
objetivo_tripulante(elena, rescatado).
objetivo_tripulante(kai, rescatado).
objetivo_tripulante(sophia, rescatado).

% Estado inicial del jugador.
% Entrada: ninguna.
% Salida: define el modulo inicial, inventario vacio y primer modulo visitado.
% Restricciones: estos hechos sirven como plantilla para `estado_inicial/0`.

jugador_inicial(puente_mando).
inventario_inicial([]).
visitado_inicial(puente_mando).
usado_inicial(_) :- fail.
tomado_inicial(_) :- fail.

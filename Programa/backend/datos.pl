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

enlace(puente_mando, laboratorio).
enlace(laboratorio, modulo_energia).
enlace(puente_mando, enfermeria).
enlace(enfermeria, modulo_escape).
enlace(modulo_energia, centro_comunicaciones).
enlace(centro_comunicaciones, modulo_escape).
enlace(enfermeria, modulo_medico).
enlace(puente_mando, camaras_seguridad).

artefacto(traje_espacial, enfermeria).
artefacto(fusible, laboratorio).
artefacto(tarjeta_seguridad, puente_mando).
artefacto(energia, modulo_energia).
artefacto(comunicaciones, centro_comunicaciones).
artefacto(medicina, modulo_medico).

sistema_inicial(modulo_energia, energia, [fusible], fallo).
sistema_inicial(laboratorio, comunicaciones, [traje_espacial, fusible], fallo).
sistema_inicial(modulo_escape, escape, [energia], fallo).

tripulante_inicial(elena, modulo_energia, [energia], atrapado).
tripulante_inicial(kai, enfermeria, [energia], atrapado).
tripulante_inicial(marcus, laboratorio, [comunicaciones], atrapado).
tripulante_inicial(sophia, camaras_seguridad, [tarjeta_seguridad], atrapado).

necesita(modulo_energia, traje_espacial).
necesita(camaras_seguridad, tarjeta_seguridad).
necesita(modulo_escape, energia).
necesita(centro_comunicaciones, energia).
% El módulo médico originalmente listaba 'medicina' como requisito para acceder,
% lo cual generaba una condición circular (no se puede obtener la medicina sin
% entrar al módulo). Quitamos esa restricción para que el jugador pueda entrar
% desde `enfermeria` y tomar la medicina.
% necesita(modulo_medico, medicina).

necesita_estado(modulo_escape, energia, restaurado).
necesita_estado(centro_comunicaciones, comunicaciones, restaurado).
% El módulo médico solo requiere el artefacto `medicina` para acceder.
% Evitamos requerir un "estado" inexistente asociado a 'medicina'.
% necesita_estado(modulo_medico, medicina, restaurado).

paso_previo(modulo_escape, modulo_energia).
paso_previo(centro_comunicaciones, modulo_energia).

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

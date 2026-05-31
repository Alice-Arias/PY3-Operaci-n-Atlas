jugador(centro_comunicaciones).
artefactosLogrados([tarjeta_seguridad,fusible,traje_espacial,energia,medicina,comunicaciones]).
tomado(tarjeta_seguridad).
tomado(fusible).
tomado(traje_espacial).
tomado(energia).
tomado(medicina).
tomado(comunicaciones).
visitado(puente_mando).
visitado(camaras_seguridad).
visitado(laboratorio).
visitado(enfermeria).
visitado(modulo_energia).
visitado(centro_comunicaciones).
visitado(modulo_escape).
visitado(modulo_medico).
sistema(modulo_energia, energia, [fusible], restaurado).
sistema(laboratorio, comunicaciones, [traje_espacial,fusible], restaurado).
sistema(modulo_escape, escape, [energia], restaurado).
tripulante(kai, enfermeria, [energia], rescatado).
tripulante(elena, modulo_energia, [energia], rescatado).
tripulante(marcus, laboratorio, [comunicaciones], rescatado).
jugador_nombre('Ali').
partida_actual(11).

jugador(modulo_energia).
artefactosLogrados([tarjeta_seguridad,traje_espacial,fusible]).
tomado(tarjeta_seguridad).
tomado(traje_espacial).
tomado(fusible).
visitado(puente_mando).
visitado(enfermeria).
visitado(camaras_seguridad).
visitado(laboratorio).
visitado(modulo_energia).
sistema(modulo_energia, energia, [fusible], fallo).
sistema(modulo_escape, escape, [energia], fallo).
sistema(centro_comunicaciones, comunicaciones, [energia], fallo).
sistema(modulo_medico, medicina, [medicina], fallo).
sistema(laboratorio, comunicaciones, [traje_espacial,fusible], restaurado).
tripulante(elena, modulo_energia, [energia], atrapado).
tripulante(kai, enfermeria, [energia], atrapado).
tripulante(sophia, camaras_seguridad, [tarjeta_seguridad], rescatado).
tripulante(ryan, sala_ingenieria, [herramientas], atrapado).
tripulante(laura, bodega, [suministros], atrapado).
tripulante(alex, almacen, [equipo_rescate], atrapado).
tripulante(marcus, laboratorio, [comunicaciones], rescatado).
jugador_nombre('Susana').
partida_actual(12).

// Script de prueba para comprobar si un modulo es alcanzable desde la posicion actual.
// Ayuda a validar reglas de navegacion del motor Prolog.

const { correrProlog } = require('./ejecutor_prolog');
const meta = "cargar_partida('data/partida_ali_5.sav'), (puedo_ir(modulo_medico) -> format('SI') ; format('NO'))";
const r = correrProlog(meta);
if (r.ok) console.log(r.out);
else console.error('ERROR:', r.err);

const { correrProlog } = require('./ejecutor_prolog');
const meta = "cargar_partida('data/partida_ali_5.sav'), (puedo_ir(modulo_medico) -> format('SI') ; format('NO'))";
const r = correrProlog(meta);
if (r.ok) console.log(r.out);
else console.error('ERROR:', r.err);

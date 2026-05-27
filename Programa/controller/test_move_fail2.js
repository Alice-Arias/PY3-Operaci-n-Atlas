const { correrProlog } = require('./ejecutor_prolog');
const meta = "cargar_partida('data/partida_ali_5.sav'), mover(centro_comunicaciones)";
const r = correrProlog(meta);
if (r.ok) console.log('OK:', r.out);
else console.error('ERR:', r.err);

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './StartCard.css';

// Nombre: StartCard
// Descripcion: permite iniciar una partida nueva o continuar una guardada.
// Entrada: no recibe props.
// Salida: formulario inicial con nombre y selector de misiones.
// Restricciones: requiere conexión con el backend para consultar partidas.
// Objetivo: ser la puerta de entrada a la experiencia de juego.
function StartCard() {
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [misionesDelJugador, setMisionesDelJugador] = useState([]);
  const [idSeleccionado, setIdSeleccionado] = useState('');
    const navigate = useNavigate();

    const minLargoNombre = nombre.length < 3;
  const nombreNormalizado = nombre.trim();

  useEffect(() => {
    let cancelado = false;

    if (nombreNormalizado.length < 3) {
      setMisionesDelJugador([]);
      setIdSeleccionado('');
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setCargandoPendientes(true);
      try {
        const registros = await apiService.obtenerRegistroPartidas();
        const nombreBuscado = nombreNormalizado.toLowerCase();
        const misiones = registros.filter((registro) => String(registro.jugador || '').toLowerCase() === nombreBuscado);
        if (cancelado) return;
        setMisionesDelJugador(misiones);
        setIdSeleccionado((actual) => {
          if (actual && misiones.some((mision) => String(mision.idPartida) === String(actual))) {
            return actual;
          }
          return misiones.length === 1 ? String(misiones[0].idPartida) : '';
        });
      } catch {
        if (!cancelado) {
          setMisionesDelJugador([]);
          setIdSeleccionado('');
        }
      } finally {
        if (!cancelado) setCargandoPendientes(false);
      }
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [nombreNormalizado]);

  const puedeContinuar = useMemo(() => misionesDelJugador.length > 0 && !loading && !cargandoPendientes, [misionesDelJugador.length, loading, cargandoPendientes]);

    const handleStartGame = async () => {
        if (minLargoNombre) return;
        setLoading(true);
    setMensajeError('');
        try {
      const response = await apiService.iniciarSimulacion(nombreNormalizado);
      navigate('/game', { state: { nombre: nombreNormalizado, registroInicial: response.out } });
        } catch (error) {
            console.error("Error conectando con el Nexo Central:", error);
            setMensajeError('No hay conexion con el servidor del juego. Inicia el backend en controller y vuelve a intentar.');
        } finally {
            setLoading(false);
        }
    };

  const handleContinuarMision = async () => {
    if (!idSeleccionado) return;
    setLoading(true);
    setMensajeError('');
    try {
      const response = await apiService.cargarMision(idSeleccionado);
      navigate('/game', { state: { nombre: nombreNormalizado, registroInicial: response.out, partidaId: idSeleccionado } });
    } catch (error) {
      console.error('Error reanudando la misión:', error);
      setMensajeError('No se pudo continuar la misión seleccionada. Verifica que exista y vuelve a intentar.');
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="start-card">
        <input
          className="name-input"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="IDENTIFIQUE SU OPERARIO"
          disabled={loading}
        />

        {nombre.length > 0 && nombre.length < 3 && (
          <p className="input-warning">
            MÍNIMO 3 CARACTERES REQUERIDOS
          </p>
        )}

        {mensajeError && (
          <p className="input-error-box">{mensajeError}</p>
        )}

        {nombreNormalizado.length >= 3 && (
          <div className="pending-box">
            <div className="pending-title">
              {cargandoPendientes ? 'Buscando misiones guardadas...' : misionesDelJugador.length > 0 ? `Okey, tenemos ${misionesDelJugador.length} ${misionesDelJugador.length === 1 ? 'misión guardada' : 'misiones guardadas'} para este operario.` : 'No hay misiones guardadas para este operario.'}
            </div>

            {misionesDelJugador.length > 1 && (
              <div className="pending-select-wrap">
                <label className="pending-label" htmlFor="mission-select">Elige cuál continuar</label>
                <select
                  id="mission-select"
                  className="pending-select"
                  value={idSeleccionado}
                  onChange={(e) => setIdSeleccionado(e.target.value)}
                  disabled={loading || cargandoPendientes}
                >
                  <option value="">Selecciona una misión guardada</option>
                  {misionesDelJugador.map((mision) => (
                    <option key={mision.idPartida} value={mision.idPartida}>
                      Partida #{mision.idPartida} - {mision.estado}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <button
          className="start-button"
          disabled={minLargoNombre || loading}
          onClick={handleStartGame}
        >
          {loading ? "ESTABLECIENDO ENLACE..." : "INICIAR OPERACIÓN ATLAS"}
        </button>
        <button className="load-button" disabled={!puedeContinuar || !idSeleccionado} onClick={handleContinuarMision}>
          {cargandoPendientes ? 'BUSCANDO...' : 'CONTINUAR MISIÓN'}
        </button>
      </div>
    );
}

export default StartCard;
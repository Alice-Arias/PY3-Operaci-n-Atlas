import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartCard.css';

function StartCard() {
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const minLargoNombre = nombre.length < 3;

    const handleStartGame = async () => {
        if (minLargoNombre) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/iniciar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre: nombre.trim() }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Navegamos al tablero pasándole el nombre y la bitácora inicial
                navigate("/game", { state: { nombre: nombre.trim(), registroInicial: data.out } });
            } else {
                alert("Error de contingencia al inicializar Prolog: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            console.error("Error conectando con el Nexo Central:", error);
            alert("No se pudo conectar con el servidor Backend. Asegúrate de tener la Terminal 2 encendida.");
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

        <button
          className="start-button"
          disabled={minLargoNombre || loading}
          onClick={handleStartGame}
        >
          {loading ? "ESTABLECIENDO ENLACE..." : "INICIAR OPERACIÓN ATLAS"}
        </button>
        <button className="load-button" disabled={true}>
          REANUDAR MISIÓN
        </button>
      </div>
    );
}

export default StartCard;
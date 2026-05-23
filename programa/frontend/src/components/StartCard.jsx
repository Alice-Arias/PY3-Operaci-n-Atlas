import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './StartCard.css'

function StartCard() {
    const [nombre, setNombre] = useState('');
    const navigate = useNavigate();

    const minLargoNombre = nombre.length < 3;

    const existNombre = false;

    return (
      <div className="start-card">
        <input
          className="name-input"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Add your name"
        />

        {nombre.length > 0 && nombre.length < 3 && (
          <p className="input-warning">
            MIN 3 CHARACTERS
          </p>
        )}

        <button
          className="start-button"
          disabled={minLargoNombre}
          onClick={() => navigate("/game", { state: { nombre } })}
        >
          Start New Operation
        </button>
        <button className="load-button" disabled={!existNombre}>
          Load Operation
        </button>
      </div>
    );
};

export default StartCard
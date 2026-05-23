import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import "./Game.css";

function Game() {

    const location = useLocation();
    const nombre = location.state?.nombre;

    const [moduloActual, setModuloActual] = useState("puente_mando");
    const [inventario, setInventario] = useState("");
    const [mensaje, setMensaje] = useState("");

    // =========================
    // INVENTARIO
    // =========================
    const cargarInventario = () => {
        fetch("http://localhost:3001/inventario")
            .then(res => res.json())
            .then(data => setInventario(data.data));
    };

    // =========================
    // MOVIMIENTO
    // =========================
    const mover = (destino) => {
        fetch("http://localhost:3001/mover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destino })
        })
        .then(res => res.json())
        .then(() => {
            setModuloActual(destino);
            setMensaje("Movimiento ejecutado");
        });
    };

    // =========================
    // TOMAR
    // =========================
    const tomar = (artefacto) => {
        fetch("http://localhost:3001/tomar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artefacto })
        })
        .then(() => {
            setMensaje(`Tomaste ${artefacto}`);
            cargarInventario();
        });
    };

    useEffect(() => {
        cargarInventario();
    }, []);

    return (
        <div className='game'>

            {/* TOP */}
            <div className='top'>
                <Header />
            </div>

            {/* MID */}
            <div className='mid'>

                <h2>Jugador: {nombre}</h2>
                <h3>Módulo actual: {moduloActual}</h3>

                <p className="msg">{mensaje}</p>

                <hr />

                <h3>Acciones</h3>

                <button onClick={() => mover("laboratorio")}>
                    Ir a Laboratorio
                </button>

                <button onClick={() => mover("enfermeria")}>
                    Ir a Enfermería
                </button>

                <button onClick={() => mover("modulo_energia")}>
                    Ir a Energía
                </button>

                <hr />

                <button onClick={() => tomar("fusible")}>
                    Tomar Fusible
                </button>

                <button onClick={() => tomar("traje_espacial")}>
                    Tomar Traje
                </button>

            </div>

            {/* BOTTOM */}
            <div className='bottom'>
                <h3>Inventario</h3>
                <p>{inventario}</p>
            </div>

        </div>
    );
}

export default Game;
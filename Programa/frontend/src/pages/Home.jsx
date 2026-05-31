import { useEffect } from 'react'
import './Home.css'
import StartCard from '../components/StartCard'

// Nombre: Home
// Descripcion: compone la pantalla inicial con portada y tarjeta de arranque.
// Entrada: no recibe props.
// Salida: vista de bienvenida y acceso a iniciar o continuar partida.
// Restricciones: usa un efecto para reiniciar la posicion visual al entrar.
// Objetivo: ofrecer una portada simple y clara antes de jugar.
function Home() {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [])

    return (
        <div className='home'>
            <div className="title">
                <p className="subtitle">SYSTEM FAILURE DETECTED</p>

                <h1 data-text="ATLAS">ATLAS</h1>
            </div>

            <div className='options-card'>
                <StartCard />
            </div>
        </div>
    )
}

export default Home
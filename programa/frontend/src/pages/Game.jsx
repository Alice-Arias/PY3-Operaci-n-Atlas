import Header from '../components/Header';
import './Game.css'

function Game() {
    return(
        <div className='game'>
            <div className='top'>
                <Header />
            </div>
            <div className='mid'>
                <h1>Pantalla de juego aquí</h1>    
            </div>
            <div className='bottom'>
                <h2>Footer aquí</h2>
            </div>
        </div>
    )
};

export default Game;
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Game from './pages/Game'

// Nombre: App
// Descripcion: define el enrutamiento principal de la aplicacion.
// Entrada: no recibe props.
// Salida: rutas hacia la pantalla de inicio y la pantalla de juego.
// Restricciones: depende de React Router para resolver las vistas.
// Objetivo: mantener centralizada la navegacion de la SPA.
function App() {
  

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </>
  )
}

export default App

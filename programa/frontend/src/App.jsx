import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import Game from './pages/Game'

function App() {
  const location = useLocation()

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Game" element={<Game />} />
      </Routes>
    </>
  )
}

export default App

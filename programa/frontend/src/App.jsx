import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'

function App() {
  const location = useLocation()

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}

export default App

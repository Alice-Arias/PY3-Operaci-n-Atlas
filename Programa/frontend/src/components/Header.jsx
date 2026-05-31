import { useNavigate } from 'react-router-dom'
import './Header.css'

// Nombre: Header
// Descripcion: muestra el encabezado visual con el logo de Atlas.
// Entrada: no recibe props.
// Salida: barra superior con logo clicable.
// Restricciones: depende del navegador para cambiar de ruta.
// Objetivo: dar identidad visual y un acceso rapido al inicio.
function Header() {
  const navigate = useNavigate()

  return (
    <div className="header-simple">
      <div className="logo-container">
        <img
          src="/Atlas-logo.png" alt="Atlas Logo"
          className="logo-atlas"
          onClick={() => navigate('/')}
        />
      </div>
    </div>
  )
}

export default Header
import { useNavigate } from 'react-router-dom'
import './Header.css'

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
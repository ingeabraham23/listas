import { Link, useLocation } from "react-router-dom";
import { FaClipboardList, FaHome } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <FaClipboardList />
        <span>Mis Listas</span>
      </Link>

      <nav className="navbar-links">
        <Link
          to="/"
          className={location.pathname === "/" ? "activo" : ""}
        >
          <FaHome />
          <span>Inicio</span>
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
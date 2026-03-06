import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">⚙ FlowRPA</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/workflows" className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
            Workflows
          </NavLink>
          <Link to="/workflow-builder" className="sidebar-create">
            ▷ Crear Workflow
          </Link>
        </nav>
      </div>
      <div className="sidebar-footer">
        <div className="muted">Usuario</div>
        <div className="strong">Usuario Demo</div>
        <div className="muted">demo@flowrpa.com</div>
        <button className="sidebar-logout">↳ Cerrar Sesión</button>
      </div>
    </aside>
  );
}

export default Sidebar;
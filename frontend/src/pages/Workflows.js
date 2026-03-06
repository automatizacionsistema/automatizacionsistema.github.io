import { Link } from "react-router-dom";

function Workflows() {
  return (
    <div className="page workflows-page">
      <div className="page-head">
        <div>
          <h1>Workflows</h1>
          <p className="subtitle">Gestiona tus automatizaciones</p>
        </div>
        <Link to="/workflow-builder" className="btn-primary">
          + Nuevo Workflow
        </Link>
      </div>

      <section className="card empty-workflows">
        <div className="empty-icon">🤖</div>
        <h3>No tienes workflows todavía</h3>
        <p>Crea tu primer workflow automatizado</p>
        <Link to="/workflow-builder" className="btn-primary">
          + Crear Workflow
        </Link>
      </section>
    </div>
  );
}

export default Workflows;
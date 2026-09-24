function Dashboard() {
  return (
    <div>

      <div className="page-title">
        <h2>Dashboard</h2>

        <p>
          Resumen general del sistema inteligente
          de reconocimiento facial.
        </p>
      </div>

      <div className="dashboard-grid">

        <div className="kpi-card">
          <span>Personas registradas</span>
          <strong>0</strong>
        </div>

        <div className="kpi-card">
          <span>Reconocimientos</span>
          <strong>0</strong>
        </div>

        <div className="kpi-card">
          <span>Coincidencias</span>
          <strong>0</strong>
        </div>

        <div className="kpi-card">
          <span>Precisión</span>
          <strong>--</strong>
        </div>

      </div>

      <div className="card">

        <h3>
          Sistema de reconocimiento facial
        </h3>

        <p>
          Desde este sistema se podrán registrar
          personas, generar embeddings faciales,
          realizar reconocimientos y analizar
          posteriormente los resultados mediante
          Machine Learning.
        </p>

      </div>

    </div>
  );
}

export default Dashboard;
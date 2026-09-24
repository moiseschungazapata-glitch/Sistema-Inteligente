import {
  Activity,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Users,
} from "lucide-react";

function Dashboard() {
  return (
    <div className="page-view dashboard-view">
      <div className="page-title dashboard-title">
        <div>
          <span className="page-kicker">CENTRO DE CONTROL</span>
          <h2>Dashboard</h2>
          <p>
            Supervisa el estado del reconocimiento facial desde un solo lugar.
          </p>
        </div>

        <div className="page-title-badge">
          <span className="status-dot" />
          Sistema en línea
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-card kpi-card-blue">
          <div className="kpi-card-top">
            <span className="kpi-icon"><Users size={19} /></span>
            <span className="kpi-label">PERSONAS</span>
          </div>
          <strong>0</strong>
          <span className="kpi-description">Perfiles registrados</span>
        </div>

        <div className="kpi-card kpi-card-violet">
          <div className="kpi-card-top">
            <span className="kpi-icon"><ScanIcon /></span>
            <span className="kpi-label">PROCESOS</span>
          </div>
          <strong>0</strong>
          <span className="kpi-description">Reconocimientos realizados</span>
        </div>

        <div className="kpi-card kpi-card-green">
          <div className="kpi-card-top">
            <span className="kpi-icon"><CheckCircle2 size={19} /></span>
            <span className="kpi-label">COINCIDENCIAS</span>
          </div>
          <strong>0</strong>
          <span className="kpi-description">Identidades confirmadas</span>
        </div>

        <div className="kpi-card kpi-card-amber">
          <div className="kpi-card-top">
            <span className="kpi-icon"><Activity size={19} /></span>
            <span className="kpi-label">PRECISIÓN</span>
          </div>
          <strong>--</strong>
          <span className="kpi-description">Pendiente de evaluación</span>
        </div>
      </div>

      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="page-kicker">MOTOR DE INTELIGENCIA ARTIFICIAL</span>
          <h3>Reconocimiento facial seguro y medible</h3>
          <p>
            Registra identidades, genera embeddings faciales y analiza cada
            coincidencia con métricas claras.
          </p>

          <div className="hero-tags">
            <span><Fingerprint size={15} /> Embeddings faciales</span>
            <span><ShieldCheck size={15} /> Análisis protegido</span>
          </div>
        </div>

        <div className="dashboard-hero-visual" aria-hidden="true">
          <div className="hero-ring hero-ring-large" />
          <div className="hero-ring hero-ring-small" />
          <Fingerprint size={48} strokeWidth={1.4} />
        </div>
      </section>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" />
      <path d="M8 15c1.1 1 2.3 1.5 4 1.5s2.9-.5 4-1.5" />
    </svg>
  );
}

export default Dashboard;

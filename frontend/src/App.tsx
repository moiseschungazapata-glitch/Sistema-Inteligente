import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import RegistroFacial from "./pages/RegistroFacial";
import Reconocimiento from "./pages/Reconocimiento";
import Probabilidades from "./pages/Probabilidades";
import Historial from "./pages/Historial";

import "./App.css";

function App() {
  const [pagina, setPagina] = useState("dashboard");

  const renderizarPagina = () => {
    switch (pagina) {
      case "dashboard":
        return <Dashboard />;

      case "registro":
        return <RegistroFacial />;

      case "reconocimiento":
        return <Reconocimiento />;

      case "probabilidades":
        return <Probabilidades />;

      case "historial":
        return <Historial />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            IA
          </div>

          <div>
            <h2>Reconocimiento</h2>
            <span>Facial IA</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <button
            className={
              pagina === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={
              pagina === "registro"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("registro")}
          >
            Registro facial
          </button>

          <button
            className={
              pagina === "reconocimiento"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("reconocimiento")}
          >
            Reconocimiento
          </button>

          <button
            className={
              pagina === "probabilidades"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("probabilidades")}
          >
            Probabilidades
          </button>

          <button
            className={
              pagina === "historial"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("historial")}
          >
            Historial
          </button>

        </nav>

        <div className="sidebar-footer">
          <span>Sistema IA</span>
          <small>v1.0.0</small>
        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>Sistema Inteligente</h1>

            <p>
              Reconocimiento facial y análisis de probabilidades
            </p>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Sistema activo
          </div>

        </header>

        <section className="page-content">
          {renderizarPagina()}
        </section>

      </main>
    </div>
  );
}

export default App;
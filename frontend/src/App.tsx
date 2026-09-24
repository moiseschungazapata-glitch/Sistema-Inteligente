import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import RegistroFacial from "./pages/RegistroFacial";
import Reconocimiento from "./pages/Reconocimiento";
import Probabilidades from "./pages/Probabilidades";
import Historial from "./pages/Historial";

import "./App.css";

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cambiarPagina = (nuevaPagina: string) => {
    setPagina(nuevaPagina);
    setMenuAbierto(false);
  };

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
      <aside
        className={
          menuAbierto
            ? "sidebar sidebar-open"
            : "sidebar"
        }
      >

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
            onClick={() => cambiarPagina("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={
              pagina === "registro"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("registro")}
          >
            Registro facial
          </button>

          <button
            className={
              pagina === "reconocimiento"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("reconocimiento")}
          >
            Reconocimiento
          </button>

          <button
            className={
              pagina === "probabilidades"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("probabilidades")}
          >
            Probabilidades
          </button>

          <button
            className={
              pagina === "historial"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("historial")}
          >
            Historial
          </button>

        </nav>

        <div className="sidebar-footer">
          <span>Sistema IA</span>
          <small>v1.0.0</small>
        </div>

      </aside>

      {menuAbierto && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <main className="main-content">

        <header className="topbar">

          <button
            className="mobile-menu-button"
            aria-label={
              menuAbierto
                ? "Cerrar menú"
                : "Abrir menú"
            }
            onClick={() =>
              setMenuAbierto(!menuAbierto)
            }
          >
            {menuAbierto ? "×" : "☰"}
          </button>

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

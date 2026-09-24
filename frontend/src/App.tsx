import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  History,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ScanFace,
  Sun,
  UserRoundPlus,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import RegistroFacial from "./pages/RegistroFacial";
import Reconocimiento from "./pages/Reconocimiento";
import Probabilidades from "./pages/Probabilidades";
import Historial from "./pages/Historial";

import "./App.css";

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [tema, setTema] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";

    return localStorage.getItem("sistema-tema") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("sistema-tema", tema);
  }, [tema]);

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
    <div className={sidebarColapsado ? "app app-sidebar-collapsed" : "app"}>
      <aside
        className={`${menuAbierto ? "sidebar sidebar-open" : "sidebar"}${sidebarColapsado ? " sidebar-collapsed" : ""}`}
      >

        <div className="logo">
          <div className="logo-icon">
            IA
          </div>

          <div>
            <h2>Reconocimiento</h2>
            <span>Facial IA</span>
          </div>

          <button
            className="sidebar-toggle-button"
            aria-label={
              sidebarColapsado
                ? "Expandir menú"
                : "Colapsar menú"
            }
            onClick={() => setSidebarColapsado(!sidebarColapsado)}
          >
            {sidebarColapsado ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
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
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            className={
              pagina === "registro"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("registro")}
          >
            <UserRoundPlus size={17} />
            <span>Registro facial</span>
          </button>

          <button
            className={
              pagina === "reconocimiento"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("reconocimiento")}
          >
            <ScanFace size={17} />
            <span>Reconocimiento</span>
          </button>

          <button
            className={
              pagina === "probabilidades"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("probabilidades")}
          >
            <BarChart3 size={17} />
            <span>Probabilidades</span>
          </button>

          <button
            className={
              pagina === "historial"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => cambiarPagina("historial")}
          >
            <History size={17} />
            <span>Historial</span>
          </button>

        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle-button"
            aria-label={
              tema === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
            onClick={() =>
              setTema(tema === "dark" ? "light" : "dark")
            }
          >
            {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{tema === "dark" ? "Modo claro" : "Modo oscuro"}</span>
          </button>
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
            <div className="topbar-title-row">
              <span className="topbar-kicker">
                <Activity size={13} />
                Plataforma de análisis facial
              </span>
              <h1>Sistema Inteligente</h1>
            </div>

            <p>
              Reconocimiento facial y análisis de probabilidades
            </p>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            <span>Sistema operativo</span>
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

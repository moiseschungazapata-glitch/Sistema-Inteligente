import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  History as HistoryIcon,
  Search,
  XCircle,
} from "lucide-react";

import { obtenerHistorial } from "../services/api";
import type { RecognitionLog } from "../types/facial";

function Historial() {
  const [historial, setHistorial] = useState<RecognitionLog[]>([]);
  const [mensaje, setMensaje] = useState("Cargando historial...");
  const [busqueda, setBusqueda] = useState("");

  const cargarHistorial = useCallback(async () => {
    try {
      const data = await obtenerHistorial();
      setHistorial(data);
      setMensaje("");
    } catch {
      setMensaje("El historial todavía no está disponible.");
    }
  }, []);

  useEffect(() => {
    // La carga inicial sincroniza el componente con el historial remoto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarHistorial();
  }, [cargarHistorial]);

  const registrosFiltrados = historial.filter((registro) => {
    const texto = `${registro.id} ${registro.persona_id ?? ""} ${registro.resultado}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="page-view history-view">
      <div className="page-title">
        <div>
          <span className="page-kicker">TRAZABILIDAD</span>
          <h2>Historial</h2>
          <p>Consulta los reconocimientos realizados por el sistema.</p>
        </div>

        <div className="page-title-badge muted-badge">
          <HistoryIcon size={16} /> Registro de actividad
        </div>
      </div>

      <section className="card history-card">
        <div className="history-toolbar">
          <div className="card-heading compact-heading">
            <span className="heading-icon heading-icon-blue"><Clock3 size={19} /></span>
            <div>
              <span className="card-eyebrow">ACTIVIDAD RECIENTE</span>
              <h3>Reconocimientos</h3>
            </div>
          </div>

          <label className="search-box">
            <Search size={16} />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar registro..."
              aria-label="Buscar registro"
            />
          </label>
        </div>

        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>REGISTRO</th>
                <th>PERSONA</th>
                <th>SIMILITUD</th>
                <th>RESULTADO</th>
                <th>FECHA</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-table-state">
                      <HistoryIcon size={28} />
                      <strong>{mensaje || "No hay registros"}</strong>
                      <span>Los resultados aparecerán aquí después de cada análisis.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((registro) => {
                  const coincide = registro.resultado === "coincide";
                  return (
                    <tr key={registro.id}>
                      <td><span className="record-id">#{String(registro.id).padStart(4, "0")}</span></td>
                      <td><strong>{registro.persona_id ?? "No identificada"}</strong></td>
                      <td>
                        <div className="table-score">
                          <span>{registro.similarity !== undefined ? `${(registro.similarity * 100).toFixed(2)}%` : "--"}</span>
                          <span className="mini-score"><i style={{ width: `${Math.max(0, Math.min((registro.similarity ?? 0) * 100, 100))}%` }} /></span>
                        </div>
                      </td>
                      <td>
                        <span className={coincide ? "table-status table-status-success" : "table-status table-status-failed"}>
                          {coincide ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {registro.resultado}
                        </span>
                      </td>
                      <td className="table-date">{new Date(registro.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Historial;

import { useState } from "react";
import {
  BarChart3,
  Info,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import ProbabilityChart from "../components/ProbabilityChart";

function Probabilidades() {
  const [similitud, setSimilitud] = useState(0.85);
  const [probabilidad, setProbabilidad] = useState(0.90);

  return (
    <div className="page-view probabilities-view">
      <div className="page-title">
        <div>
          <span className="page-kicker">MÉTRICAS DEL MODELO</span>
          <h2>Probabilidades</h2>
          <p>Explora cómo se interpreta una coincidencia facial.</p>
        </div>

        <div className="page-title-badge muted-badge">
          <TrendingUp size={16} /> Análisis estadístico
        </div>
      </div>

      <div className="probability-layout">
        <section className="card probability-control-card">
          <div className="card-heading">
            <span className="heading-icon heading-icon-violet"><SlidersHorizontal size={19} /></span>
            <div>
              <span className="card-eyebrow">CONFIGURACIÓN</span>
              <h3>Parámetros de coincidencia</h3>
              <p>Ajusta los valores para observar su impacto.</p>
            </div>
          </div>

          <div className="parameter-block">
            <div className="parameter-label">
              <label htmlFor="similitud">Similitud facial</label>
              <strong>{(similitud * 100).toFixed(0)}%</strong>
            </div>
            <input
              id="similitud"
              className="range-input"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={similitud}
              onChange={(event) => setSimilitud(Number(event.target.value))}
            />
            <div className="range-labels"><span>0%</span><span>100%</span></div>
          </div>

          <div className="parameter-block">
            <div className="parameter-label">
              <label htmlFor="probabilidad">Probabilidad estimada</label>
              <strong>{(probabilidad * 100).toFixed(0)}%</strong>
            </div>
            <input
              id="probabilidad"
              className="range-input range-input-green"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={probabilidad}
              onChange={(event) => setProbabilidad(Number(event.target.value))}
            />
            <div className="range-labels"><span>Baja</span><span>Alta</span></div>
          </div>

          <div className="info-text info-panel">
            <Info size={17} />
            <span>La similitud matemática y la probabilidad calibrada no son exactamente lo mismo.</span>
          </div>
        </section>

        <section className="card probability-result-card">
          <div className="card-heading">
            <span className="heading-icon heading-icon-blue"><BarChart3 size={19} /></span>
            <div>
              <span className="card-eyebrow">VISUALIZACIÓN</span>
              <h3>Confianza estimada</h3>
              <p>Representación del resultado actual.</p>
            </div>
          </div>

          <ProbabilityChart probability={probabilidad} />

          <div className="probability-summary">
            <div><span>Similitud</span><strong>{(similitud * 100).toFixed(0)}%</strong></div>
            <div><span>Estado</span><strong className="summary-positive">Favorable</strong></div>
          </div>

          <div className="calibration-note">
            <span className="note-dot" />
            <p>La probabilidad calibrada será calculada posteriormente por el modelo estadístico de Machine Learning.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Probabilidades;

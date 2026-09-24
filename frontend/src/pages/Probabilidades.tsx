import {
  useState,
} from "react";

import ProbabilityChart from "../components/ProbabilityChart";

function Probabilidades() {
  const [similitud, setSimilitud] =
    useState(0.85);

  const [probabilidad, setProbabilidad] =
    useState(0.90);

  return (
    <div>

      <div className="page-title">

        <h2>
          Probabilidades
        </h2>

        <p>
          Análisis de probabilidad de coincidencia
          facial.
        </p>

      </div>

      <div className="card">

        <h3>
          Análisis de coincidencia
        </h3>

        <div className="form-group">

          <label>
            Similitud
          </label>

          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={similitud}
            onChange={(event) =>
              setSimilitud(
                Number(event.target.value)
              )
            }
          />

        </div>

        <div className="form-group">

          <label>
            Probabilidad estimada
          </label>

          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={probabilidad}
            onChange={(event) =>
              setProbabilidad(
                Number(event.target.value)
              )
            }
          />

        </div>

        <ProbabilityChart
          probability={probabilidad}
        />

        <p className="info-text">
          La similitud matemática y la
          probabilidad calibrada no representan
          exactamente lo mismo. La probabilidad
          será calculada posteriormente mediante
          el modelo estadístico de Machine Learning.
        </p>

      </div>

    </div>
  );
}

export default Probabilidades;
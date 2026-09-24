import {
  useEffect,
  useState,
} from "react";

import {
  obtenerHistorial,
} from "../services/api";

import type {
  RecognitionLog,
} from "../types/facial";

function Historial() {
  const [historial, setHistorial] =
    useState<RecognitionLog[]>([]);

  const [mensaje, setMensaje] =
    useState(
      "Cargando historial..."
    );

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial =
    async () => {
      try {
        const data =
          await obtenerHistorial();

        setHistorial(data);
        setMensaje("");

      } catch {
        setMensaje(
          "El historial todavía no está disponible."
        );
      }
    };

  return (
    <div>

      <div className="page-title">

        <h2>
          Historial
        </h2>

        <p>
          Registro de los reconocimientos
          realizados por el sistema.
        </p>

      </div>

      <div className="table-container">

        <table>

          <thead>

            <tr>

              <th>
                ID
              </th>

              <th>
                Persona
              </th>

              <th>
                Similitud
              </th>

              <th>
                Resultado
              </th>

              <th>
                Fecha
              </th>

            </tr>

          </thead>

          <tbody>

            {historial.length === 0 ? (
              <tr>

                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                  }}
                >
                  {mensaje}
                </td>

              </tr>
            ) : (
              historial.map((registro) => (
                <tr
                  key={registro.id}
                >

                  <td>
                    {registro.id}
                  </td>

                  <td>
                    {registro.persona_id ??
                      "No identificada"}
                  </td>

                  <td>
                    {registro.similarity
                      ? `${(
                          registro.similarity *
                          100
                        ).toFixed(2)}%`
                      : "--"}
                  </td>

                  <td>
                    {registro.resultado}
                  </td>

                  <td>
                    {new Date(
                      registro.created_at
                    ).toLocaleString()}
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Historial;
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api, errorMessage } from '../services/api'
import type { Summary } from '../types/facial'
export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api
      .get<Summary>('/dashboard')
      .then((r) => {
        if (active) setData(r.data)
      })
      .catch((e) => {
        if (active) setError(errorMessage(e))
      })
    return () => {
      active = false
    }
  }, [])
  return (
    <>
      <h1>Resumen del sistema</h1>
      <p>Registro y reconocimiento facial con resultados verificables.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Cargando estadísticas…</p>}
      {data && (
        <>
          <div className="stats">
            {[
              ['Personas', data.personas],
              ['Activas', data.activas],
              ['Reconocimientos', data.reconocimientos],
              ['Coincidencias', data.coincidencias],
            ].map(([label, value]) => (
              <article className="card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <section className="card">
            <h2>Actividad de los últimos 14 días</h2>
            <p>Fechas en UTC.</p>
            {!data.serie.length ? (
              <p>
                Aún no hay reconocimientos. Registra una persona y realiza la primera comparación.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.serie}>
                  <XAxis dataKey="dia" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="intentos" stroke="#64748b" />
                  <Line dataKey="coincidencias" stroke="#0f766e" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>
        </>
      )}
    </>
  )
}

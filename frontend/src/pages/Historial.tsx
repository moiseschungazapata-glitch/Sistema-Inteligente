import { useEffect, useState } from 'react'
import { api, errorMessage } from '../services/api'
import type { HistoryRow, Profile } from '../types/facial'
interface AuditRow { id: string; actor_id: string | null; accion: string; entidad: string; resultado: string; created_at: string }
function Auditoria() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; api.get<AuditRow[]>('/auditoria', { params: { offset: page * 30 } }).then(r => { if (active) { setRows(r.data); setError('') } }).catch(e => { if (active) setError(errorMessage(e)) }); return () => { active = false } }, [page])
  return <section className="card"><h2>Auditoría de operaciones</h2>{error && <p className="error" role="alert">{error}</p>}<div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Resultado</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.actor_id || 'Mantenimiento'}</td><td>{r.accion}</td><td>{r.entidad}</td><td>{r.resultado}</td></tr>)}</tbody></table></div><div className="actions"><button disabled={!page} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={rows.length < 30} onClick={() => setPage(page + 1)}>Siguiente</button></div></section>
}
export default function Historial({ profile }: { profile: Profile }) {
  const [audit, setAudit] = useState(false)
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [page, setPage] = useState(0)
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let active = true
    api
      .get<HistoryRow[]>('/reconocimiento/historial', {
        params: { offset: page * 30, estado: state || undefined },
      })
      .then((r) => {
        if (active) {
          setRows(r.data)
          setError('')
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, state])
  return (
    <>
      <h1>Historial</h1>
      <p>Intentos de reconocimiento y resultados guardados.</p>
      {profile.rol === 'administrador' && <button onClick={() => setAudit(!audit)}>{audit ? 'Ocultar auditoría' : 'Consultar auditoría'}</button>}
      {audit && <Auditoria />}
      <section className="card">
        <label>
          Estado
          <select
            value={state}
            onChange={(e) => {
              setLoading(true)
              setState(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Todos</option>
            {['comparado', 'sin_rostro', 'baja_calidad', 'sin_registros', 'error'].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading && <p role="status">Cargando…</p>}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Candidata</th>
                <th>Estado</th>
                <th>Coincide</th>
                <th>Similitud</th>
                <th>Probabilidad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.personas?.nombre || '—'}</td>
                  <td>{r.estado.replaceAll('_', ' ')}</td>
                  <td>{r.coincide === null ? '—' : r.coincide ? 'Sí' : 'No'}</td>
                  <td>{r.similitud?.toFixed(3) ?? '—'}</td>
                  <td>
                    {r.probabilidad_calibrada == null
                      ? 'No disponible'
                      : `${(r.probabilidad_calibrada * 100).toFixed(1)} %`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && !error && <p>No hay resultados para esta consulta.</p>}
        <div className="actions">
          <button
            disabled={page === 0 || loading}
            onClick={() => {
              setLoading(true)
              setPage(page - 1)
            }}
          >
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button
            disabled={rows.length < 30 || loading}
            onClick={() => {
              setLoading(true)
              setPage(page + 1)
            }}
          >
            Siguiente
          </button>
        </div>
      </section>
    </>
  )
}

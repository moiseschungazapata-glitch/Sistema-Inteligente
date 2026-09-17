import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../services/api'
import ProbabilityChart from '../components/ProbabilityChart'
import type { Metrics, Profile } from '../types/facial'
export default function Probabilidades({ profile }: { profile: Profile }) {
  const [models, setModels] = useState<Metrics[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [probability, setProbability] = useState<number | null>(null)
  const load = useCallback(async () => {
    try {
      setModels((await api.get<Metrics[]>('/modelos/metricas')).data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [])
  useEffect(() => {
    let active = true
    api
      .get<Metrics[]>('/modelos/metricas')
      .then((r) => {
        if (active) setModels(r.data)
      })
      .catch((e) => {
        if (active) setError(errorMessage(e))
      })
    return () => {
      active = false
    }
  }, [])
  async function action(work: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await work()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const model = models[0]
  return (
    <>
      <h1>Probabilidades y Machine Learning</h1>
      <p>
        La similitud mide cercanía entre vectores. Una probabilidad requiere un modelo calibrado y
        evaluado.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      <div className="grid">
        <section className="card">
          <h2>Última evaluación</h2>
          {model ? (
            <>
              <p>
                {model.nombre} · {new Date(model.created_at).toLocaleString()}
              </p>
              <ProbabilityChart model={model} />
              <p>
                Falsos positivos: {(model.tasa_falsos_positivos * 100).toFixed(1)} % · Falsos
                negativos: {(model.tasa_falsos_negativos * 100).toFixed(1)} %
              </p>
              <h3>Matriz de confusión (prueba)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Real / Predicción</th>
                    <th>Positiva</th>
                    <th>Negativa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Positiva</th>
                    <td>{model.matriz_confusion.tp}</td>
                    <td>{model.matriz_confusion.fn}</td>
                  </tr>
                  <tr>
                    <th>Negativa</th>
                    <td>{model.matriz_confusion.fp}</td>
                    <td>{model.matriz_confusion.tn}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <p>
              Aún no hay un modelo evaluado. Las probabilidades permanecerán como «no disponibles»
              hasta entrenarlo.
            </p>
          )}
        </section>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            setProbability(null)
            void action(async () => {
              const similarity = Number(data.get('similitud'))
              const r = await api.post('/probabilidades/prediccion', {
                similitud: similarity,
                distancia: 1 - similarity,
                calidad_imagen: Number(data.get('calidad')),
                iluminacion: Number(data.get('iluminacion')),
              })
              setProbability(r.data.probabilidad_calibrada)
            })
          }}
        >
          <h2>Consultar probabilidad</h2>
          <label>
            Similitud coseno
            <input name="similitud" type="number" min={-1} max={1} step="any" required />
          </label>
          <label>
            Calidad de imagen (0–1)
            <input name="calidad" type="number" min={0} max={1} step="any" required />
          </label>
          <label>
            Iluminación (0–1)
            <input name="iluminacion" type="number" min={0} max={1} step="any" required />
          </label>
          <button disabled={busy || !model}>Calcular con el modelo ML</button>
          {probability !== null && (
            <p role="status">
              Probabilidad calibrada: <strong>{(probability * 100).toFixed(1)} %</strong>
            </p>
          )}
        </form>
      </div>
      {profile.rol === 'administrador' && (
        <section className="card">
          <h2>Entrenamiento</h2>
          <p>
            Carga un JSON con hasta 500 ejemplos por archivo. Se requieren al menos 60 ejemplos,
            ambas clases y 10 grupos independientes; estos mínimos no garantizan calidad
            estadística. La etiqueta real debe verificarse independientemente del resultado
            automático.
          </p>
          <details>
            <summary>Formato de cada ejemplo</summary>
            <pre>
              {JSON.stringify(
                [
                  {
                    similitud: 0.8,
                    distancia: 0.2,
                    calidad_imagen: 0.9,
                    iluminacion: 0.5,
                    resultado_real: true,
                    fuente_validacion: 'Referencia de verificación independiente',
                    grupo_validacion: 'grupo-persona-sesion',
                  },
                ],
                null,
                2,
              )}
            </pre>
            <p>
              Es un ejemplo de formato, no datos válidos para entrenar. Usa un mismo grupo para
              muestras relacionadas; no repitas personas entre grupos.
            </p>
          </details>
          <div className="actions">
            <label className="upload">
              Cargar dataset JSON
              <input
                disabled={busy}
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file)
                    void action(async () => {
                      if (file.size > 2 * 1024 * 1024) throw new Error('El JSON supera 2 MB')
                      const rows: unknown = JSON.parse(await file.text())
                      if (!Array.isArray(rows))
                        throw new Error('El archivo debe contener un array JSON')
                      const r = await api.post('/modelos/datos', rows)
                      setMessage(`${r.data.insertados} ejemplos guardados.`)
                    })
                }}
              />
            </label>
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await api.post('/modelos/entrenar')
                  await load()
                  setMessage('Modelo entrenado, calibrado y evaluado con grupos separados.')
                })
              }
            >
              {busy ? 'Procesando…' : 'Entrenar modelo ML'}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    '¿Eliminar los embeddings y reconocimientos vencidos según la política de retención?',
                  )
                )
                  void action(async () => {
                    const r = await api.post('/mantenimiento/retencion')
                    setMessage(
                      `Eliminados: ${r.data.embeddings_eliminados} embeddings y ${r.data.historial_eliminado} reconocimientos.`,
                    )
                  })
              }}
            >
              Aplicar retención
            </button>
          </div>
        </section>
      )}
    </>
  )
}

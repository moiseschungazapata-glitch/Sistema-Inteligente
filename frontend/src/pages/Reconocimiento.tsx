import { useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import FaceResultCard from '../components/FaceResultCard'
import { api, errorMessage } from '../services/api'
import type { FaceResult, Profile } from '../types/facial'
export default function Reconocimiento({ profile }: { profile: Profile }) {
  const [file, setFile] = useState<File | null>(null)
  const [origin, setOrigin] = useState('archivo')
  const [result, setResult] = useState<FaceResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function recognize() {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('origen', origin)
      setResult((await api.post<FaceResult>('/reconocimiento', form)).data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <h1>Reconocimiento facial</h1>
      <p>Compara una captura con personas activas que tienen consentimiento vigente.</p>
      {profile.rol === 'consulta' ? (
        <p>Tu rol permite consultar resultados, pero no realizar reconocimientos.</p>
      ) : (
        <div className="grid">
          <section className="card">
            <CameraCapture
              onCapture={(f, o) => {
                setFile(f)
                setOrigin(o)
                setResult(null)
              }}
            />
            <button disabled={!file || busy} onClick={() => void recognize()}>
              {busy ? 'Procesando…' : 'Reconocer rostro'}
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
          {result ? (
            <FaceResultCard result={result} />
          ) : (
            <section className="card">
              <h2>Resultado de la comparación</h2>
              <p>
                Selecciona una imagen para comenzar. La similitud y la probabilidad calibrada se
                muestran por separado.
              </p>
            </section>
          )}
        </div>
      )}
    </>
  )
}

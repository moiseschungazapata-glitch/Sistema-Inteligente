import type { FaceResult } from '../types/facial'
import SimilarityBar from './SimilarityBar'
const states: Record<string, string> = {
  sin_rostro: 'No se detectó un rostro.',
  baja_calidad: 'Mejora la iluminación o el enfoque.',
  sin_registros: 'No hay rostros vigentes del mismo modelo para comparar.',
  error: 'No se pudo procesar la captura.',
}
export default function FaceResultCard({ result }: { result: FaceResult }) {
  return (
    <section className="card">
      <h2>Resultado</h2>
      {result.estado !== 'comparado' ? (
        <p>{states[result.estado] || result.estado}</p>
      ) : (
        <>
          <span className={`badge ${result.coincide ? 'positive' : ''}`}>
            {result.coincide ? 'Coincidencia aceptada' : 'Sin coincidencia aceptada'}
          </span>
          <h3>{result.nombre || 'Identidad candidata no disponible'}</h3>
          <p>Identidad candidata; requiere verificación adicional para decisiones importantes.</p>
          <SimilarityBar value={result.similitud!} threshold={result.umbral!} />
          <p>Distancia coseno: {result.distancia?.toFixed(3)}</p>
          <p>
            Probabilidad calibrada:{' '}
            <strong>
              {result.probabilidad_calibrada == null
                ? 'No disponible: falta un modelo ML calibrado'
                : `${(result.probabilidad_calibrada * 100).toFixed(1)} %`}
            </strong>
          </p>
        </>
      )}
    </section>
  )
}

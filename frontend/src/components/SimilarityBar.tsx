export default function SimilarityBar({ value, threshold }: { value: number; threshold: number }) {
  return (
    <div>
      <div className="row">
        <span>Similitud coseno</span>
        <strong>{value.toFixed(3)}</strong>
      </div>
      <meter min={-1} max={1} value={value} aria-label="Similitud coseno" />
      <small>Umbral: {threshold.toFixed(3)} · Rango: −1 a 1. No es una probabilidad.</small>
    </div>
  )
}

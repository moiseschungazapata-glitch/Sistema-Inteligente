import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Metrics } from '../types/facial'
export default function ProbabilityChart({ model }: { model: Metrics }) {
  const data = [
    { name: 'Precisión', valor: model.precision_score },
    { name: 'Recall', valor: model.recall_score },
    { name: 'F1', valor: model.f1_score },
  ]
  return (
    <div
      role="img"
      aria-label={`Precisión ${model.precision_score}, recall ${model.recall_score}, F1 ${model.f1_score}`}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Bar dataKey="valor" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

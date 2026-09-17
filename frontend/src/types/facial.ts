export interface Profile {
  id: string
  nombre: string
  rol: 'administrador' | 'operador' | 'consulta'
}
export interface Person {
  id: string
  nombre: string
  email: string | null
  activo: boolean
  created_at: string
}
export interface FaceResult {
  id: string
  estado: string
  nombre?: string | null
  persona_id?: string | null
  similitud: number | null
  distancia: number | null
  umbral: number | null
  coincide: boolean | null
  probabilidad_calibrada: number | null
}
export interface HistoryRow extends FaceResult {
  created_at: string
  personas: { nombre: string } | null
}
export interface Metrics {
  id: string
  nombre: string
  version: string
  created_at: string
  precision_score: number
  recall_score: number
  f1_score: number
  tasa_falsos_positivos: number
  tasa_falsos_negativos: number
  matriz_confusion: { tp: number; tn: number; fp: number; fn: number }
}
export interface Summary {
  personas: number
  activas: number
  reconocimientos: number
  coincidencias: number
  serie: { dia: string; intentos: number; coincidencias: number }[]
}

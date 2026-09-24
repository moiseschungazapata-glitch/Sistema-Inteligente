export interface Persona {
  id: string;
  nombre_completo: string;
  documento?: string;
  activo: boolean;
}

export interface RecognitionResult {
  resultado: string;
  coincide: boolean;
  similitud: number;
  umbral: number;
  distancia?: number;
  modelo?: string;
  persona?: Persona | null;
}

export interface ProbabilityResult {
  probabilidad: number;
  similitud: number;
}

export interface RecognitionLog {
  id: number;
  persona_id?: string | null;
  similarity?: number;
  distance?: number;
  resultado: string;
  confianza?: number;
  created_at: string;
}

export interface DashboardSummary {
  personas: number;
  reconocimientos: number;
  coincidencias: number;
  precision: number | null;
}

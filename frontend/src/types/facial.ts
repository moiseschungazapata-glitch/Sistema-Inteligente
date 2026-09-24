export interface Persona {
  id: number;
  nombre_completo: string;
  documento?: string;
  activo: boolean;
}

export interface RecognitionResult {
  resultado: string;
  coincide: boolean;
  similitud: number;
  umbral: number;
  persona?: Persona | null;
}

export interface ProbabilityResult {
  probabilidad: number;
  similitud: number;
}

export interface RecognitionLog {
  id: number;
  persona_id?: number | null;
  similarity?: number;
  distance?: number;
  resultado: string;
  confianza?: number;
  created_at: string;
}
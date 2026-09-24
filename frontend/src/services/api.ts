import type {
  Persona,
  RecognitionLog,
  RecognitionResult,
} from "../types/facial";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export async function getPersonas(): Promise<Persona[]> {
  const response = await fetch(
    `${API_URL}/api/personas`
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener las personas");
  }

  return response.json();
}

export async function registrarPersona(
  nombre_completo: string,
  documento: string
) {
  const response = await fetch(
    `${API_URL}/api/personas`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nombre_completo,
        documento,
      }),
    }
  );

  if (!response.ok) {
    let detail = "No se pudo registrar la persona";

    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      // La respuesta no tenía un cuerpo JSON válido.
    }

    throw new Error(detail);
  }

  return response.json();
}

export async function registrarRostro(
  personaId: number,
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/personas/${personaId}/rostro`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "No se pudo registrar el rostro"
    );
  }

  return response.json();
}

export async function reconocerRostro(
  file: File
): Promise<RecognitionResult> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/reconocimiento`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "No se pudo realizar el reconocimiento"
    );
  }

  const result = await response.json();

  return result.data;
}

export async function obtenerHistorial(): Promise<
  RecognitionLog[]
> {
  const response = await fetch(
    `${API_URL}/api/reconocimiento/historial`
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el historial"
    );
  }

  return response.json();
}

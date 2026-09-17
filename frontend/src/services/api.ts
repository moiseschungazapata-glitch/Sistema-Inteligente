import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
})

// Memory only: no credentials or refresh tokens in localStorage.
export function setToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('session-expired'))
    }

    const detail = error.response?.data?.detail

    if (typeof detail === 'string') return detail

    if (Array.isArray(detail)) {
      return detail.map((e: { msg: string }) => e.msg).join('. ')
    }

    return error.response
      ? 'No se pudo completar la operación.'
      : 'No se pudo conectar con el backend. Comprueba que FastAPI esté iniciado.'
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.'
}
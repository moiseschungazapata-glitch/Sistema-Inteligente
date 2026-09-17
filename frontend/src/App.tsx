import { lazy, Suspense, useEffect, useState } from 'react'
import {
  ScanFace,
  LayoutDashboard,
  UserRoundPlus,
  History,
  ChartNoAxesCombined,
  LogOut,
} from 'lucide-react'
import { api, errorMessage, setToken } from './services/api'
import type { Profile } from './types/facial'
import './App.css'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const RegistroFacial = lazy(() => import('./pages/RegistroFacial'))
const Reconocimiento = lazy(() => import('./pages/Reconocimiento'))
const Probabilidades = lazy(() => import('./pages/Probabilidades'))
const Historial = lazy(() => import('./pages/Historial'))

const pages = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'registro', name: 'Registro facial', icon: UserRoundPlus },
  { id: 'reconocimiento', name: 'Reconocimiento', icon: ScanFace },
  { id: 'probabilidades', name: 'Probabilidades', icon: ChartNoAxesCombined },
  { id: 'historial', name: 'Historial', icon: History },
]
export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [page, setPage] = useState('dashboard')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const expired = () => {
      setToken(null)
      setProfile(null)
      setError('La sesión venció. Inicia sesión nuevamente.')
    }
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])
  if (!profile)
    return (
      <main className="login">
        <section className="card">
          <div className="brand">
            <ScanFace size={36} />
            <span>Sistema Inteligente</span>
          </div>
          <h1>Accede a tu espacio</h1>
          <p>Reconocimiento facial y análisis de probabilidades.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const fields = new FormData(form)
              setBusy(true)
              setError('')
              void (async () => {
                try {
                  const response = await api.post('/auth/login', {
                    email: fields.get('email'),
                    password: fields.get('password'),
                  })
                  setToken(response.data.access_token)
                  const me = await api.get<Profile>('/auth/me')
                  setProfile(me.data)
                  setPage('dashboard')
                  form.reset()
                } catch (e) {
                  setToken(null)
                  setError(errorMessage(e))
                } finally {
                  setBusy(false)
                }
              })()
            }}
          >
            <label>
              Correo
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button disabled={busy}>{busy ? 'Iniciando sesión…' : 'Entrar'}</button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <small>
            Solicita una cuenta al administrador. La sesión se cierra al recargar la página.
          </small>
        </section>
      </main>
    )
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <ScanFace />
          <span>
            Sistema
            <br />
            Inteligente
          </span>
        </div>
        <nav aria-label="Navegación principal">
          {pages.map((p) => (
            <button
              key={p.id}
              className={page === p.id ? 'selected' : ''}
              aria-current={page === p.id ? 'page' : undefined}
              onClick={() => setPage(p.id)}
            >
              <p.icon size={20} />
              {p.name}
            </button>
          ))}
        </nav>
        <div className="account">
          <strong>{profile.nombre}</strong>
          <small>{profile.rol}</small>
          <button
            onClick={() => {
              setToken(null)
              setProfile(null)
              setError('')
            }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content">
        <header>
          <span>Visión artificial · IA / ML / DL</span>
          <span className="badge">Acceso autenticado</span>
        </header>
        <Suspense
          fallback={
            <p className="py-8" role="status">
              Cargando módulo…
            </p>
          }
        >
          {page === 'dashboard' && <Dashboard />}
          {page === 'registro' && <RegistroFacial profile={profile} />}
          {page === 'reconocimiento' && <Reconocimiento profile={profile} />}
          {page === 'probabilidades' && <Probabilidades profile={profile} />}
          {page === 'historial' && <Historial profile={profile} />}
        </Suspense>
      </main>
    </div>
  )
}

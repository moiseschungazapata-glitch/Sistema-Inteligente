import { useCallback, useEffect, useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import { api, errorMessage } from '../services/api'
import type { Person, Profile } from '../types/facial'
export default function RegistroFacial({ profile }: { profile: Profile }) {
  const [people, setPeople] = useState<Person[]>([])
  const [selected, setSelected] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const canWrite = profile.rol !== 'consulta'
  const load = useCallback(async () => {
    try {
      setPeople(
        (
          await api.get<Person[]>('/personas', {
            params: { offset: page * 100 },
          })
        ).data,
      )
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [page])
  useEffect(() => {
    let active = true
    api
      .get<Person[]>('/personas', { params: { offset: page * 100 } })
      .then((r) => {
        if (active) setPeople(r.data)
      })
      .catch((e) => {
        if (active) setError(errorMessage(e))
      })
    return () => {
      active = false
   }, [page])
  async function action(work: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await work()
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <h1>Registro facial</h1>
      <p>Registra primero a la persona con su consentimiento y después añade su rostro.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {canWrite && (
        <div className="grid">
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const data = new FormData(form)
              void action(async () => {
                const person = (
                  await api.post<Person>('/personas', {
                    nombre: data.get('nombre'),
                    email: data.get('email') || null,
                    consentimiento: data.get('consentimiento') === 'on',
                    version_aviso: data.get('version'),
                    evidencia_referencia: data.get('evidencia'),
                  })
                ).data
                setSelected(person.id)
                form.reset()
                setMessage('Persona registrada. Ahora selecciona o captura su rostro.')
              })
            }}
          >
            <h2>1. Datos y consentimiento</h2>
            <label>
              Nombre completo
              <input name="nombre" required minLength={2} maxLength={150} />
            </label>
            <label>
              Correo electrónico (opcional)
              <input name="email" type="email" maxLength={254} />
            </label>
            <label>
              Versión del aviso informado
              <input name="version" required placeholder="Ej.: aviso-2026-01" />
            </label>
            <label>
              Referencia de la evidencia de consentimiento
              <input
                name="evidencia"
                required
                minLength={3}
                placeholder="Identificador del documento o registro firmado"
              />
            </label>
            <label className="check">
              <input name="consentimiento" type="checkbox" required />
              Confirmo que la persona recibió el aviso sobre finalidad, conservación y revocación, y
              otorgó su consentimiento.
            </label>
            <button disabled={busy}>Registrar persona</button>
          </form>
          <section className="card">
            <h2>2. Rostro de la persona</h2>
            <label>
              Persona
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value)
                  setImage(null)
                }}
              >
                <option value="">Selecciona una persona</option>
                {selected && !people.some((p) => p.id === selected) && (
                  <option value={selected}>Persona recién registrada</option>
                )}
                {people
                  .filter((p) => p.activo)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <CameraCapture key={selected} onCapture={(file) => setImage(file)} />
            <button
              disabled={busy || !selected || !image}
              onClick={() =>
                void action(async () => {
                  const form = new FormData()
                  form.append('file', image!)
                  await api.post(`/personas/${selected}/rostro`, form)
                  setMessage('Rostro registrado. La fotografía no se almacena.')
                  setImage(null)
                })
              }
            >
              Guardar rostro
            </button>
          </section>
        </div>
      )}
      <section className="card">
        <h2>Personas registradas</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Estado</th>
                {canWrite && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.activo ? 'Activa' : 'Inactiva'}</td>
                  {canWrite && (
                    <td className="actions">
                      <button
                        disabled={busy}
                        onClick={() => {
                          const nombre = window.prompt('Nombre de la persona', p.nombre)
                          if (nombre?.trim())
                            void action(async () => {
                              await api.patch(`/personas/${p.id}`, {
                                nombre,
                                activo: p.activo,
                              })
                              setMessage('Nombre actualizado.')
                            })
                        }}
                      >
                        Editar
                      </button>
                      <button
                        disabled={busy || !p.activo}
                        onClick={() => {
                          if (
                            window.confirm(
                              '¿Revocar el consentimiento y eliminar los embeddings y reconocimientos asociados?',
                            )
                          )
                            void action(async () => {
                              await api.post(`/personas/${p.id}/revocar`)
                              setMessage('Consentimiento revocado y datos faciales eliminados.')
                            })
                        }}
                      >
                        Revocar
                      </button>
                      {profile.rol === 'administrador' && (
                        <button
                          className="danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar definitivamente a ${p.nombre} y sus datos asociados?`,
                              )
                            )
                              void action(async () => {
                                await api.delete(`/personas/${p.id}`)
                                if (selected === p.id) setSelected('')
                                setMessage('Persona eliminada.')
                              })
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!people.length && <p>No hay personas en esta página.</p>}
        <div className="actions">
          <button disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button disabled={people.length < 100 || busy} onClick={() => setPage(page + 1)}>
            Siguiente
          </button>
        </div>
      </section>
    </>
  )
}

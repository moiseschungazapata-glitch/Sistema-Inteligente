import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

export default function CameraCapture({
  onCapture,
}: {
  onCapture: (file: File, origin: 'camara' | 'archivo') => void
}) {
  const camera = useRef<Webcam>(null)
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  function select(file: File, origin: 'camara' | 'archivo') {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError('Selecciona una imagen JPEG, PNG o WebP de hasta 8 MB.')
      return
    }
    setError('')
    setPreview(URL.createObjectURL(file))
    onCapture(file, origin)
  }
  async function capture() {
    const source = camera.current?.getScreenshot()
    if (!source) {
      setError('Espera a que la cámara esté lista.')
      return
    }
    const blob = await (await fetch(source)).blob()
    select(new File([blob], 'captura.jpg', { type: 'image/jpeg' }), 'camara')
    setEnabled(false)
    setReady(false)
  }
  return (
    <section className="capture">
      {enabled ? (
        <Webcam
          ref={camera}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
          onUserMedia={() => setReady(true)}
          onUserMediaError={() => {
            setError('No se pudo abrir la cámara. Revisa los permisos del navegador.')
            setEnabled(false)
          }}
        />
      ) : preview ? (
        <img src={preview} alt="Captura seleccionada para procesar" />
      ) : (
        <div className="camera-empty">
          Coloca un solo rostro frente a la cámara, con buena iluminación.
        </div>
      )}
      <div className="actions">
        <button
          type="button"
          onClick={() => {
            setEnabled(!enabled)
            setReady(false)
          }}
        >
          {enabled ? 'Cerrar cámara' : 'Abrir cámara'}
        </button>
        {enabled && (
          <button type="button" disabled={!ready} onClick={() => void capture()}>
            Capturar
          </button>
        )}
        <label className="upload">
          Cargar imagen
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) select(f, 'archivo')
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  )
}

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Info,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const Reconocimiento = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturado, setCapturado] = useState<string | null>(null);
  const [reconocido, setReconocido] = useState(false);

  useEffect(() => {
    if (capturado) return;

    let activo = true;

    navigator.mediaDevices?.getUserMedia({ video: true }).then((stream) => {
      if (!activo) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
    }).catch(() => {
      // La cámara puede no estar disponible o no tener permisos.
    });

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [capturado]);

  const capturarRostro = () => {
    const video = webcamRef.current;

    if (video?.videoWidth && video.videoHeight) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      setCapturado(canvas.toDataURL("image/jpeg"));
      setReconocido(false);
    }
  };

  const reconocerRostro = () => {
    if (!capturado) {
      alert("Primero debes capturar un rostro.");
      return;
    }

    setReconocido(true);
  };

  return (
    <div className="page-view recognition-view">
      <div className="page-title">
        <div>
          <span className="page-kicker">ANÁLISIS EN TIEMPO REAL</span>
          <h2>Reconocimiento facial</h2>
          <p>Captura un rostro y compáralo con las identidades registradas.</p>
        </div>

        <div className="page-title-badge muted-badge">
          <ShieldCheck size={16} /> Procesamiento local
        </div>
      </div>

      <div className="recognition-layout">
        <section className="card camera-card">
          <div className="card-heading">
            <span className="heading-icon heading-icon-blue"><Camera size={19} /></span>
            <div>
              <span className="card-eyebrow">CAPTURA</span>
              <h3>Escáner facial</h3>
              <p>Centra el rostro dentro del área de análisis.</p>
            </div>
            <span className="live-badge"><span /> En vivo</span>
          </div>

          <div className={capturado ? "camera-stage camera-stage-captured" : "camera-stage"}>
            {capturado ? (
              <img src={capturado} alt="Rostro capturado" />
            ) : (
              <video ref={webcamRef} autoPlay playsInline muted />
            )}
            <div className="scan-corners" aria-hidden="true" />
            <span className="camera-stage-label">
              {capturado ? "Captura lista para analizar" : "Alinea tu rostro"}
            </span>
          </div>

          <div className="camera-actions">
            <button className="primary-button" onClick={capturarRostro}>
              <Camera size={17} /> Capturar rostro
            </button>
            <button className="secondary-button" onClick={reconocerRostro}>
              <ScanFace size={17} /> Reconocer
            </button>
          </div>

          <div className="camera-tip">
            <Info size={16} />
            Asegúrate de tener buena iluminación y mirar de frente.
          </div>
        </section>

        <section className="card result-card">
          <div className="card-heading result-heading">
            <span className="heading-icon heading-icon-green"><Sparkles size={19} /></span>
            <div>
              <span className="card-eyebrow">RESULTADO</span>
              <h3>Lectura del modelo</h3>
              <p>La información aparecerá después del análisis.</p>
            </div>
          </div>

          {!reconocido ? (
            <div className="result-empty">
              <span className="result-empty-icon"><ScanFace size={34} /></span>
              <strong>Listo para analizar</strong>
              <p>Realiza una captura para iniciar la comparación facial.</p>
            </div>
          ) : (
            <div className="result-content">
              <div className="match-banner">
                <CheckCircle2 size={21} />
                <div>
                  <strong>Coincidencia encontrada</strong>
                  <span>La identidad supera el umbral configurado.</span>
                </div>
                <span className="match-badge">CONFIRMADA</span>
              </div>

              <div className="identified-person">
                <span>PERSONA IDENTIFICADA</span>
                <strong>Carlos Pérez</strong>
                <small>ID de perfil · 0001</small>
              </div>

              <div className="result-metrics">
                <Metric label="Similitud" value="87%" accent="blue" />
                <Metric label="Distancia" value="0.26" />
                <Metric label="Umbral" value="0.75" />
                <Metric label="Probabilidad" value="93%" accent="green" />
              </div>

              <div className="confidence-line">
                <div><span>Nivel de confianza</span><strong>Alto</strong></div>
                <div className="confidence-track"><span style={{ width: "87%" }} /></div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

function Metric({ label, value, accent = "default" }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`result-metric result-metric-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Reconocimiento;

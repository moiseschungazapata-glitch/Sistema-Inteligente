import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

function CameraCapture({
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(
    null
  );

  const streamRef = useRef<MediaStream | null>(
    null
  );

  const [cameraActive, setCameraActive] =
    useState(false);

  const [error, setError] = useState("");

  const iniciarCamara = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Este navegador no permite usar la cámara. Abre el sistema desde localhost o mediante HTTPS."
        );
        return;
      }

      if (!window.isSecureContext) {
        setError(
          "La cámara requiere una conexión segura. Usa http://localhost:5173 o HTTPS."
        );
        return;
      }

      detenerCamara();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
    } catch (error) {
      const cameraError = error as DOMException;

      switch (cameraError.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          setError(
            "Chrome bloqueó el acceso a la cámara. Haz clic en el candado de la barra de direcciones, permite la cámara y vuelve a intentarlo."
          );
          break;

        case "NotFoundError":
          setError(
            "No se encontró ninguna cámara conectada al equipo."
          );
          break;

        case "NotReadableError":
        case "TrackStartError":
          setError(
            "La cámara está siendo utilizada por otra aplicación. Ciérrala y vuelve a intentarlo."
          );
          break;

        case "OverconstrainedError":
          setError(
            "La cámara no es compatible con la configuración solicitada."
          );
          break;

        default:
          setError(
            `No se pudo acceder a la cámara (${cameraError.name || "error desconocido"}).`
          );
      }
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());
    }

    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (cameraActive && video && stream) {
      video.srcObject = stream;

      video.play().catch(() => {
        setError(
          "La cámara está activa, pero el navegador no pudo iniciar la reproducción del video."
        );
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const capturarImagen = () => {
    if (!videoRef.current) {
      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width =
      videoRef.current.videoWidth;

    canvas.height =
      videoRef.current.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      videoRef.current,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const file = new File(
        [blob],
        "captura-rostro.jpg",
        {
          type: "image/jpeg",
        }
      );

      onCapture(file);
    }, "image/jpeg");
  };

  return (
    <div className="camera-container">

      <div className="camera-preview">

        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="camera-placeholder">
            <span>
              Cámara desactivada
            </span>
          </div>
        )}

      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="camera-actions">

        {!cameraActive ? (
          <button
            className="primary-button"
            onClick={iniciarCamara}
          >
            Activar cámara
          </button>
        ) : (
          <>
            <button
              className="primary-button"
              onClick={capturarImagen}
            >
              Capturar rostro
            </button>

            <button
              className="secondary-button"
              onClick={detenerCamara}
            >
              Detener cámara
            </button>
          </>
        )}

      </div>

    </div>
  );
}

export default CameraCapture;

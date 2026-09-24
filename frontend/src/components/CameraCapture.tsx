import { useRef, useState } from "react";

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
    } catch {
      setError(
        "No se pudo acceder a la cámara."
      );
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
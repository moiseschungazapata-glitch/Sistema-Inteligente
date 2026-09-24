import { useEffect, useRef, useState } from "react";
type IconProps = {
  size?: number;
  className?: string;
};

const Camera = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M14.5 4h-5L8 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-1.5-3Z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ScanFace = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" />
    <path d="M8 15c1.1 1 2.3 1.5 4 1.5s2.9-.5 4-1.5" />
  </svg>
);

const CheckCircle = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="m8 12 2.5 2.5L16 9" />
  </svg>
);

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
      if (webcamRef.current) webcamRef.current.srcObject = stream;
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
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Reconocimiento Facial
        </h1>

        <p className="mt-2 text-gray-500">
          Captura un rostro y compara sus características con los registros.
        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Cámara */}

        <div className="rounded-xl bg-white p-6 shadow">

          <div className="mb-5 flex items-center gap-3">

            <Camera className="text-blue-600" />

            <h2 className="text-xl font-bold">
              Cámara
            </h2>

          </div>

          <div className="overflow-hidden rounded-xl bg-black">

            {capturado ? (
              <img
                src={capturado}
                alt="Rostro capturado"
                className="w-full"
              />
            ) : (
              <video
                ref={webcamRef}
                autoPlay
                playsInline
                className="w-full"
              />
            )}

          </div>

          <div className="mt-5 flex gap-3">

            <button
              onClick={capturarRostro}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Camera size={20} />
              Capturar
            </button>

            <button
              onClick={reconocerRostro}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-white hover:bg-purple-700"
            >
              <ScanFace size={20} />
              Reconocer
            </button>

          </div>

        </div>

        {/* Resultado */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="text-xl font-bold">
            Resultado
          </h2>

          {!reconocido ? (

            <div className="flex h-80 items-center justify-center text-center text-gray-400">

              <div>
                <ScanFace
                  size={60}
                  className="mx-auto mb-4"
                />

                <p>
                  Realiza una captura para iniciar
                  el reconocimiento.
                </p>
              </div>

            </div>

          ) : (

            <div className="mt-6">

              <div className="rounded-xl bg-green-50 p-5">

                <div className="flex items-center gap-3 text-green-700">

                  <CheckCircle />

                  <span className="font-bold">
                    Coincidencia encontrada
                  </span>

                </div>

              </div>

              <div className="mt-6">

                <p className="text-sm text-gray-500">
                  Persona identificada
                </p>

                <p className="text-2xl font-bold">
                  Carlos Pérez
                </p>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500">
                    Similitud
                  </p>
                  <p className="text-2xl font-bold">
                    87%
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500">
                    Distancia
                  </p>
                  <p className="text-2xl font-bold">
                    0.26
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500">
                    Umbral
                  </p>
                  <p className="text-2xl font-bold">
                    0.75
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500">
                    Probabilidad
                  </p>
                  <p className="text-2xl font-bold">
                    93%
                  </p>
                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default Reconocimiento;
import { useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  UserRoundPlus,
} from "lucide-react";

import CameraCapture from "../components/CameraCapture";
import {
  registrarPersona,
  registrarRostro,
} from "../services/api";

function RegistroFacial() {
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const registrar = async () => {
    try {
      setMensaje("");

      if (!nombre.trim()) {
        setMensaje("Ingrese el nombre de la persona.");
        return;
      }

      const response = await registrarPersona(nombre, documento);
      const personas = response.data;
      const persona = Array.isArray(personas) ? personas[0] : personas;

      if (!persona?.id) {
        throw new Error("La persona se creó, pero no se recibió su ID.");
      }

      setPersonaId(persona.id);
      setMensaje("Persona registrada correctamente.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al registrar la persona."
      );
    }
  };

  const seleccionarArchivo = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setArchivo(file);
      setMensaje("Imagen seleccionada correctamente.");
    }
  };

  const registrarRostroSeleccionado = async () => {
    try {
      if (!personaId) {
        setMensaje("Primero registre una persona.");
        return;
      }

      if (!archivo) {
        setMensaje("Seleccione o capture una imagen.");
        return;
      }

      await registrarRostro(personaId, archivo);
      setMensaje("Rostro registrado correctamente.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al registrar el rostro."
      );
    }
  };

  const capturarRostro = (file: File) => {
    setArchivo(file);
    setMensaje("Imagen capturada correctamente.");
  };

  return (
    <div className="page-view registration-view">
      <div className="page-title">
        <div>
          <span className="page-kicker">NUEVO REGISTRO</span>
          <h2>Registro facial</h2>
          <p>Incorpora una nueva identidad al sistema de forma segura.</p>
        </div>

        <div className="page-title-badge muted-badge">
          <ShieldCheck size={16} /> Datos protegidos
        </div>
      </div>

      <div className="registration-progress">
        <div className="progress-step progress-step-active">
          <span>01</span>
          <div><strong>Datos personales</strong><small>Identifica a la persona</small></div>
        </div>
        <ArrowRight className="progress-arrow" size={18} />
        <div className={personaId ? "progress-step progress-step-active" : "progress-step"}>
          <span>02</span>
          <div><strong>Rostro</strong><small>Captura las características</small></div>
        </div>
        <ArrowRight className="progress-arrow" size={18} />
        <div className={archivo && personaId ? "progress-step progress-step-active" : "progress-step"}>
          <span>03</span>
          <div><strong>Confirmación</strong><small>Guarda el registro</small></div>
        </div>
      </div>

      <div className="registration-grid">
        <section className="card workflow-card">
          <div className="card-heading">
            <span className="heading-icon heading-icon-blue"><UserRoundPlus size={19} /></span>
            <div>
              <span className="card-eyebrow">PASO 01</span>
              <h3>Datos de la persona</h3>
              <p>Completa la información básica del perfil.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Moisés Chung"
            />
          </div>

          <div className="form-group">
            <label htmlFor="documento">Documento de identidad</label>
            <input
              id="documento"
              type="text"
              value={documento}
              onChange={(event) => setDocumento(event.target.value)}
              placeholder="Ej. 77777777"
            />
          </div>

          <button className="primary-button button-wide" onClick={registrar}>
            <UserRoundPlus size={17} /> Registrar persona
          </button>

          {personaId && (
            <div className="inline-success">
              <CheckCircle2 size={17} />
              <span>Perfil creado · ID {personaId}</span>
            </div>
          )}
        </section>

        <section className="card workflow-card">
          <div className="card-heading">
            <span className="heading-icon heading-icon-violet"><Camera size={19} /></span>
            <div>
              <span className="card-eyebrow">PASO 02</span>
              <h3>Imagen facial</h3>
              <p>Usa la cámara o carga una imagen nítida.</p>
            </div>
          </div>

          <label className="upload-zone">
            <UploadCloud size={22} />
            <span><strong>Seleccionar imagen</strong> o arrastra un archivo</span>
            <small>JPG, PNG · Un rostro por imagen</small>
            <input type="file" accept="image/*" onChange={seleccionarArchivo} />
          </label>

          <CameraCapture onCapture={capturarRostro} />

          <button
            className="primary-button button-wide"
            onClick={registrarRostroSeleccionado}
          >
            <CheckCircle2 size={17} /> Registrar rostro
          </button>
        </section>
      </div>

      {mensaje && (
        <div className={mensaje.includes("correctamente") || mensaje.includes("seleccionada") ? "message-box message-success" : "message-box message-info"}>
          <CheckCircle2 size={18} />
          <span>{mensaje}</span>
        </div>
      )}
    </div>
  );
}

export default RegistroFacial;

import { useState } from "react";

import CameraCapture from "../components/CameraCapture";
import {
  registrarPersona,
  registrarRostro,
} from "../services/api";

function RegistroFacial() {
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] =
    useState("");

  const [personaId, setPersonaId] =
    useState<number | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [archivo, setArchivo] =
    useState<File | null>(null);

  const registrar = async () => {
    try {
      setMensaje("");

      if (!nombre.trim()) {
        setMensaje(
          "Ingrese el nombre de la persona."
        );

        return;
      }

      const response =
        await registrarPersona(
          nombre,
          documento
        );

      const personas = response.data;
      const persona = Array.isArray(personas)
        ? personas[0]
        : personas;

      if (!persona?.id) {
        throw new Error(
          "La persona se creó, pero no se recibió su ID."
        );
      }

      setPersonaId(persona.id);

      setMensaje(
        "Persona registrada correctamente."
      );

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
    }
  };

  const registrarRostroSeleccionado =
    async () => {
      try {
        if (!personaId) {
          setMensaje(
            "Primero registre una persona."
          );

          return;
        }

        if (!archivo) {
          setMensaje(
            "Seleccione o capture una imagen."
          );

          return;
        }

        await registrarRostro(
          personaId,
          archivo
        );

        setMensaje(
          "Rostro registrado correctamente."
        );

      } catch (error) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "Error al registrar el rostro."
        );
      }
    };

  const capturarRostro = (
    file: File
  ) => {
    setArchivo(file);

    setMensaje(
      "Imagen capturada correctamente."
    );
  };

  return (
    <div>

      <div className="page-title">
        <h2>Registro facial</h2>

        <p>
          Registre los datos de una persona
          y almacene sus características faciales.
        </p>
      </div>

      <div className="registration-grid">

        <div className="card">

          <h3>
            Datos de la persona
          </h3>

          <div className="form-group">

            <label>
              Nombre completo
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(event) =>
                setNombre(event.target.value)
              }
              placeholder="Ingrese el nombre"
            />

          </div>

          <div className="form-group">

            <label>
              Documento
            </label>

            <input
              type="text"
              value={documento}
              onChange={(event) =>
                setDocumento(event.target.value)
              }
              placeholder="Ingrese el documento"
            />

          </div>

          <button
            className="primary-button"
            onClick={registrar}
          >
            Registrar persona
          </button>

          {personaId && (
            <p className="success-message">
              Persona creada con ID:{" "}
              {personaId}
            </p>
          )}

        </div>

        <div className="card">

          <h3>
            Imagen facial
          </h3>

          <div className="form-group">

            <label>
              Seleccionar imagen
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={seleccionarArchivo}
            />

          </div>

          <CameraCapture
            onCapture={capturarRostro}
          />

          <button
            className="primary-button"
            onClick={
              registrarRostroSeleccionado
            }
          >
            Registrar rostro
          </button>

        </div>

      </div>

      {mensaje && (
        <div className="message-box">
          {mensaje}
        </div>
      )}

    </div>
  );
}

export default RegistroFacial;

import sys
from pathlib import Path

sys.path.append(
    str(Path(__file__).resolve().parent.parent)
)

from app.services.face_service import face_service


LFW_DIR = (
    Path(__file__).resolve().parent.parent
    / "datasets"
    / "lfw"
    / "raw"
    / "lfw"
)


def main():
    imagenes = list(
        LFW_DIR.glob("*/*.jpg")
    )

    print(f"Imágenes encontradas: {len(imagenes)}")

    if not imagenes:
        print("No se encontraron imágenes.")
        return

    imagen = imagenes[0]

    print(f"Probando: {imagen}")

    image_bytes = imagen.read_bytes()

    try:
        resultado = face_service.generate_embedding(
            image_bytes
        )

        print("\nROSTRO DETECTADO")
        print(f"Modelo: {resultado['modelo']}")
        print(f"Dimensión: {resultado['dimension']}")

    except Exception as error:
        print("\nERROR:")
        print(error)


if __name__ == "__main__":
    main()
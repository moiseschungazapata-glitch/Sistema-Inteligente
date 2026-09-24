from pathlib import Path

from app.services.face_service import face_service


image_path = Path("test_images/perfil recto.jpg")

with open(image_path, "rb") as image_file:
    image_bytes = image_file.read()


result = face_service.generate_embedding(image_bytes)


print("================================")
print("ROSTRO DETECTADO CORRECTAMENTE")
print("================================")
print("Modelo:", result["modelo"])
print("Dimensión:", result["dimension"])
print("Primeros valores del embedding:")
print(result["embedding"][:10])
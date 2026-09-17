# Sistema Inteligente de Reconocimiento Facial

Implementación del proyecto **Reconocimiento Facial y Análisis de Probabilidades**:
React + Vite + TypeScript + Tailwind CSS, FastAPI, Supabase/PostgreSQL,
OpenCV + InsightFace/ArcFace y scikit-learn.

## Funciones implementadas

- Inicio de sesión con Supabase Auth y roles administrador, operador y consulta.
- Registro de personas, consentimiento, edición, revocación y eliminación.
- Captura desde cámara o archivo; validación de calidad y embeddings faciales.
- Comparación por similitud coseno, umbral configurable e historial.
- Dashboard con estadísticas reales de la base de datos.
- Dataset verificado, entrenamiento de regresión logística, calibración y métricas.
- Auditoría, RLS, funciones SQL transaccionales y comando de retención.

No contiene cuentas, datos biométricos ni resultados de ejemplo cargados en producción.
Sin configuración, las operaciones muestran un error explícito: no se simula Supabase
ni un reconocimiento. Los datos sintéticos existen únicamente dentro de las pruebas.

## Estructura

```text
frontend/src/
  components/   CameraCapture, FaceResultCard, SimilarityBar, ProbabilityChart
  pages/        Dashboard, RegistroFacial, Reconocimiento, Probabilidades, Historial
  services/     Cliente HTTP de FastAPI
  types/        Contratos TypeScript
backend/
  app/
    core/       Configuración y autorización
    database/   Conexión Supabase y schema.sql
    models/     Modelos de respuesta
    schemas/    Validación de entradas
    services/   Procesamiento facial, embeddings y ML
    api/routes/ Endpoints REST
  models/       Pesos faciales y artefactos ML locales (fuera de Git)
  tests/        Pruebas del backend
```

Se sigue la estructura detallada del PDF. Se añaden los archivos necesarios para
autenticación, SQL, configuración y pruebas. La persistencia utiliza la API de
Supabase desde FastAPI; no es necesario un ORM ni exponer conexiones PostgreSQL
al navegador. Los modelos de `app/models` son contratos de respuesta Pydantic.

## Puesta en marcha

1. Ejecuta `backend/app/database/schema.sql` en el SQL Editor de Supabase.
2. Completa `backend/.env` según `backend/.env.example`; no compartas sus secretos.
3. Crea un usuario en Supabase Authentication y asígnale un perfil con
   `python -m app.manage_user` (instrucciones en `backend/README.md`).
4. Instala las dependencias del backend y descarga los pesos con
   `python -m app.setup_model`. Configura un umbral evaluado en `FACE_THRESHOLD`.
5. Arranca FastAPI y el frontend en terminales separadas.

Backend, desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Frontend, desde `frontend` (Node.js 24):

```powershell
npm ci
npm run dev
```

El frontend usa `http://localhost:8000/api` de forma predeterminada. Puedes cambiarlo
con `VITE_API_URL` en `frontend/.env`. Nunca uses variables `VITE_` para claves secretas.

## Verificación

Frontend: `npm run lint` y `npm run build`.
Backend: desde `backend`, `.\.venv\Scripts\python.exe -m pytest -q`.

Se verificaron localmente las restricciones y funciones SQL con PostgreSQL embebido,
incluida la denegación de acceso a roles del navegador. Esto no sustituye la prueba
de integración en tu Supabase. Consulta `backend/README.md` para configuración,
modelo facial, dataset, calibración, retención y límites del sistema.

## Límites de la entrega

El código está implementado, pero conectar tu Supabase requiere credenciales y
ejecutar el SQL. Evaluar el umbral, entrenar ML y medir precisión requiere ejemplos
reales consentidos y etiquetas verificadas. No se ha desplegado el sistema en internet.
Los pesos de InsightFace tienen condiciones de uso distintas del código:
https://github.com/deepinsight/insightface#license

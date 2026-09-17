# Backend — Sistema Inteligente

API FastAPI con Supabase/PostgreSQL, OpenCV, InsightFace/ArcFace y scikit-learn.
Sigue la estructura detallada de las páginas 8–9 del PDF.

## Preparación (PowerShell, desde backend)

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-face.txt
Copy-Item .env.example .env
```

En esta máquina ya se creó `.venv`. No sobreescribas `.env` si contiene tu configuración.
InsightFace 0.7.3 puede necesitar Microsoft C++ Build Tools en Windows. Python 3.13
es el intérprete usado en esta implementación. `requirements.txt` permite ejecutar
la API y sus pruebas sin instalar todavía el motor facial; `requirements-face.txt`
añade InsightFace y ONNX Runtime. Los archivos lock registran las versiones verificadas.

## Supabase

1. Ejecuta **app/database/schema.sql** completo en SQL Editor. También amplía el
   esquema de ocho tablas entregado anteriormente, añadiendo `grupo_validacion` y
   funciones transaccionales. No elimina datos existentes.
2. Configura `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `.env`. Se admite clave secreta
   del servidor o la antigua `service_role`. No ponerlas en React ni en Git.
3. Crea un usuario en Supabase Authentication y copia su UUID. Asígnale un perfil:

```powershell
.\.venv\Scripts\python.exe -m app.manage_user --user-id UUID_DEL_USUARIO --nombre "Administrador" --rol administrador
```

La misma herramienta permite dar roles `operador` y `consulta` a otros usuarios ya
creados en Authentication. No hay registro público ni un administrador por defecto.
Las contraseñas se administran en Supabase Auth. El navegador recibe un access token
que mantiene solo en memoria; tras recargar o caducar debe iniciar sesión otra vez.

Todas las tablas tienen RLS y privilegios revocados para `anon` y `authenticated`.
La API verifica cada token con Supabase y consulta el perfil activo antes de usar
la clave de servidor. `consulta` lee, `operador` registra/reconoce/revoca y
`administrador` además elimina, entrena y ejecuta retención. Las funciones SQL
solo pueden ejecutarse con el rol de servidor. La clave de servidor no debe
compartirse: tiene privilegios elevados y la autorización reside en FastAPI.

## Modelo facial

```powershell
.\.venv\Scripts\python.exe -m app.setup_model
```

Descarga `buffalo_l` desde InsightFace, en `models/models/buffalo_l`. La API nunca
descarga modelos al recibir una imagen. Las fotos se procesan en memoria y no se
guardan; solo se persiste el embedding. Se rechazan archivos inválidos, más de un
rostro, imágenes de más de 8 MB o 16 megapíxeles, rostros pequeños y baja calidad.
Los controles de calidad son heurísticos, no un detector de suplantación.

Configura `FACE_THRESHOLD` después de evaluar positivos y negativos del dominio.
No existe un umbral universal y se dejó vacío deliberadamente. Sin él, la API
devuelve 503 al reconocer. `FACE_MODEL_VERSION` identifica los pesos empleados:
cámbialo si sustituyes los pesos y vuelve a registrar/evaluar los embeddings.

El código de InsightFace y sus pesos tienen condiciones distintas. Los pesos
distribuidos se ofrecen para investigación no comercial; revisa la licencia antes
de otro uso: https://github.com/deepinsight/insightface#license

## Ejecución

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Salud: http://127.0.0.1:8000/api/health
- Contrato interactivo: http://127.0.0.1:8000/docs
- `GET /api/estado`: comprueba base de datos, archivos de modelo y umbral (autenticado).

Se implementan los endpoints propuestos en el PDF, junto con login, perfil,
edición/eliminación/revocación de personas, carga de datasets y retención.
Los errores no devuelven contraseñas, embeddings ni respuestas privadas de Supabase.

## Machine Learning

Un administrador carga un array JSON desde la pantalla Probabilidades. Cada fila:

```json
{
  "similitud": 0.8,
  "distancia": 0.2,
  "calidad_imagen": 0.9,
  "iluminacion": 0.5,
  "resultado_real": true,
  "fuente_validacion": "Referencia de verificación independiente",
  "grupo_validacion": "grupo-persona-sesion"
}
```

Es un ejemplo de formato, no un dataset para entrenar. Puedes incluir
`recognition_log_id` para enlazarlo con el historial. La distancia es coseno:
`1 - similitud`. Calidad e iluminación están normalizadas entre 0 y 1.

El entrenamiento necesita al menos 60 filas y 10 grupos independientes con ambas
clases representadas en cada partición. Son mínimos técnicos, no garantía de
validez. Un grupo debe reunir todas las observaciones relacionadas por persona o
sesión, sin compartir identidades entre grupos. Las etiquetas se verifican de forma
independiente; no se copian de la decisión automática.

Se separan grupos para entrenamiento (aprox. 60 %), calibración (20 %) y prueba
(20 %). Se entrena StandardScaler + LogisticRegression, se calibra por sigmoid
con datos separados y se informa precisión, recall, F1, FPR, FNR, matriz de confusión
y Brier score. Los IDs de cada partición se conservan en los metadatos del modelo.
Para una evaluación final independiente, reserva otro conjunto externo: reutilizar
el test al ajustar iterativamente el sistema introduce sesgo.

Los artefactos joblib son locales y solo los genera el servidor; nunca cargues
archivos joblib/pickle ajenos. Cuando no hay modelo calibrado, la probabilidad es
`null`: no se transforma la similitud en un porcentaje inventado.

## Consentimiento, auditoría y retención

Registrar una persona y su consentimiento es una transacción. Registrar un rostro
vuelve a verificar bajo bloqueo que persona y consentimiento sigan activos.
Revocar elimina sus embeddings, historial y ejemplos vinculados; también desactiva
los modelos ML que se entrenaron/evaluaron con esos ejemplos. Los artefactos
desactivados requieren eliminación del disco según la política de la organización.
Los datasets importados sin vínculo deben gestionar sus consentimientos y retención
en el proceso de recopilación externo; evita importarlos sin esa trazabilidad.

`RETENTION_DAYS=90` es una configuración inicial editable, no un plazo legal.
Los embeddings vencidos no se utilizan. Para borrar físicamente los vencidos:

```powershell
.\.venv\Scripts\python.exe -m app.maintenance
```

También hay un botón de administrador en Probabilidades. Programa este comando
en tu servidor para aplicar la retención regularmente; no hay tarea programada
instalada en tu equipo. La auditoría conserva referencias, no biometría, y el backend
no puede actualizar ni borrar sus filas. Define por separado su conservación.

## Pruebas

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Prueban autenticación, roles, validación, coseno, imágenes inválidas, particiones
sin grupos compartidos y entrenamiento/calibración con datos sintéticos aislados.
Estas pruebas no miden la precisión real del reconocimiento facial. La integración
completa necesita tu proyecto Supabase, usuarios, consentimientos y datos reales.

Para publicar: HTTPS, dominios CORS explícitos, almacenamiento persistente de modelos,
gestión de secretos y límites de solicitudes en el proxy. La comparación no incorpora
prueba de vida y no debe ser el único factor en decisiones importantes.

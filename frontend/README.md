# Frontend

React + TypeScript + Vite + Tailwind CSS. Las cinco páginas y los cuatro componentes
siguen el PDF. Axios conecta exclusivamente con FastAPI; React no recibe claves de
servidor ni embeddings. React Webcam captura imágenes y Recharts representa métricas.

```powershell
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

Configura `VITE_API_URL` según `.env.example` si cambia la dirección de FastAPI.
Inicia sesión con una cuenta de Supabase Auth que tenga un perfil activo. La sesión
solo permanece en memoria y al recargar se debe volver a entrar. Las cámaras requieren
localhost o HTTPS y permiso del navegador.

La pantalla de Probabilidades permite al administrador cargar ejemplos JSON,
entrenar un modelo y ejecutar la limpieza por retención. Los roles de consulta no
pueden registrar personas ni reconocer rostros. La API también comprueba los roles:
ocultar botones no es el control de seguridad.

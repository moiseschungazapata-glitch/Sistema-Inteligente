# Sistema Inteligente

Base inicial del proyecto con un frontend construido con React, TypeScript y Vite.

## Estado actual

- El frontend muestra la pantalla de bienvenida y el contador de la plantilla de Vite.
- Están declaradas dependencias para peticiones HTTP (Axios), iconos (Lucide), cámara web (React Webcam) y gráficos (Recharts); todavía no se utilizan en la aplicación.
- Este repositorio todavía no contiene un backend, una base de datos ni modelos de inteligencia artificial.

## Estructura

```text
frontend/
  public/             Recursos públicos
  src/                Componentes, estilos y recursos de React
  package.json        Dependencias y comandos
  package-lock.json   Versiones de dependencias
  vite.config.ts      Configuración de Vite
```

## Ejecutar localmente

Requisito: Node.js 24 LTS con npm.

```bash
git clone https://github.com/moiseschungazapata-glitch/Sistema-Inteligente.git
cd Sistema-Inteligente/frontend
npm ci
npm run dev
```

Abre la dirección que Vite indique en la terminal.

## Verificaciones y compilación

Desde `frontend`:

```bash
npm run lint
npm run build
npm run preview
```

La compilación genera `frontend/dist`. El comando `preview` permite revisar esa compilación localmente.

## Archivos locales

Git excluye las dependencias (`node_modules`), el entorno Python local (`venv`), las compilaciones y los archivos `.env`. Las dependencias del frontend se reinstalan con `npm ci`. El entorno Python no es necesario para ejecutar el frontend actual.

Subir el código a GitHub no publica automáticamente la aplicación como sitio web.

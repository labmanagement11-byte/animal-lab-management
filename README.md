# Animal Lab Management

Proyecto importado desde Replit. Interfaz web + servidor para la gestión de animales en laboratorio (frontend con Vite/React y servidor con Express/TypeScript).

## Contenido del repositorio
- Código y configuración: package.json, tsconfig.json, vite.config.ts, etc.
- Imágenes y mockups usados en la UI.
- Archivos de configuración de Tailwind/PostCSS y scripts para build.

## Requisitos
- Node.js >= 16
- npm (o pnpm/yarn)

## Instalación
1. Clona o descarga el repositorio y sitúate en la carpeta del proyecto.
2. Instala dependencias:

```
npm install
```

## Comandos disponibles
- Desarrollo (Linux/macOS/Replit):

```
npm run dev
```

Esto ejecuta `NODE_ENV=development tsx server/index.ts`.

- Si usas Windows y `npm run dev` falla por la variable NODE_ENV, puedes:
  - Usar PowerShell:

```
$env:NODE_ENV = "development"
npx tsx server/index.ts
```

  - O instalar cross-env y ejecutar:

```
npm install -D cross-env
npx cross-env NODE_ENV=development tsx server/index.ts
```

- Construir para producción:

```
npm run build
```

- Ejecutar la build (después de build):

```
npm start
```

- Comprobar tipos (TypeScript):

```
npm run check
```

- Migraciones / push de esquema (Drizzle):

```
npm run db:push
```

Nota: `db:push` requiere la variable de entorno de conexión a la base de datos (ver .env.example).

## Variables de entorno (ejemplo)
Crea un archivo `.env` en la raíz con las variables necesarias (no lo subas al repo). Usa `.env.example` como plantilla.

Variables recomendadas:
- DATABASE_URL
- PORT (opcional)
- NODE_ENV
- SESSION_SECRET
- RESEND_API_KEY (si usas Resend)
- GOOGLE_APPLICATION_CREDENTIALS o GCP_STORAGE_BUCKET (si usas Google Cloud Storage)

## Siguientes pasos sugeridos
- Añadir `.gitignore` para evitar subir node_modules y archivos sensibles.
- Crear `.env.example` con las variables necesarias (sin valores reales).
- Revisar las dependencias y ajustar scripts si quieres simplificar el arranque.
- Añadir instrucciones de deploy (Vercel, Render, Railway, etc).

## Deployment Instructions

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables:
   - `PORT` (automatically set by Render)
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - Any other required variables from `.env.example`
5. Deploy! Your app will be available at the Render-provided URL

### Deploy to Replit

1. Import your GitHub repository into [Replit](https://replit.com)
2. Replit will automatically detect the Node.js environment
3. Set up Secrets (environment variables) in the Replit sidebar:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - Any other required variables from `.env.example`
4. Click the "Run" button - Replit will execute `npm start`
5. Your app will be available at the Replit-provided URL

**Note**: The server is configured to bind to `0.0.0.0` and use `process.env.PORT` for compatibility with cloud platforms.

---
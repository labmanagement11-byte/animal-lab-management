# 🔬 Animal Lab Management System - Complete Project Overview

## 📋 Descripción General

Sistema completo de gestión de laboratorio de animales con funcionalidades avanzadas de seguimiento, códigos QR, y gestión multi-empresa (multi-tenancy).

**Importado desde Replit** - Sistema web full-stack profesional para laboratorios de investigación.

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Frontend 🎨
- **Framework**: React 18 con TypeScript
- **Enrutamiento**: Wouter (ligero y eficiente)
- **Construcción**: Vite (ultra rápido)
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado del Servidor**: TanStack React Query
- **Formularios**: React Hook Form + Zod
- **Iconos**: Lucide React
- **Componentes UI**: Radix UI (accesibilidad completa)

#### Backend ⚙️
- **Runtime**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Drizzle ORM
- **Base de Datos**: PostgreSQL (Neon Database)
- **Autenticación**: Replit Auth (OIDC) + Local (email/password)
- **Sesiones**: PostgreSQL-backed sessions (connect-pg-simple)
- **Almacenamiento**: Replit Object Storage (archivos)

---

## 📁 Estructura del Proyecto

\`\`\`
animal-lab-management/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── contexts/           # Context providers (tema, idioma, empresa)
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilidades y configuración
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── dashboard.tsx   # Panel principal
│   │   │   ├── animals.tsx     # Gestión de animales
│   │   │   ├── cages.tsx       # Gestión de jaulas
│   │   │   ├── qr-scanner.tsx  # Escáner de códigos QR
│   │   │   ├── qr-codes.tsx    # Gestión de códigos QR
│   │   │   ├── companies.tsx   # Gestión de empresas
│   │   │   ├── users.tsx       # Gestión de usuarios
│   │   │   ├── strains.tsx     # Cepas de animales
│   │   │   ├── genotypes.tsx   # Genotipos
│   │   │   ├── reports.tsx     # Reportes
│   │   │   └── ...
│   │   ├── utils/              # Funciones de utilidad
│   │   ├── App.tsx             # Componente principal
│   │   └── main.tsx            # Punto de entrada
│   └── index.html              # Template HTML
│
├── server/                      # Backend Express
│   ├── index.ts                # Servidor principal
│   ├── routes.ts               # Definición de rutas API (2979 líneas)
│   ├── db.ts                   # Configuración de base de datos
│   ├── storage.ts              # Capa de acceso a datos
│   ├── replitAuth.ts           # Autenticación
│   ├── objectStorage.ts        # Almacenamiento de archivos
│   ├── email.ts                # Servicio de email
│   └── vite.ts                 # Integración con Vite
│
├── shared/                      # Código compartido
│   └── schema.ts               # Esquema de base de datos (Drizzle)
│
├── dist/                        # Archivos compilados (generados)
│   ├── public/                 # Frontend compilado
│   └── index.js                # Backend compilado
│
├── attached_assets/            # Assets del proyecto
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración TypeScript
├── vite.config.ts              # Configuración Vite
├── tailwind.config.ts          # Configuración Tailwind
├── drizzle.config.ts           # Configuración Drizzle
├── .env                        # Variables de entorno (NO SUBIR)
├── env.example                 # Ejemplo de variables de entorno
└── README.md                   # Documentación
\`\`\`

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

1. **companies** - Empresas/organizaciones (multi-tenancy)
   - id, name, description, isActive
   
2. **users** - Usuarios del sistema
   - id, companyId, email, firstName, lastName
   - role: Admin, Director, Employee
   - authProvider: oidc, local
   - passwordHash (para autenticación local)
   
3. **cages** - Jaulas de animales
   - id, companyId, cageNumber, roomNumber, location
   - status: Active, Breeding, Holding, Experimental
   - strainId, capacity, gender
   
4. **animals** - Animales individuales
   - id, companyId, cageId, animalNumber
   - strainId, genotypeId, weight, gender
   - birthDate, healthStatus, diseaseModel
   
5. **strains** - Cepas de animales
   - id, companyId, name, description, supplier
   
6. **genotypes** - Genotipos
   - id, companyId, name, description
   
7. **qrCodes** - Códigos QR para identificación
   - id, companyId, code, status (available, unused, used)
   - entityType (animal, cage), entityId
   - label, color (para impresión)
   
8. **genotypingReports** - Reportes de genotipado
   - id, companyId, fileName, filePath, fileSize
   
9. **userInvitations** - Invitaciones de usuarios
   - id, companyId, email, role, token, status

---

## ✨ Características Principales

### 1. Gestión de Animales 🐭
- ✅ Creación individual o por lotes (batch)
- ✅ Entrada de datos individual para lotes
- ✅ Función "Copiar último animal" para entrada rápida
- ✅ Tracking completo: peso, genoma, salud, edad
- ✅ Historial de auditoría
- ✅ Asignación a jaulas
- ✅ Estados de salud y modelos de enfermedad

### 2. Gestión de Jaulas 🏠
- ✅ Diferentes tipos: Active, Breeding, Holding, Experimental
- ✅ Capacidad y ubicación
- ✅ Asociación con cepas
- ✅ Campos condicionales según tipo
- ✅ Habitaciones predefinidas (BB00028, ZRC-C61, ZRC-SC14)

### 3. Códigos QR 📱
- ✅ Generación dinámica con metadata
- ✅ Escaneo con cámara (html5-qrcode)
- ✅ Códigos "blank" para impresión en hojas Avery 8160
- ✅ Ciclo de vida: available → unused → used
- ✅ Memoria de colores por cepa
- ✅ Exportación multi-formato (CSV, Excel, PDF)
- ✅ Controles avanzados de cámara:
  - Control de zoom
  - Enfoque manual/automático
  - Cámara trasera optimizada (60 FPS)
  - Detección continua

### 4. Multi-Tenancy (Multi-Empresa) 🏢
- ✅ Aislamiento completo de datos por empresa
- ✅ Modo de vista de empresa para Admins
- ✅ Banner visual mostrando empresa activa
- ✅ Validación automática de permisos
- ✅ Header `X-Company-Id` para contexto de empresa

### 5. Autenticación y Autorización 🔐
- ✅ Doble autenticación: Replit Auth (OIDC) + Local
- ✅ Roles: Admin, Director, Employee
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Sesiones persistentes en PostgreSQL
- ✅ Soft delete de usuarios (papelera)
- ✅ Restauración automática de usuarios

### 6. Reportes de Genotipado 📊
- ✅ Subida de archivos PDF y Excel (50MB max)
- ✅ Asociación multi-cepa
- ✅ Almacenamiento seguro (Replit Object Storage)
- ✅ Control de acceso ACL
- ✅ Gestión completa: listar, descargar, eliminar

### 7. Dashboard 📈
- ✅ Estadísticas en tiempo real
- ✅ Tarjetas resumen (animales, jaulas, QR codes)
- ✅ Gráficos interactivos
- ✅ Filtros por empresa (Admin)

### 8. Interfaz Móvil 📱
- ✅ Diseño mobile-first
- ✅ Navegación táctil optimizada
- ✅ Botones de acción flotantes
- ✅ Menú hamburguesa
- ✅ Navegación inferior (bottom nav)
- ✅ Controles táctiles (44px+)

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js >= 16
- PostgreSQL (local o Neon Database)
- npm, pnpm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
\`\`\`bash
git clone https://github.com/labmanagement11-byte/animal-lab-management.git
cd animal-lab-management
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar variables de entorno**
\`\`\`bash
cp env.example .env
# Editar .env con tus credenciales
\`\`\`

Variables requeridas:
\`\`\`env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
SESSION_SECRET="tu-secret-aqui"
NODE_ENV=development
PORT=5000
\`\`\`

4. **Inicializar base de datos**
\`\`\`bash
npm run db:push
\`\`\`

5. **Crear usuario administrador inicial**
\`\`\`bash
node create-admin.js
\`\`\`

---

## 🎮 Uso del Sistema

### Desarrollo

**Modo desarrollo** (con hot-reload):
\`\`\`bash
npm run dev
\`\`\`
El servidor estará en http://localhost:5000

### Producción

1. **Construir el proyecto**:
\`\`\`bash
npm run build
\`\`\`

2. **Ejecutar en producción**:
\`\`\`bash
npm start
\`\`\`

### Otros Comandos

- **Verificar tipos TypeScript**:
\`\`\`bash
npm run check
\`\`\`

- **Push de esquema a base de datos**:
\`\`\`bash
npm run db:push
\`\`\`

---

## 📊 APIs Principales

### Autenticación
- `POST /api/login/local` - Login con email/password
- `POST /api/logout` - Cerrar sesión
- `GET /api/user` - Obtener usuario actual

### Animales
- `GET /api/animals` - Listar animales
- `POST /api/animals` - Crear animal(es)
- `PUT /api/animals/:id` - Actualizar animal
- `DELETE /api/animals/:id` - Eliminar animal
- `GET /api/animals/search` - Buscar animales

### Jaulas
- `GET /api/cages` - Listar jaulas
- `POST /api/cages` - Crear jaula
- `PUT /api/cages/:id` - Actualizar jaula
- `DELETE /api/cages/:id` - Eliminar jaula

### Códigos QR
- `GET /api/qr-codes` - Listar códigos QR
- `POST /api/qr-codes` - Generar códigos QR
- `POST /api/qr-codes/generate-blank` - Generar códigos blank
- `POST /api/qr-codes/print-multiple` - Imprimir múltiples códigos
- `GET /api/qr-codes/:code` - Obtener por código

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/recent-activity` - Actividad reciente

### Empresas (Admin only)
- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Crear empresa
- `PUT /api/companies/:id` - Actualizar empresa

### Usuarios (Admin only)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Soft delete usuario

---

## 🎨 Capturas de Pantalla

El proyecto incluye múltiples screenshots de la interfaz:
- `dashboard_final.png` - Panel principal
- `mobile_*.png` - Vistas móviles
- `after_signin.png` - Vista después de login
- `qr-codes-counts.png` - Dashboard de códigos QR
- `blank-qr-used-tab.png` - Gestión de códigos QR

---

## 🔧 Mejoras Sugeridas

### Seguridad
- [ ] Implementar rate limiting en login
- [ ] Agregar 2FA (autenticación de dos factores)
- [ ] Implementar CSRF tokens
- [ ] Auditoría de seguridad completa

### Funcionalidades
- [ ] Exportación masiva de datos
- [ ] Notificaciones por email
- [ ] Sistema de alertas (salud, capacidad)
- [ ] Integración con equipos de laboratorio
- [ ] API pública para integraciones
- [ ] Modo offline (PWA)

### Performance
- [ ] Paginación en listados grandes
- [ ] Caché de queries frecuentes
- [ ] Optimización de imágenes
- [ ] CDN para assets estáticos
- [ ] Lazy loading de componentes

### UX/UI
- [ ] Tour guiado para nuevos usuarios
- [ ] Temas personalizables
- [ ] Atajos de teclado
- [ ] Búsqueda avanzada con filtros
- [ ] Vistas personalizables

### DevOps
- [ ] CI/CD pipeline
- [ ] Tests automatizados
- [ ] Monitoreo y logging
- [ ] Backups automáticos
- [ ] Documentación de API (Swagger)

---

## 📝 Notas Importantes

1. **Base de Datos**: El sistema requiere PostgreSQL. Puedes usar:
   - Neon Database (serverless, recomendado)
   - PostgreSQL local
   - Heroku Postgres
   - Supabase

2. **Archivos Sensibles**: 
   - NO subir `.env` al repositorio
   - Usar `.env.example` como plantilla
   - Mantener secrets seguros

3. **Desarrollo**: 
   - El modo dev usa Vite con HMR
   - El servidor se reinicia automáticamente con tsx
   - Los cambios se reflejan en tiempo real

4. **Producción**:
   - Construir antes de deployar
   - Configurar variables de entorno en hosting
   - Usar HTTPS siempre
   - Configurar CORS apropiadamente

---

## 🤝 Contribuir

Este proyecto está listo para mejoras colaborativas. Para contribuir:

1. Hacer fork del repositorio
2. Crear una rama para tu feature
3. Hacer commits descriptivos
4. Hacer push a tu fork
5. Crear un Pull Request

---

## 📄 Licencia

MIT License - Ver archivo LICENSE

---

## 👥 Soporte

Para preguntas o soporte:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

---

**¡El proyecto está completamente funcional y listo para usar!** 🎉

Solo necesitas configurar la base de datos y podrás empezar a gestionar tu laboratorio de animales de manera profesional.

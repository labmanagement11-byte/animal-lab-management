# 📋 Catálogo Completo de Funcionalidades

## 🎯 Sistema Animal Lab Management - Todas las Características

---

## 📄 Páginas Principales

### 1. 🏠 Dashboard (dashboard.tsx)
**Descripción**: Panel de control central con estadísticas y resumen

**Funcionalidades**:
- ✅ Tarjetas de resumen:
  - Total de animales activos
  - Total de jaulas en uso
  - Códigos QR generados
  - Alertas de salud
- ✅ Gráficos de ocupación
- ✅ Actividad reciente
- ✅ Accesos rápidos a funciones comunes
- ✅ Filtros por empresa (para Admins)
- ✅ Vista en tiempo real

**Permisos**: Todos los usuarios autenticados

---

### 2. 🐭 Animals (animals.tsx)
**Descripción**: Gestión completa de animales de laboratorio

**Funcionalidades**:
- ✅ **Listado de animales**:
  - Vista de tabla con paginación
  - Búsqueda y filtros avanzados
  - Ordenamiento por columnas
  - Selección múltiple

- ✅ **Crear animales**:
  - Formulario individual
  - Creación por lotes (batch)
  - Entrada de datos individual para lotes
  - Auto-incremento de números
  - Validación en tiempo real

- ✅ **Función "Copiar Último Animal"**:
  - Guarda último animal en localStorage
  - Auto-completa todos los campos
  - Número generado automáticamente
  - Acelera entrada de datos

- ✅ **Editar/Actualizar**:
  - Edición inline
  - Formulario modal
  - Historial de cambios

- ✅ **Información rastreada**:
  - Número de animal
  - Cepa (strain)
  - Genotipo
  - Peso
  - Género (Male/Female)
  - Fecha de nacimiento
  - Estado de salud
  - Modelo de enfermedad
  - Jaula asignada
  - Código QR asociado

- ✅ **Acciones**:
  - Asignar a jaula
  - Generar código QR
  - Actualizar estado de salud
  - Mover entre jaulas
  - Exportar datos
  - Eliminar (soft delete)

**Permisos**: Employee, Director, Admin

---

### 3. 🏠 Cages (cages.tsx)
**Descripción**: Administración de jaulas y alojamiento

**Funcionalidades**:
- ✅ **Tipos de jaulas**:
  - Active (activa)
  - Breeding (reproducción)
  - Holding (mantenimiento)
  - Experimental (experimental)

- ✅ **Información de jaula**:
  - Número de jaula
  - Habitación (BB00028, ZRC-C61, ZRC-SC14)
  - Ubicación física
  - Capacidad máxima
  - Cepa asociada
  - Estado (activa/inactiva)

- ✅ **Campos condicionales**:
  - Género (para Holding/Experimental)
  - Fecha inicio reproducción (para Breeding)

- ✅ **Gestión de animales**:
  - Ver animales en jaula
  - Agregar animales
  - Remover animales
  - Verificar capacidad

- ✅ **Códigos QR**:
  - Asignar código QR a jaula
  - Escanear para acceso rápido

**Permisos**: Employee, Director, Admin

---

### 4. 📱 QR Scanner (qr-scanner.tsx)
**Descripción**: Escáner de códigos QR con cámara

**Funcionalidades**:
- ✅ **Escaneo con cámara**:
  - Cámara trasera optimizada
  - 60 FPS para escaneo rápido
  - Detección continua
  - Auto-enfoque

- ✅ **Controles avanzados**:
  - Control de zoom (si compatible)
  - Enfoque manual/automático
  - Slider de distancia de enfoque
  - Detección de capacidades

- ✅ **Optimización móvil**:
  - Botones táctiles 44px+
  - Dual touch/mouse
  - Indicadores visuales
  - UI en español

- ✅ **Comportamiento inteligente**:
  - QR de animal → Detalles del animal
  - QR blank → Crear jaula nueva
  - Asignación automática
  - Historial de escaneos

- ✅ **Caja de detección**:
  - 300x300px optimizado
  - Visual feedback
  - Feedback sonoro (opcional)

**Permisos**: Todos los usuarios autenticados

---

### 5. 🎫 QR Codes (qr-codes.tsx)
**Descripción**: Gestión completa de códigos QR

**Funcionalidades**:
- ✅ **Dashboard de QR**:
  - Tarjetas de resumen (Used, Blank, Deleted)
  - Contadores en tiempo real
  - Selección interactiva
  - Exportación multi-formato

- ✅ **Generar códigos**:
  - Para animales específicos
  - Códigos "blank" en lote
  - 30 códigos por batch (Avery 8160)
  - Personalización de etiquetas

- ✅ **Ciclo de vida**:
  - available → sin usar
  - unused → generado pero no asignado
  - used → asignado a animal/jaula
  - Transición unidireccional

- ✅ **Impresión**:
  - Formato Avery 8160 (3x10)
  - Etiquetas personalizadas
  - Código QR + texto
  - Barra de pie con info
  - Vista previa antes de imprimir

- ✅ **Memoria de colores**:
  - Auto-guarda color por cepa
  - Auto-completado
  - Override manual

- ✅ **Exportar**:
  - CSV para análisis
  - Excel para reportes
  - PDF para documentación
  - Naming automático

- ✅ **Gestión**:
  - Marcar como usado
  - Actualizar estado
  - Eliminar
  - Restaurar

**Permisos**: Employee, Director, Admin

---

### 6. 🎫 Blank QR (blank-qr.tsx)
**Descripción**: Generación masiva de códigos QR en blanco

**Funcionalidades**:
- ✅ Generar 30 códigos por lote
- ✅ Etiquetas personalizadas
- ✅ Colores por cepa
- ✅ Auto-fill de información
- ✅ Impresión directa
- ✅ Formato Avery 8160

**Permisos**: Employee, Director, Admin

---

### 7. 🧬 Strains (strains.tsx)
**Descripción**: Catálogo de cepas de animales

**Funcionalidades**:
- ✅ Crear/editar cepas
- ✅ Descripción detallada
- ✅ Proveedor
- ✅ Asociar colores (para QR)
- ✅ Ver animales por cepa
- ✅ Estadísticas de uso

**Permisos**: Director, Admin

---

### 8. 🔬 Strain Detail (strain-detail.tsx)
**Descripción**: Vista detallada de una cepa específica

**Funcionalidades**:
- ✅ Información completa de cepa
- ✅ Lista de animales
- ✅ Gráficos de distribución
- ✅ Historial de uso
- ✅ Reportes de genotipado asociados

**Permisos**: Todos los usuarios autenticados

---

### 9. 🧬 Genotypes (genotypes.tsx)
**Descripción**: Gestión de genotipos

**Funcionalidades**:
- ✅ Crear/editar genotipos
- ✅ Descripción
- ✅ Asociar a animales
- ✅ Filtros y búsqueda

**Permisos**: Director, Admin

---

### 10. 📊 Genotyping Reports (genotyping-reports.tsx)
**Descripción**: Subida y gestión de reportes de genotipado

**Funcionalidades**:
- ✅ **Subida de archivos**:
  - PDF y Excel
  - Máximo 50MB
  - Drag & drop
  - Validación de tipo

- ✅ **Asociación multi-cepa**:
  - Many-to-many relationship
  - Selección múltiple
  - Auto-sugerencias

- ✅ **Almacenamiento seguro**:
  - Replit Object Storage
  - Control ACL
  - Solo usuarios autenticados

- ✅ **Gestión**:
  - Listar reportes
  - Descargar
  - Eliminar
  - Buscar

- ✅ **Metadata**:
  - Nombre archivo
  - Tamaño
  - Fecha subida
  - Usuario que subió
  - Cepas asociadas

**Permisos**: Director, Admin

---

### 11. 🏢 Companies (companies.tsx)
**Descripción**: Gestión de empresas (multi-tenancy)

**Funcionalidades**:
- ✅ **Listado de empresas**:
  - Tarjetas interactivas
  - Estado (activa/inactiva)
  - Estadísticas por empresa

- ✅ **Crear empresa**:
  - Nombre
  - Descripción
  - Estado inicial

- ✅ **Modo vista de empresa** (Admin only):
  - Click en empresa → ver todo el sistema filtrado
  - Banner visual de empresa activa
  - Botón "Exit Company View"
  - Badge en sidebar
  - Header X-Company-Id automático

- ✅ **Editar/Desactivar**:
  - Actualizar información
  - Cambiar estado
  - Ver métricas

**Permisos**: Admin only

---

### 12. 🏢 Company Detail (company-detail.tsx)
**Descripción**: Vista detallada de una empresa

**Funcionalidades**:
- ✅ Información completa
- ✅ Lista de usuarios
- ✅ Estadísticas detalladas
- ✅ Datos de animales/jaulas
- ✅ Actividad reciente

**Permisos**: Admin only

---

### 13. 👥 Users (users.tsx)
**Descripción**: Administración de usuarios

**Funcionalidades**:
- ✅ **Listar usuarios**:
  - Filtros por rol
  - Filtros por empresa
  - Estado (activo/bloqueado/eliminado)

- ✅ **Crear usuario**:
  - Email
  - Nombre completo
  - Rol (Admin/Director/Employee)
  - Empresa asignada
  - Password (autenticación local)

- ✅ **Restauración automática**:
  - Email duplicado → restaura usuario eliminado
  - Actualiza información
  - No crea duplicados

- ✅ **Roles**:
  - **Admin**: Acceso total, multi-empresa
  - **Director**: Gestión completa de su empresa
  - **Employee**: Operaciones diarias

- ✅ **Acciones**:
  - Editar información
  - Cambiar rol
  - Bloquear/Desbloquear
  - Soft delete (papelera)
  - Restaurar
  - Eliminar permanentemente (después 10 días)

- ✅ **Invitaciones**:
  - Enviar invitación por email
  - Token único
  - Expiración automática

**Permisos**: Admin, Director (limitado a su empresa)

---

### 14. 🗑️ Trash (trash.tsx)
**Descripción**: Papelera de elementos eliminados

**Funcionalidades**:
- ✅ **Ver eliminados**:
  - Usuarios
  - Animales
  - Jaulas
  - Códigos QR

- ✅ **Restaurar**:
  - Restauración individual
  - Restauración masiva
  - Validaciones de integridad

- ✅ **Eliminar permanentemente**:
  - Confirmación doble
  - No reversible
  - Cleanup automático después 10 días

- ✅ **Filtros**:
  - Por tipo
  - Por fecha
  - Por usuario que eliminó

**Permisos**: Admin, Director

---

### 15. 📈 Reports (reports.tsx)
**Descripción**: Generación de reportes y análisis

**Funcionalidades**:
- ✅ **Tipos de reporte**:
  - Inventario de animales
  - Ocupación de jaulas
  - Estado de salud
  - Uso de códigos QR
  - Actividad por usuario

- ✅ **Exportación**:
  - CSV
  - Excel
  - PDF
  - Gráficos incluidos

- ✅ **Filtros**:
  - Rango de fechas
  - Por empresa
  - Por cepa
  - Por ubicación

- ✅ **Visualizaciones**:
  - Gráficos de barras
  - Gráficos de línea
  - Gráficos de pastel
  - Tablas detalladas

**Permisos**: Director, Admin

---

### 16. 🚨 Health Alerts (health-alerts.tsx)
**Descripción**: Sistema de alertas de salud

**Funcionalidades**:
- ✅ **Alertas automáticas**:
  - Animales enfermos
  - Peso crítico
  - Edad avanzada
  - Capacidad de jaula excedida

- ✅ **Notificaciones**:
  - En tiempo real
  - Por email (si configurado)
  - Dashboard

- ✅ **Gestión de alertas**:
  - Marcar como leída
  - Resolver
  - Asignar responsable
  - Agregar notas

- ✅ **Prioridades**:
  - Crítica
  - Alta
  - Media
  - Baja

**Permisos**: Todos los usuarios autenticados

---

### 17. 👨‍💼 Admin (admin.tsx)
**Descripción**: Panel de administración del sistema

**Funcionalidades**:
- ✅ Configuración del sistema
- ✅ Gestión de permisos
- ✅ Logs del sistema
- ✅ Mantenimiento de base de datos
- ✅ Estadísticas globales
- ✅ Configuración de emails
- ✅ Backup y restauración

**Permisos**: Admin only

---

### 18. 📱 Animal QR Detail (animal-qr-detail.tsx)
**Descripción**: Detalles de animal accedidos vía QR

**Funcionalidades**:
- ✅ Información completa del animal
- ✅ Historial de cambios
- ✅ Jaula actual
- ✅ Estado de salud
- ✅ Acciones rápidas
- ✅ Optimizado para móvil

**Permisos**: Todos los usuarios autenticados

---

### 19. 🏠 Cage QR Detail (cage-qr-detail.tsx)
**Descripción**: Detalles de jaula accedidos vía QR

**Funcionalidades**:
- ✅ Información de jaula
- ✅ Lista de animales
- ✅ Ocupación actual
- ✅ Agregar/remover animales
- ✅ Optimizado para móvil

**Permisos**: Todos los usuarios autenticados

---

### 20. 🎫 Claim Blank QR (claim-blank-qr.tsx)
**Descripción**: Reclamar y asignar códigos QR en blanco

**Funcionalidades**:
- ✅ Escanear código blank
- ✅ Asignar a nueva jaula
- ✅ Crear jaula automáticamente
- ✅ Agregar animales
- ✅ Workflow completo

**Permisos**: Employee, Director, Admin

---

### 21. 🔐 Local Login (local-login.tsx)
**Descripción**: Página de inicio de sesión local

**Funcionalidades**:
- ✅ Login con email/password
- ✅ Validación de credenciales
- ✅ Sesiones persistentes
- ✅ Recordar sesión
- ✅ Recuperación de contraseña (si configurado)

**Permisos**: Público

---

### 22. 🏠 Landing (landing.tsx)
**Descripción**: Página de inicio/bienvenida

**Funcionalidades**:
- ✅ Presentación del sistema
- ✅ Opciones de login
- ✅ Información general

**Permisos**: Público

---

## 🧩 Componentes Principales

### Navegación
- **Sidebar**: Menú lateral principal
- **MobileHeader**: Encabezado móvil
- **MobileBottomNav**: Navegación inferior móvil
- **MobileMenu**: Menú hamburguesa

### UI Componentes
- **FloatingActionButton**: Botón de acción flotante
- **CompanyViewBanner**: Banner de vista de empresa
- **GlobalSearch**: Búsqueda global
- **QRCodeGenerator**: Generador de códigos QR
- **PrintQRCode**: Componente de impresión

### UI Library (shadcn/ui)
- Alert Dialog
- Badge
- Button
- Card
- Carousel
- Checkbox
- Collapsible
- Context Menu
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Popover
- Progress
- Radio Group
- Select
- Separator
- Sheet
- Slider
- Switch
- Table
- Tabs
- Toast
- Toggle
- Tooltip
- Y muchos más...

---

## 🎨 Contextos (Providers)

### ThemeProvider (theme-context)
- ✅ Tema claro/oscuro
- ✅ Persistencia en localStorage
- ✅ Cambio dinámico
- ✅ Mejora de contraste en modo claro

### LanguageProvider (language-context)
- ✅ Soporte multi-idioma
- ✅ Español por defecto
- ✅ Cambio dinámico
- ✅ Persistencia

### CompanyProvider (company-context)
- ✅ Contexto de empresa activa
- ✅ Override para Admins
- ✅ Filtrado automático
- ✅ Invalidación de caché

---

## 🔌 APIs y Endpoints

### Autenticación
- POST `/api/login/local` - Login local
- GET `/api/auth/callback` - Callback OIDC
- POST `/api/logout` - Cerrar sesión
- GET `/api/user` - Usuario actual

### Animales
- GET `/api/animals` - Listar
- POST `/api/animals` - Crear (uno o varios)
- GET `/api/animals/:id` - Obtener uno
- PUT `/api/animals/:id` - Actualizar
- DELETE `/api/animals/:id` - Eliminar
- GET `/api/animals/search` - Buscar

### Jaulas
- GET `/api/cages` - Listar
- POST `/api/cages` - Crear
- GET `/api/cages/:id` - Obtener
- PUT `/api/cages/:id` - Actualizar
- DELETE `/api/cages/:id` - Eliminar

### Códigos QR
- GET `/api/qr-codes` - Listar
- POST `/api/qr-codes` - Generar
- GET `/api/qr-codes/:code` - Por código
- POST `/api/qr-codes/generate-blank` - Generar blanks
- POST `/api/qr-codes/print-multiple` - Imprimir
- PUT `/api/qr-codes/:id/status` - Actualizar estado

### Dashboard
- GET `/api/dashboard/stats` - Estadísticas
- GET `/api/dashboard/recent-activity` - Actividad

### Empresas
- GET `/api/companies` - Listar
- POST `/api/companies` - Crear
- GET `/api/companies/:id` - Obtener
- PUT `/api/companies/:id` - Actualizar

### Usuarios
- GET `/api/users` - Listar
- POST `/api/users` - Crear
- GET `/api/users/:id` - Obtener
- PUT `/api/users/:id` - Actualizar
- DELETE `/api/users/:id` - Soft delete
- POST `/api/users/invite` - Invitar

### Cepas
- GET `/api/strains` - Listar
- POST `/api/strains` - Crear
- GET `/api/strains/:id` - Obtener
- PUT `/api/strains/:id` - Actualizar

### Genotipos
- GET `/api/genotypes` - Listar
- POST `/api/genotypes` - Crear

### Reportes de Genotipado
- GET `/api/genotyping-reports` - Listar
- POST `/api/genotyping-reports` - Subir
- GET `/api/genotyping-reports/:id/download` - Descargar
- DELETE `/api/genotyping-reports/:id` - Eliminar

### Papelera
- GET `/api/trash/users` - Usuarios eliminados
- GET `/api/trash/animals` - Animales eliminados
- GET `/api/trash/cages` - Jaulas eliminadas
- POST `/api/trash/:type/:id/restore` - Restaurar

---

## 📊 Base de Datos - Esquema Completo

### Tablas:
1. **sessions** - Sesiones de usuario
2. **companies** - Empresas/organizaciones
3. **users** - Usuarios del sistema
4. **userInvitations** - Invitaciones pendientes
5. **cages** - Jaulas
6. **animals** - Animales
7. **strains** - Cepas
8. **genotypes** - Genotipos
9. **qrCodes** - Códigos QR
10. **genotypingReports** - Reportes de genotipado
11. **genotypingReportStrains** - Relación many-to-many

### Relaciones:
- Companies → Users (one-to-many)
- Companies → Cages (one-to-many)
- Companies → Animals (one-to-many)
- Companies → Strains (one-to-many)
- Companies → QRCodes (one-to-many)
- Cages → Animals (one-to-many)
- Strains → Animals (one-to-many)
- Genotypes → Animals (one-to-many)
- Reports → Strains (many-to-many)

---

## 🔐 Sistema de Permisos

### Admin
- ✅ Acceso total a todo
- ✅ Multi-empresa
- ✅ Gestión de usuarios global
- ✅ Configuración del sistema
- ✅ Ver/editar todas las empresas

### Director
- ✅ Gestión completa de su empresa
- ✅ Crear/editar usuarios de su empresa
- ✅ Ver todos los datos de su empresa
- ✅ Generar reportes
- ✅ Configuración de empresa

### Employee
- ✅ Operaciones diarias
- ✅ Crear/editar animales
- ✅ Crear/editar jaulas
- ✅ Generar códigos QR
- ✅ Escanear códigos QR
- ✅ Ver dashboards
- ⛔ No puede gestionar usuarios

---

## 📱 Características Móviles

### Responsividad
- ✅ Mobile-first design
- ✅ Breakpoints optimizados
- ✅ Navegación táctil
- ✅ Botones grandes (44px+)

### Componentes Móviles
- ✅ Bottom navigation
- ✅ Mobile header
- ✅ Hamburger menu
- ✅ Swipe gestures
- ✅ Touch-optimized forms

### Funciones Móviles
- ✅ Escaneo de QR con cámara
- ✅ Acceso rápido a animales
- ✅ Actualizaciones in-situ
- ✅ Offline indicators

---

## 🚀 Rendimiento

### Frontend
- ✅ Code splitting
- ✅ Lazy loading
- ✅ React Query caching
- ✅ Optimistic updates

### Backend
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Indexed columns
- ✅ Prepared statements

---

## 🎯 Total de Características

- **22 Páginas/Vistas principales**
- **50+ Componentes React**
- **40+ Endpoints API**
- **11 Tablas de base de datos**
- **4 Niveles de permisos**
- **3 Métodos de autenticación**
- **Multi-tenancy completo**
- **Sistema de papelera**
- **Exportación multi-formato**
- **Sistema de QR completo**
- **Mobile-optimized**

---

**¡Un sistema completo y profesional para gestión de laboratorio!** 🔬🐭✨

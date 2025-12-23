# 🚀 Guía Rápida de Inicio - Animal Lab Management

## ¡Bienvenido a tu Sistema de Gestión de Laboratorio!

Esta guía te ayudará a poner en marcha tu proyecto en minutos.

---

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Verificar Instalación
```bash
# Asegúrate de estar en el directorio del proyecto
cd animal-lab-management

# Verifica que las dependencias estén instaladas
npm install
```

### Paso 2: Configurar Base de Datos

Tienes dos opciones:

#### Opción A: Usar Neon Database (Recomendado - Gratis)

1. Ve a https://neon.tech
2. Crea una cuenta gratis
3. Crea un nuevo proyecto
4. Copia la cadena de conexión (DATABASE_URL)

#### Opción B: PostgreSQL Local

```bash
# Instalar PostgreSQL
# En Ubuntu/Debian:
sudo apt-get install postgresql

# Crear base de datos
sudo -u postgres createdb animal_lab_db
```

### Paso 3: Configurar Variables de Entorno

Edita el archivo `.env` que ya existe:

```env
# Reemplaza esta línea con tu URL real:
DATABASE_URL="postgresql://user:password@host:5432/animal_lab_db"

# El resto puede quedarse así por ahora:
SESSION_SECRET="dev-secret-change-in-production"
PORT=5000
NODE_ENV=development
```

### Paso 4: Inicializar Base de Datos

```bash
# Crear las tablas en la base de datos
npm run db:push
```

Verás algo como:
```
✓ Applying migrations...
✓ Database synchronized
```

### Paso 5: Crear Usuario Admin

```bash
# Ejecutar script de creación de admin
node create-admin.js
```

Sigue las instrucciones en pantalla para crear tu primer usuario administrador.

### Paso 6: ¡Iniciar la Aplicación!

```bash
# Modo desarrollo
npm run dev
```

Abre tu navegador en: **http://localhost:5000**

---

## 🎯 Primeros Pasos en la Aplicación

### 1. Iniciar Sesión
- Email: el que configuraste en create-admin
- Password: la que estableciste

### 2. Crear tu Primera Empresa
1. Ve a "Companies" en el menú lateral
2. Haz clic en "Add Company"
3. Completa el formulario
4. Guarda

### 3. Crear Usuarios
1. Ve a "Users"
2. Haz clic en "Add User"
3. Asigna roles:
   - **Admin**: Acceso total
   - **Director**: Gestión completa de su empresa
   - **Employee**: Operaciones diarias

### 4. Configurar Cepas
1. Ve a "Strains"
2. Agrega las cepas que usas en tu laboratorio
3. Ejemplo: C57BL/6, BALB/c, etc.

### 5. Crear Jaulas
1. Ve a "Cages"
2. Crea jaulas con:
   - Número de jaula
   - Habitación
   - Ubicación
   - Tipo (Active, Breeding, etc.)

### 6. Agregar Animales
1. Ve a "Animals"
2. Usa "Add Animals" para crear uno o varios
3. Puedes crear en lote (batch) para eficiencia
4. Asigna a jaulas existentes

### 7. Generar Códigos QR
1. Ve a "QR Codes"
2. Opciones:
   - Generar códigos para animales específicos
   - Crear códigos "blank" para imprimir
   - Imprimir en hojas Avery 8160

### 8. Escanear QR
1. Usa "QR Scanner" en el menú
2. Permite acceso a la cámara
3. Apunta al código QR
4. Verás la información del animal/jaula al instante

---

## 📱 Funciones Principales

### Dashboard
- Resumen de animales, jaulas, códigos QR
- Estadísticas en tiempo real
- Actividad reciente

### Gestión de Animales
- **Crear**: Individual o por lotes
- **Editar**: Actualizar información
- **Buscar**: Filtros avanzados
- **Exportar**: CSV, Excel, PDF

### Códigos QR
- **Generar**: Para animales y jaulas
- **Imprimir**: Formato Avery 8160
- **Escanear**: Con cámara del móvil
- **Rastrear**: Ciclo de vida completo

### Reportes
- Genotipos
- Salud de animales
- Ocupación de jaulas
- Historial de actividades

---

## 🛠️ Solución de Problemas Comunes

### Error: "DATABASE_URL must be set"
**Solución**: Verifica que tu archivo `.env` tenga la URL correcta de la base de datos.

### Error: "Cannot connect to database"
**Solución**: 
1. Verifica que PostgreSQL esté corriendo
2. Comprueba las credenciales
3. Asegúrate de que el puerto sea el correcto (5432 por defecto)

### Error: "Port 5000 already in use"
**Solución**: Cambia el puerto en `.env`:
```env
PORT=3000
```

### La página se ve rota o sin estilos
**Solución**: 
```bash
# Reconstruir el frontend
npm run build
```

### Cambios en el código no se reflejan
**Solución**: 
1. Detén el servidor (Ctrl+C)
2. Limpia caché: `rm -rf dist/`
3. Reinicia: `npm run dev`

---

## 🔐 Seguridad - Importante

### En Desarrollo ✅
- Usa `NODE_ENV=development`
- Session secret puede ser simple

### En Producción ⚠️
1. **Cambia el SESSION_SECRET**:
   ```bash
   # Genera un secret seguro
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Usa HTTPS siempre**

3. **Protege tu .env**:
   - Nunca lo subas a GitHub
   - Usa variables de entorno del hosting

4. **Configura CORS apropiadamente** (en producción)

---

## 🚢 Desplegar a Producción

### Opción 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Opción 2: Railway
1. Crea cuenta en railway.app
2. Conecta tu repositorio
3. Configura variables de entorno
4. Deploy automático

### Opción 3: Render
1. Crea cuenta en render.com
2. New Web Service
3. Conecta repositorio
4. Configura:
   - Build: `npm install && npm run build`
   - Start: `npm start`

---

## 📚 Recursos Adicionales

### Documentación
- **Completa**: Ver `PROJECT_OVERVIEW.md`
- **API**: Ver `server/routes.ts` (comentarios en código)
- **Schema**: Ver `shared/schema.ts`

### Tecnologías Usadas
- [React](https://react.dev) - Frontend framework
- [Express](https://expressjs.com) - Backend framework
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components

### Comunidad
- GitHub Issues: Para reportar bugs
- GitHub Discussions: Para preguntas
- Pull Requests: Para contribuir

---

## 💡 Consejos Pro

1. **Usa los atajos**:
   - Crea templates para animales frecuentes
   - Usa "Copy Last Animal" para entrada rápida

2. **Organiza tus datos**:
   - Usa un sistema de numeración consistente
   - Mantén las cepas actualizadas
   - Documenta cambios importantes

3. **Aprovecha el móvil**:
   - Escanea QR desde el laboratorio
   - Actualiza información en tiempo real
   - Verifica estado de animales rápidamente

4. **Exporta regularmente**:
   - Haz backups de tus datos
   - Exporta reportes semanales
   - Guarda snapshots importantes

5. **Colabora eficientemente**:
   - Asigna roles apropiados
   - Usa múltiples empresas si es necesario
   - Revisa el dashboard diariamente

---

## ✅ Checklist de Configuración

- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos configurada
- [ ] Archivo `.env` configurado
- [ ] Esquema de DB sincronizado (`npm run db:push`)
- [ ] Usuario admin creado
- [ ] Aplicación corriendo (`npm run dev`)
- [ ] Login exitoso
- [ ] Primera empresa creada
- [ ] Primer usuario adicional creado
- [ ] Primera cepa agregada
- [ ] Primera jaula creada
- [ ] Primer animal agregado
- [ ] Código QR generado y probado

---

## 🎉 ¡Todo Listo!

Ya tienes tu sistema de gestión de laboratorio funcionando. 

**Siguientes pasos sugeridos**:
1. Importa tus datos existentes (si los tienes)
2. Capacita a tu equipo
3. Personaliza según tus necesidades
4. Explora todas las funcionalidades

**¿Necesitas ayuda?**
- Revisa la documentación completa
- Crea un issue en GitHub
- Contacta al equipo

---

**¡Buena suerte con tu laboratorio! 🔬🐭**

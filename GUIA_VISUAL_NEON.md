# 🎯 GUÍA VISUAL NEON.TECH - CON IMÁGENES

## YA TIENES CUENTA ✓ - AHORA SIGUE ESTOS PASOS EXACTOS

---

## 🖥️ PANTALLA 1: DASHBOARD DE NEON

**Lo que verás:**
```
┌─────────────────────────────────────────────────────┐
│ Neon                                     [New Project]│
│                                                      │
│  Projects                                            │
│  ┌──────────────────────────────────────┐          │
│  │  No projects yet                     │          │
│  │  Create your first project           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

**ACCIÓN:** Haz clic en el botón verde **"New Project"** (esquina superior derecha)

---

## 🖥️ PANTALLA 2: CREAR PROYECTO

**Lo que verás:**
```
┌─────────────────────────────────────────────────────┐
│ Create a Project                                     │
│                                                      │
│ Project name: [___animal-lab-db_______________]     │
│                                                      │
│ Region:       [▼ US East (Ohio)              ]     │
│               • US East (Ohio)                       │
│               • US West (Oregon)                     │
│               • Europe West (Amsterdam)              │
│                                                      │
│ Postgres:     [▼ 16                          ]     │
│                                                      │
│                            [Cancel] [Create Project] │
└─────────────────────────────────────────────────────┘
```

**ACCIONES:**
1. **Project name**: Escribe `animal-lab-db` (o tu nombre preferido)
2. **Region**: Selecciona el más cercano a ti
3. **Postgres**: Deja el valor por defecto (16)
4. Haz clic en **"Create Project"** (botón verde)

---

## 🖥️ PANTALLA 3: INFORMACIÓN DE CONEXIÓN

**Lo que verás después de crear:**
```
┌─────────────────────────────────────────────────────┐
│ animal-lab-db                                        │
│                                                      │
│ ✓ Project created successfully                       │
│                                                      │
│ Connection string                                    │
│ ┌──────────────────────────────────────────────────┐│
│ │ Pooled connection                           [Copy]││
│ │ ******user:pass@ep-xxx.region.neon.tech/... ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Direct connection                           [Copy]││
│ │ ******user:pass@ep-xxx.region.neon.tech/... ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**ACCIÓN CRÍTICA:** 
1. **USA LA PRIMERA** - "Pooled connection" 
2. Haz clic en el botón **[Copy]** 
3. ¡Ya tienes tu DATABASE_URL copiada! ✓

---

## 💻 AHORA EN TU COMPUTADORA

### OPCIÓN 1: USAR SCRIPT AUTOMÁTICO (SÚPER FÁCIL) ⭐

Abre tu terminal y ejecuta:

```bash
node setup-neon.js
```

Te pedirá:
1. **Pega tu DATABASE_URL** (la que copiaste de Neon)
2. **Email** para el admin
3. **Nombre** 
4. **Apellido**
5. **Contraseña** (mínimo 8 caracteres)

**¡Y LISTO!** El script hace todo automáticamente:
- ✅ Crea archivo .env
- ✅ Instala dependencias (npm install)
- ✅ Crea tablas en la base de datos
- ✅ Crea tu usuario administrador

Luego solo ejecuta:
```bash
npm run dev
```

---

### OPCIÓN 2: MANUAL (SI PREFIERES HACERLO PASO A PASO)

#### Paso 1: Crear archivo .env

En la raíz del proyecto, crea un archivo llamado `.env` con este contenido:

```env
DATABASE_URL="PEGA_AQUI_TU_URL_DE_NEON"
SESSION_SECRET="cambia-esto-por-algo-aleatorio-y-seguro"
PORT=5000
NODE_ENV=development
HOST=0.0.0.0
```

**IMPORTANTE:** Reemplaza `PEGA_AQUI_TU_URL_DE_NEON` con la URL que copiaste.

#### Paso 2: Instalar dependencias

```bash
npm install
```

Espera 2-3 minutos. Verás al final: `added 640 packages`

#### Paso 3: Crear tablas

```bash
npm run db:push
```

Verás: `✓ Done!`

#### Paso 4: Crear admin

```bash
node create-admin.js
```

Responde las preguntas:
- Email: `tu@email.com`
- Nombre: `Tu Nombre`
- Apellido: `Tu Apellido`
- Contraseña: `mínimo8caracteres`
- Confirmar: `mínimo8caracteres`

#### Paso 5: Ejecutar

```bash
npm run dev
```

---

## 🌐 ABRIR EN NAVEGADOR

1. Abre tu navegador favorito
2. Ve a: **http://localhost:5000**
3. Verás la pantalla de login

```
┌─────────────────────────────────────────┐
│   🔬 Animal Lab Management              │
│                                         │
│   Email:    [________________]          │
│                                         │
│   Password: [________________]          │
│                                         │
│            [  Login  ]                  │
└─────────────────────────────────────────┘
```

4. Ingresa tus credenciales
5. ¡LISTO! Verás el dashboard

---

## 🎉 LO QUE VERÁS DESPUÉS DEL LOGIN

### Dashboard Principal
```
╔════════════════════════════════════════════════╗
║  Dashboard                                     ║
╠════════════════════════════════════════════════╣
║                                                ║
║  ┌─────────┐  ┌─────────┐  ┌─────────┐       ║
║  │ 0       │  │ 0       │  │ 0       │       ║
║  │ Animals │  │ Cages   │  │ QR Codes│       ║
║  └─────────┘  └─────────┘  └─────────┘       ║
║                                                ║
║  [+ Add Animal]  [+ Add Cage]  [+ Generate QR]║
║                                                ║
╚════════════════════════════════════════════════╝
```

### Menú Lateral
```
┌────────────────┐
│ 🏠 Dashboard   │
│ 🐭 Animals     │
│ 🏠 Cages       │
│ 📱 QR Scanner  │
│ 🎫 QR Codes    │
│ 🧬 Strains     │
│ 🧬 Genotypes   │
│ 🏢 Companies   │
│ 👥 Users       │
│ 📊 Reports     │
│ 🗑️  Trash      │
└────────────────┘
```

---

## 📱 EN MÓVIL SE VERÁ ASÍ

```
┌─────────────────────┐
│ ≡  Animal Lab   👤 │ ← Header
├─────────────────────┤
│                     │
│  Dashboard          │
│  ┌───┐ ┌───┐ ┌───┐ │
│  │ 0 │ │ 0 │ │ 0 │ │
│  └───┘ └───┘ └───┘ │
│                     │
│  [+ Add Animal]     │
│                     │
├─────────────────────┤
│ 🏠  🐭  📱  🎫  ⚙️  │ ← Bottom Nav
└─────────────────────┘
```

---

## ❓ PREGUNTAS FRECUENTES

### ¿Dónde está la URL de Neon?
En el dashboard de Neon, haz clic en tu proyecto → Connection Details → Copy "Pooled connection"

### ¿La URL es segura?
Sí, pero NO LA COMPARTAS. El archivo `.env` está en `.gitignore` y no se sube a GitHub.

### ¿Cuánto cuesta Neon?
El plan Free es gratis para siempre. Incluye 0.5GB de almacenamiento, suficiente para empezar.

### ¿Puedo cambiar la contraseña después?
Sí, desde la interfaz de usuarios puedes editar tu perfil.

### ¿Funciona en Windows/Mac/Linux?
Sí, funciona en todos los sistemas operativos.

---

## ✅ CHECKLIST FINAL

Antes de contactarme, verifica que completaste:

- [ ] ✓ Cuenta creada en Neon.tech
- [ ] ✓ Proyecto creado en Neon (animal-lab-db)
- [ ] ✓ DATABASE_URL copiada (la Pooled connection)
- [ ] ✓ Ejecuté `node setup-neon.js` O configuré .env manualmente
- [ ] ✓ `npm install` terminó exitosamente
- [ ] ✓ `npm run db:push` completado
- [ ] ✓ `node create-admin.js` ejecutado
- [ ] ✓ `npm run dev` corriendo
- [ ] ✓ Navegador abierto en localhost:5000
- [ ] ✓ Login exitoso
- [ ] ✓ ¡ESTOY VIENDO MI PROYECTO! 🎉

---

## 🆘 SI ALGO SALE MAL

Revisa `SETUP_NEON_DETALLADO.md` - Tiene soluciones a todos los errores comunes.

---

**¡Sigue estos pasos exactamente y en 5 minutos estarás viendo tu proyecto!** ⚡

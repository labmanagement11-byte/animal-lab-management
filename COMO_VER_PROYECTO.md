# 🚀 GUÍA VISUAL - CÓMO VER TU PROYECTO AHORA MISMO

## ⚡ OPCIÓN 1: VER EL PROYECTO SIN BASE DE DATOS (DEMO RÁPIDO)

Esta es la forma MÁS RÁPIDA de ver la interfaz del proyecto funcionando (aunque las funcionalidades que requieren base de datos no funcionarán).

### Paso 1: Abrir Terminal
```bash
# Si estás en tu computadora local, abre la terminal
# Si estás en Replit, usa la consola (Shell)
```

### Paso 2: Ir al Directorio del Proyecto
```bash
cd /ruta/a/tu/proyecto/animal-lab-management
# O si ya estás ahí, continúa al siguiente paso
```

### Paso 3: Ejecutar el Servidor
```bash
npm run dev
```

### Paso 4: Abrir en el Navegador
```
http://localhost:5000
```

**¡Eso es todo!** Verás la interfaz del proyecto.

⚠️ **Nota**: Sin base de datos, algunas funciones no trabajarán (login, datos, etc). Para funcionalidad completa, sigue la Opción 2.

---

## 🗄️ OPCIÓN 2: VER EL PROYECTO COMPLETO CON BASE DE DATOS

Para ver TODO funcionando (login, animales, jaulas, QR codes, etc), necesitas configurar una base de datos.

### Método A: Usar Neon Database (GRATIS y FÁCIL) ⭐ RECOMENDADO

#### Paso 1: Crear Cuenta en Neon
1. Ve a: **https://neon.tech**
2. Haz clic en "Sign Up" (Registrarse)
3. Usa tu email o GitHub
4. Es GRATIS para empezar

#### Paso 2: Crear Proyecto
1. Una vez dentro, haz clic en "New Project"
2. Dale un nombre: `animal-lab-db` (o el que quieras)
3. Selecciona región más cercana a ti
4. Haz clic en "Create Project"

#### Paso 3: Copiar la URL de Conexión
1. En la página del proyecto, verás "Connection String"
2. Copia la URL completa que se ve así:
   ```
   postgresql://usuario:password@host.neon.tech/dbname?sslmode=require
   ```
3. **¡Guárdala!** La necesitarás en el siguiente paso

#### Paso 4: Configurar .env
1. En tu proyecto, crea (o edita) el archivo `.env`
2. Pega esto, **reemplazando la URL con la tuya**:
   ```env
   DATABASE_URL="postgresql://tu-url-de-neon-aqui"
   SESSION_SECRET="cambia-esto-por-algo-seguro-y-aleatorio"
   PORT=5000
   NODE_ENV=development
   ```

#### Paso 5: Inicializar la Base de Datos
```bash
# En la terminal de tu proyecto:
npm run db:push
```

Deberías ver:
```
✓ Pushing schema...
✓ Done!
```

#### Paso 6: Crear Usuario Administrador
```bash
node create-admin.js
```

Sigue las instrucciones:
- Email: tu@email.com
- Nombre: Tu Nombre
- Contraseña: (la que quieras)
- Confirma contraseña

#### Paso 7: ¡Ejecutar el Proyecto!
```bash
npm run dev
```

#### Paso 8: Abrir en Navegador
```
http://localhost:5000
```

#### Paso 9: Iniciar Sesión
- Email: el que usaste en create-admin
- Contraseña: la que configuraste

🎉 **¡LISTO! Ahora tienes acceso completo a todo el sistema!**

---

### Método B: Usar PostgreSQL Local (Más Técnico)

#### Si prefieres instalar PostgreSQL en tu computadora:

**En Ubuntu/Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb animal_lab_db
```

**En Mac:**
```bash
brew install postgresql
brew services start postgresql
createdb animal_lab_db
```

**En Windows:**
1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Instala con las opciones por defecto
3. Abre pgAdmin y crea una base de datos llamada `animal_lab_db`

Luego, en tu `.env`:
```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/animal_lab_db"
SESSION_SECRET="cambia-esto-por-algo-seguro"
PORT=5000
NODE_ENV=development
```

Y continúa desde el Paso 5 de arriba (Inicializar la Base de Datos).

---

## 📱 ACCEDER DESDE MÓVIL

Si quieres ver el proyecto en tu teléfono mientras el servidor corre en tu computadora:

### Paso 1: Averigua tu IP Local
**En Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**En Windows:**
```bash
ipconfig
```
Busca "IPv4 Address" (algo como 192.168.1.X)

### Paso 2: Ejecuta el Servidor
```bash
npm run dev
```

### Paso 3: Abre en tu Teléfono
```
http://TU-IP-LOCAL:5000
```
Ejemplo: `http://192.168.1.100:5000`

---

## 🔥 DESPLEGAR EN INTERNET (GRATIS)

### Opción A: Vercel (MÁS FÁCIL)

1. **Crear cuenta**: https://vercel.com
2. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
3. **Desplegar**:
   ```bash
   vercel
   ```
4. Sigue las instrucciones en pantalla
5. ¡Tu proyecto estará en internet!

### Opción B: Railway

1. **Crear cuenta**: https://railway.app
2. Conecta tu repositorio de GitHub
3. Agrega las variables de entorno (DATABASE_URL, SESSION_SECRET)
4. Railway detecta automáticamente y despliega
5. ¡Listo!

### Opción C: Render

1. **Crear cuenta**: https://render.com
2. Clic en "New +" → "Web Service"
3. Conecta tu repositorio
4. Configurar:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Agrega variables de entorno
6. Clic en "Create Web Service"
7. ¡Desplegado!

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "DATABASE_URL must be set"
**Solución:** Verifica que tu archivo `.env` existe y tiene la DATABASE_URL correcta.

### Error: "Port 5000 already in use"
**Solución:** 
Opción 1: Cambia el puerto en `.env`:
```env
PORT=3000
```

Opción 2: Mata el proceso que está usando el puerto:
```bash
# En Mac/Linux:
lsof -ti:5000 | xargs kill -9

# En Windows:
netstat -ano | findstr :5000
taskkill /PID <el_numero_que_encuentres> /F
```

### Error al conectar a la base de datos
**Solución:** 
1. Verifica que la URL de Neon es correcta
2. Asegúrate de que incluye `?sslmode=require` al final
3. Verifica que copiaste la URL completa

### No aparece nada en el navegador
**Solución:**
1. Verifica que el servidor está corriendo (deberías ver mensajes en la terminal)
2. Intenta abrir: `http://127.0.0.1:5000`
3. Revisa la consola del navegador (F12) para errores

---

## 📸 CÓMO SE VERÁ

### Pantalla de Login
![Login](after_signin.png)

### Dashboard Principal
![Dashboard](dashboard_final.png)

### Vista Móvil - Animales
![Mobile Animals](mobile_animals.png)

### Vista Móvil - Jaulas
![Mobile Cages](mobile_cages.png)

### Códigos QR
![QR Codes](qr-codes-counts.png)

---

## 🎯 RESUMEN RÁPIDO

### Para ver la interfaz INMEDIATAMENTE:
```bash
npm run dev
# Abre: http://localhost:5000
```

### Para funcionalidad COMPLETA:
```bash
# 1. Configura base de datos (Neon.tech - gratis)
# 2. Edita .env con tu DATABASE_URL
# 3. Ejecuta:
npm run db:push
node create-admin.js
npm run dev
# 4. Abre: http://localhost:5000
# 5. Login con tus credenciales
```

---

## 📚 MÁS INFORMACIÓN

- **Guía Completa**: Lee `QUICK_START.md`
- **Todas las Funciones**: Lee `FEATURES_CATALOG.md`
- **Arquitectura**: Lee `PROJECT_OVERVIEW.md`

---

## ✅ CHECKLIST

- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos configurada (Neon o local)
- [ ] Archivo `.env` creado y configurado
- [ ] Base de datos inicializada (`npm run db:push`)
- [ ] Usuario admin creado (`node create-admin.js`)
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Navegador abierto en `http://localhost:5000`
- [ ] Login exitoso

---

**¿Sigues teniendo problemas?** Revisa la sección de "Solución de Problemas" arriba o crea un issue en GitHub.

🎉 **¡Disfruta tu sistema de gestión de laboratorio!** 🔬🐭

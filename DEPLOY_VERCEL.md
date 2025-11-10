# 🚀 GUÍA DE DESPLIEGUE EN VERCEL - URL PERMANENTE

## ✨ Vercel te dará una URL pública permanente GRATIS

Tu proyecto estará disponible 24/7 en: `https://tu-proyecto.vercel.app`

---

## 📋 PASOS PARA DESPLEGAR

### Opción A: Desplegar desde GitHub (MÁS FÁCIL) ⭐

1. **Ve a Vercel**
   - https://vercel.com/signup
   - Haz clic en "Continue with GitHub"
   - Autoriza a Vercel

2. **Importar Proyecto**
   - Clic en "Add New" → "Project"
   - Busca: `animal-lab-management`
   - Clic en "Import"

3. **Configurar Variables de Entorno**
   En la sección "Environment Variables" agrega:
   
   ```
   DATABASE_URL
   postgresql://neondb_owner:npg_QyheaGU2L4pf@ep-dawn-block-a47rlr6z-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   
   ```
   SESSION_SECRET
   animal-lab-secret-9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
   ```
   
   ```
   NODE_ENV
   production
   ```

4. **Desplegar**
   - Clic en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! Te dará una URL como: `https://animal-lab-management.vercel.app`

5. **Configurar Base de Datos**
   
   Después del primer deploy, necesitas crear las tablas:
   
   - Ve a: https://vercel.com/tu-usuario/tu-proyecto/settings
   - Sección "Deployments"
   - Encuentra el deployment más reciente
   - Clic en "..." → "Redeploy"
   - Marca "Use existing Build Cache"
   
   O ejecuta localmente una vez:
   ```bash
   DATABASE_URL="tu_url_de_neon" npm run db:push
   ```

6. **Crear Usuario Admin**
   
   Ejecuta localmente (solo una vez):
   ```bash
   DATABASE_URL="tu_url_de_neon" node create-admin.js
   ```

7. **¡Acceder!**
   - Abre tu URL de Vercel
   - Login con tus credenciales
   - ¡Tu proyecto está en línea permanentemente!

---

### Opción B: Desplegar desde CLI (Alternativa)

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Desplegar**
   ```bash
   vercel
   ```
   
   Te preguntará:
   - Setup and deploy? → Y (Yes)
   - Which scope? → Selecciona tu cuenta
   - Link to existing project? → N (No)
   - What's your project's name? → animal-lab-management
   - In which directory? → ./ (presiona Enter)
   - Override settings? → N (No)

4. **Configurar Variables de Entorno**
   ```bash
   vercel env add DATABASE_URL
   # Pega tu URL de Neon cuando te lo pida
   
   vercel env add SESSION_SECRET
   # Pega: animal-lab-secret-9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
   ```

5. **Deploy a Producción**
   ```bash
   vercel --prod
   ```

6. **Configurar Base de Datos y Admin**
   (Mismo proceso que Opción A, pasos 5-6)

---

## 🎯 CONFIGURACIÓN POST-DEPLOY

### Crear Tablas en la Base de Datos

**Opción 1: Desde tu computadora**
```bash
# Usa tu DATABASE_URL de Neon
DATABASE_URL="postgresql://neondb_owner:npg_QyheaGU2L4pf@ep-dawn-block-a47rlr6z-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" npm run db:push
```

**Opción 2: Agregar script de build en Vercel**

En `package.json`, agrega:
```json
{
  "scripts": {
    "vercel-build": "npm run build && npm run db:push"
  }
}
```

Luego redeploy en Vercel.

### Crear Usuario Administrador

Ejecuta localmente (conecta a tu base de datos Neon):
```bash
DATABASE_URL="postgresql://neondb_owner:npg_QyheaGU2L4pf@ep-dawn-block-a47rlr6z-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" node create-admin.js
```

Ingresa:
- Email: tu@email.com
- Nombre: Tu Nombre
- Apellido: Tu Apellido
- Contraseña: (mínimo 8 caracteres)

---

## 📝 ARCHIVOS DE CONFIGURACIÓN PARA VERCEL

### vercel.json (Ya existe en el proyecto)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

---

## 🌐 TU URL PERMANENTE

Después del deploy, tu proyecto estará disponible en:

```
https://animal-lab-management.vercel.app
```

O una URL personalizada que Vercel te asigne.

**Características:**
- ✅ GRATIS para siempre (con límites generosos)
- ✅ HTTPS automático (seguro)
- ✅ URL permanente
- ✅ Deploy automático cuando haces push a GitHub
- ✅ Rollback instantáneo si algo sale mal
- ✅ 100GB de ancho de banda gratis/mes
- ✅ Serverless functions incluidas

---

## 🔄 ACTUALIZACIONES AUTOMÁTICAS

Una vez conectado a GitHub:
1. Haces cambios en tu código
2. Push a GitHub
3. Vercel detecta el cambio automáticamente
4. Redeploy automático en 1-2 minutos
5. Tu URL siempre tiene la última versión

---

## 🆘 TROUBLESHOOTING

### Error: "Build failed"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `npm run build` funcione localmente

### Error: "DATABASE_URL must be set"
- Ve a Settings → Environment Variables en Vercel
- Agrega DATABASE_URL con tu URL de Neon

### No puedo hacer login
- Asegúrate de haber ejecutado `node create-admin.js`
- Verifica que las tablas existan en Neon

### La página muestra error 500
- Revisa los logs en Vercel (Deployments → Latest → Logs)
- Verifica que DATABASE_URL sea correcta

---

## 📊 MONITOREO

### Ver Logs en Tiempo Real

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. Clic en "Deployments"
4. Clic en el deployment activo
5. Sección "Logs" - verás todos los requests y errores

### Analytics

Vercel te da analytics gratis:
- Número de visitantes
- Tiempo de respuesta
- Errores
- Ubicación geográfica

---

## 💰 COSTOS

**Plan Hobby (GRATIS):**
- ✅ Deploy ilimitados
- ✅ 100GB de ancho de banda
- ✅ Serverless functions
- ✅ 1 equipo con 1 miembro
- ✅ HTTPS automático
- ✅ Git integrations

**Suficiente para:**
- Proyectos personales
- Demos
- MVPs
- Proyectos pequeños de producción

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Cuenta creada en Vercel
- [ ] Proyecto importado desde GitHub
- [ ] DATABASE_URL configurada en Vercel
- [ ] SESSION_SECRET configurada en Vercel
- [ ] NODE_ENV=production configurada
- [ ] Deploy completado exitosamente
- [ ] Tablas creadas en base de datos (db:push)
- [ ] Usuario admin creado (create-admin.js)
- [ ] URL de Vercel probada y funcionando
- [ ] Login exitoso en la URL de Vercel

---

## 🎉 ¡LISTO!

Tu proyecto estará disponible públicamente en:
**https://tu-proyecto.vercel.app**

Accesible desde cualquier lugar, cualquier dispositivo, 24/7.

---

## 📚 RECURSOS ADICIONALES

- **Documentación Vercel**: https://vercel.com/docs
- **Dashboard Vercel**: https://vercel.com/dashboard
- **Soporte Vercel**: https://vercel.com/support

---

**¡Tu Animal Lab Management System estará en línea en menos de 10 minutos!** 🚀

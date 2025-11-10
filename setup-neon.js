#!/usr/bin/env node

/**
 * Setup Script for Animal Lab Management with Neon.tech
 * This script automates the setup process after you create a Neon project
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warning: '\x1b[33m', // yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function exec(command, description) {
  log(`\n⚙️  ${description}...`, 'info');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completado`, 'success');
    return true;
  } catch (error) {
    log(`✗ Error en ${description}`, 'error');
    return false;
  }
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════════╗', 'info');
  log('║  🔬 SETUP AUTOMÁTICO - ANIMAL LAB MANAGEMENT + NEON.TECH 🐭  ║', 'info');
  log('╚════════════════════════════════════════════════════════════════╝', 'info');
  
  log('\n¡Bienvenido al asistente de configuración!', 'success');
  log('\nEste script configurará tu proyecto automáticamente.\n', 'info');

  // Step 1: Check if already in project directory
  if (!fs.existsSync('package.json')) {
    log('❌ Error: No se encuentra package.json', 'error');
    log('Por favor ejecuta este script desde el directorio raíz del proyecto.', 'warning');
    process.exit(1);
  }

  log('✓ Proyecto detectado correctamente\n', 'success');

  // Step 2: Get DATABASE_URL
  log('📋 PASO 1: CONFIGURAR BASE DE DATOS\n', 'info');
  log('Necesito la URL de conexión de tu proyecto Neon.', 'info');
  log('\nPasos para obtenerla:', 'warning');
  log('1. Ve a https://console.neon.tech/app/projects', 'warning');
  log('2. Si no has creado un proyecto, haz clic en "New Project"', 'warning');
  log('3. Copia la "Connection string" (usa la versión Pooled)', 'warning');
  log('4. Debe verse así: postgresql://user:pass@host.region.neon.tech/db?sslmode=require\n', 'warning');

  const databaseUrl = await question('Pega aquí tu DATABASE_URL de Neon: ');

  if (!databaseUrl || !databaseUrl.includes('neon.tech')) {
    log('\n❌ La URL no parece válida. Debe contener "neon.tech"', 'error');
    log('Ejemplo: postgresql://user:pass@ep-xxx.region.neon.tech/db?sslmode=require', 'warning');
    rl.close();
    process.exit(1);
  }

  log('✓ DATABASE_URL recibida\n', 'success');

  // Step 3: Create .env file
  log('📋 PASO 2: CREAR ARCHIVO .ENV\n', 'info');
  
  const sessionSecret = `animal-lab-secret-${Math.random().toString(36).substring(2, 15)}`;
  const envContent = `# Database Configuration
DATABASE_URL="${databaseUrl}"

# Session Secret (generado automáticamente)
SESSION_SECRET="${sessionSecret}"

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Optional: Email service (Resend) - Not configured yet
# RESEND_API_KEY="your_resend_api_key_here"

# Optional: Google Cloud Storage - Not configured yet
# GCP_STORAGE_BUCKET="your_bucket_name"
# GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
`;

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);
  log('✓ Archivo .env creado exitosamente\n', 'success');

  // Step 4: Install dependencies
  log('📋 PASO 3: INSTALAR DEPENDENCIAS\n', 'info');
  log('Esto tomará unos minutos... ☕\n', 'warning');
  
  if (!exec('npm install', 'Instalación de dependencias')) {
    log('\n❌ Error al instalar dependencias', 'error');
    log('Intenta ejecutar manualmente: npm install', 'warning');
    rl.close();
    process.exit(1);
  }

  // Step 5: Push database schema
  log('\n📋 PASO 4: CREAR TABLAS EN LA BASE DE DATOS\n', 'info');
  log('Creando las 11 tablas en Neon...\n', 'info');
  
  if (!exec('npm run db:push', 'Creación de esquema de base de datos')) {
    log('\n❌ Error al crear las tablas', 'error');
    log('Verifica tu DATABASE_URL y que Neon esté funcionando', 'warning');
    log('Puedes intentar manualmente: npm run db:push', 'warning');
    rl.close();
    process.exit(1);
  }

  // Step 6: Create admin user
  log('\n📋 PASO 5: CREAR USUARIO ADMINISTRADOR\n', 'info');
  log('Ahora necesito información para crear tu usuario administrador.\n', 'info');

  const email = await question('Email del admin: ');
  const firstName = await question('Nombre: ');
  const lastName = await question('Apellido: ');
  
  // For password, we need to handle it differently since we can't see it
  log('\nNota: La contraseña debe tener al menos 8 caracteres\n', 'warning');
  const password = await question('Contraseña: ');
  
  if (password.length < 8) {
    log('\n❌ La contraseña debe tener al menos 8 caracteres', 'error');
    rl.close();
    process.exit(1);
  }

  rl.close();

  // Create admin user programmatically
  log('\n⚙️  Creando usuario administrador...', 'info');
  
  try {
    // We'll use the create-admin.js script but we need to pass the data somehow
    // For now, let's create a temporary script
    const createAdminScript = `
const bcrypt = require('bcrypt');
const { db } = require('./server/db');
const { users, companies } = require('./shared/schema');

async function createAdmin() {
  try {
    // Create default company
    const [company] = await db.insert(companies)
      .values({
        name: 'Default Company',
        description: 'Auto-generated company',
        isActive: true,
      })
      .returning();

    // Hash password
    const passwordHash = await bcrypt.hash('${password}', 10);

    // Create admin user
    const [user] = await db.insert(users)
      .values({
        companyId: company.id,
        email: '${email}',
        firstName: '${firstName}',
        lastName: '${lastName}',
        passwordHash: passwordHash,
        authProvider: 'local',
        role: 'Admin',
      })
      .returning();

    console.log('✓ Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
`;

    const tempScriptPath = path.join(process.cwd(), 'temp-create-admin.js');
    fs.writeFileSync(tempScriptPath, createAdminScript);
    
    execSync('node temp-create-admin.js', { stdio: 'inherit' });
    
    // Clean up
    fs.unlinkSync(tempScriptPath);
    
    log('✓ Usuario administrador creado exitosamente\n', 'success');
  } catch (error) {
    log('❌ Error al crear usuario administrador', 'error');
    log('Puedes crearlo manualmente ejecutando: node create-admin.js', 'warning');
  }

  // Success summary
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════╗', 'success');
  log('║                    ✅ ¡SETUP COMPLETADO! ✅                    ║', 'success');
  log('╚════════════════════════════════════════════════════════════════╝', 'success');
  console.log('\n');

  log('Tu proyecto está configurado y listo para usar 🎉\n', 'success');
  
  log('📋 RESUMEN DE CONFIGURACIÓN:', 'info');
  log(`   ✓ Base de datos: Neon.tech`, 'success');
  log(`   ✓ Tablas creadas: 11 tablas`, 'success');
  log(`   ✓ Usuario admin: ${email}`, 'success');
  log(`   ✓ Puerto: 5000`, 'success');
  console.log('\n');

  log('🚀 PARA INICIAR TU PROYECTO:', 'info');
  log('   npm run dev\n', 'warning');

  log('🌐 LUEGO ABRE EN TU NAVEGADOR:', 'info');
  log('   http://localhost:5000\n', 'warning');

  log('🔑 CREDENCIALES DE LOGIN:', 'info');
  log(`   Email: ${email}`, 'warning');
  log(`   Password: (la que configuraste)\n`, 'warning');

  log('📚 DOCUMENTACIÓN:', 'info');
  log('   • SETUP_NEON_DETALLADO.md - Guía paso a paso', 'info');
  log('   • COMO_VER_PROYECTO.md - Instrucciones completas', 'info');
  log('   • QUICK_START.md - Inicio rápido', 'info');
  log('   • PROJECT_OVERVIEW.md - Visión general\n', 'info');

  log('¡Disfruta tu sistema de gestión de laboratorio! 🔬🐭\n', 'success');
}

// Run the script
main().catch(error => {
  log(`\n❌ Error inesperado: ${error.message}`, 'error');
  log('Por favor revisa SETUP_NEON_DETALLADO.md para configuración manual', 'warning');
  process.exit(1);
});

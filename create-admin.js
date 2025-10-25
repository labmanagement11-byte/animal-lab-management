import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password>');
  console.error('Example: node create-admin.js admin@example.com mypassword');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Please set DATABASE_URL before running this script.');
  console.error('Example: export DATABASE_URL="postgresql://user:password@host:5432/dbname"');
  process.exit(1);
}

async function createAdminUser() {
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    console.log('Connected to database successfully.');
    
    // Check if email already exists
    const checkQuery = 'SELECT id, email FROM users WHERE email = $1';
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.error(`ERROR: User with email '${email}' already exists.`);
      process.exit(1);
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Try to insert with password_hash column first (most common)
    // Let the database generate the UUID using its default gen_random_uuid()
    try {
      const insertQuery = `
        INSERT INTO users (email, password_hash, role, auth_provider, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, role
      `;
      
      const result = await client.query(insertQuery, [
        email,
        passwordHash,
        'Admin',
        'local'
      ]);
      
      console.log('✓ Admin user created successfully!');
      console.log('User details:');
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Email: ${result.rows[0].email}`);
      console.log(`  Role: ${result.rows[0].role}`);
      
    } catch (insertError) {
      // Check if error is about column name
      if (insertError.message.includes('password_hash') || 
          insertError.code === '42703') {
        // Try with 'password' column instead
        try {
          const altInsertQuery = `
            INSERT INTO users (email, password, role, auth_provider, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, email, role
          `;
          
          const result = await client.query(altInsertQuery, [
            email,
            passwordHash,
            'Admin',
            'local'
          ]);
          
          console.log('✓ Admin user created successfully!');
          console.log('User details:');
          console.log(`  ID: ${result.rows[0].id}`);
          console.log(`  Email: ${result.rows[0].email}`);
          console.log(`  Role: ${result.rows[0].role}`);
          
        } catch (altError) {
          console.error('ERROR: Failed to insert user with both "password_hash" and "password" columns.');
          console.error('Your database schema may differ from the expected structure.');
          console.error('\nExpected schema:');
          console.error('  - Column for password: "password_hash" or "password"');
          console.error('  - Column for role: "role"');
          console.error('  - Column for auth_provider: "auth_provider"');
          console.error('\nDatabase error:', altError.message);
          process.exit(1);
        }
      } else {
        // Some other error occurred
        console.error('ERROR: Failed to create admin user.');
        console.error('Database error:', insertError.message);
        
        if (insertError.message.includes('unique') || insertError.code === '23505') {
          console.error('\nThis might be a uniqueness constraint violation.');
          console.error('Check if the email or another unique field already exists.');
        } else if (insertError.message.includes('foreign key') || insertError.code === '23503') {
          console.error('\nThis might be a foreign key constraint violation.');
          console.error('Check if required referenced records exist (e.g., company_id).');
        }
        
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('ERROR: Failed to connect or execute query.');
    console.error('Error details:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\nConnection error: Cannot reach the database server.');
      console.error('Please check your DATABASE_URL and network connection.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();

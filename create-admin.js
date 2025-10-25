import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password>');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Define DATABASE_URL in environment before running');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);

  // Adjust column names here if your schema differs
  const sql = `
    INSERT INTO users (id, email, password, role, created_at, is_admin)
    VALUES ($1, $2, $3, $4, now(), true)
  `;

  try {
    await client.query(sql, [id, email, hash, 'admin']);
    console.log('Admin created:', email, 'id=', id);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    console.error('If your users table uses different column names (e.g. password_hash, createdAt, is_active), edit create-admin.js and adjust the INSERT accordingly.');
    process.exit(1);
  } finally {
    await client.end();
  }
})();
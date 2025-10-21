import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Enable CORS
app.use(cors());

// Serve static files from repository root (index.html)
app.use(express.static(path.join(__dirname, "..")));

// Basic API endpoint for health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, msg: 'pong', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

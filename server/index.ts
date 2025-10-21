import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors());

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

// Serve static files from repository root (index.html)
app.use(express.static(path.join(__dirname, "..")));

// Basic API endpoint for health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, msg: 'pong', time: new Date().toISOString() });
});

app.listen(port, host, () => {
  console.log('[express] serving on port', port);
});

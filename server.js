// server.js
import express from 'express';
import cors from 'cors';
import { DataEngine } from './src/services/dataEngine.js';

const app = express();
const engine = new DataEngine();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/dashboard', (req, res) => {
  try {
    const data = engine.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/observation', async (req, res) => {
  try {
    const { text, user } = req.body;
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text es obligatorio.' });
    console.log("📥 Texto recibido:", text);
    const result = await engine.processIncomingObservation(text, user || 'Usuario_UI');
    console.log("✅ Resultado procesamiento:", result);
    res.status(result.status === 'client_not_identified' ? 422 : 200).json(result);
  } catch (error) {
    console.error("💥 ERROR DETALLADO EN EXPRESS:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor Backend Local corriendo en http://localhost:${PORT}`);
});

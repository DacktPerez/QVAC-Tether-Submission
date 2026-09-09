// server.js
import express from 'express';
import cors from 'cors';
import { DataEngine } from './src/services/dataEngine.js';

const app = express();
const engine = new DataEngine();

app.use(cors());
app.use(express.json());

// Obtener datos del Dashboard
app.get('/api/dashboard', (req, res) => {
  try {
    const data = engine.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Procesar nueva observación
app.post('/api/observation', async (req, res) => {
  try {
    const { text, user } = req.body;
    const result = await engine.processIncomingObservation(text, user || 'Usuario_UI');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend Local corriendo en http://localhost:${PORT}`);
});
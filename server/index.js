import express from 'express';
import db from './db.js';

const app = express();
app.use(express.json());

// Endpoint para obtener pacientes
app.get('/api/pacientes', (req, res) => {
  const pacientes = db.prepare('SELECT * FROM pacientes ORDER BY fecha DESC').all();
  res.json(pacientes);
});

// Endpoint para registrar paciente
app.post('/api/pacientes', (req, res) => {
  const { nombre, edad, diagnostico } = req.body;
  const stmt = db.prepare('INSERT INTO pacientes (nombre, edad, diagnostico) VALUES (?, ?, ?)');
  const info = stmt.run(nombre, edad, diagnostico);
  res.json({ id: info.lastInsertRowid, nombre, edad, diagnostico });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor local corriendo en http://localhost:${PORT}`);
});
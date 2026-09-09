// src/services/dataEngine.js
import Database from 'better-sqlite3';
import { qvacService } from './qvacService.js';

export class DataEngine {
  constructor(dbPath = './data/local_installed_base.db') {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(255) NOT NULL,
        pais VARCHAR(100) NOT NULL,
        ciudad VARCHAR(100) NOT NULL,
        ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_cliente_unico UNIQUE (nombre, pais, ciudad)
      );

      CREATE TABLE IF NOT EXISTS equipos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        modalidad VARCHAR(50) NOT NULL,
        marca VARCHAR(100) DEFAULT 'Desconocido',
        modelo VARCHAR(100) DEFAULT 'Desconocido',
        cantidad INTEGER NOT NULL DEFAULT 1,
        antiguedad_estimada INTEGER,
        estado_confirmacion VARCHAR(20) DEFAULT 'Estimado',
        nivel_confianza REAL DEFAULT 0.0,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS observaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        usuario_reporta VARCHAR(100) NOT NULL,
        transcriptor_raw TEXT NOT NULL,
        fecha_observacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        nivel_confianza_observacion REAL NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS preguntas_seguimiento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipo_id INTEGER NOT NULL,
        dato_faltante VARCHAR(50) NOT NULL,
        pregunta_generada TEXT NOT NULL,
        respondida BOOLEAN DEFAULT 0,
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
      );
    `);
  }

  calculateConfidence(equipo, unicosObservadores = 1, diasDesdeUltimo = 0) {
    let scoreCompletitud = 0;
    if (equipo.modalidad) scoreCompletitud += 10;
    if (equipo.cantidad && equipo.cantidad > 0) scoreCompletitud += 10;
    if (equipo.marca && equipo.marca !== 'Desconocido') scoreCompletitud += 10;
    if ((equipo.modelo && equipo.modelo !== 'Desconocido') || equipo.antiguedad_estimada !== null) scoreCompletitud += 10;

    const frescuraFactor = Math.max(0, 1.0 - (diasDesdeUltimo / 365.0));
    const scoreFrescura = frescuraFactor * 30;

    const scoreConfirmaciones = Math.min(30, unicosObservadores * 10);

    return Math.round(scoreCompletitud + scoreFrescura + scoreConfirmaciones);
  }

  async processIncomingObservation(rawText, usuario = 'Usuario_Campo') {
    const extractedData = await qvacService.parseObservation(rawText);
    const { cliente, observaciones } = extractedData;

    let stmtCliente = this.db.prepare(`SELECT id FROM clientes WHERE nombre = ? AND ciudad = ?`);
    let clienteRecord = stmtCliente.get(cliente.nombre, cliente.ciudad || 'Desconocido');

    let clienteId;
    if (!clienteRecord) {
      const insertCliente = this.db.prepare(`
        INSERT INTO clientes (nombre, pais, ciudad) VALUES (?, ?, ?)
      `);
      const result = insertCliente.run(
        cliente.nombre, 
        cliente.pais || 'Panamá', 
        cliente.ciudad || 'Panamá'
      );
      clienteId = result.lastInsertRowid;
    } else {
      clienteId = clienteRecord.id;
      this.db.prepare(`UPDATE clientes SET ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`).run(clienteId);
    }

    const insertObs = this.db.prepare(`
      INSERT INTO observaciones (cliente_id, usuario_reporta, transcriptor_raw, nivel_confianza_observacion)
      VALUES (?, ?, ?, ?)
    `);
    insertObs.run(clienteId, usuario, rawText, 80.0);

    for (const item of observaciones) {
      const equipoExistente = this.db.prepare(`
        SELECT * FROM equipos WHERE cliente_id = ? AND modalidad = ?
      `).get(clienteId, item.modalidad);

      let equipoId;
      if (equipoExistente) {
        const nuevaCantidad = Math.max(equipoExistente.cantidad, item.cantidad || 1);
        const nuevaMarca = (equipoExistente.marca === 'Desconocido') ? (item.marca || 'Desconocido') : equipoExistente.marca;
        const nuevoModelo = (equipoExistente.modelo === 'Desconocido') ? (item.modelo || 'Desconocido') : equipoExistente.modelo;
        const nuevaAntiguedad = item.antiguedad_estimada !== undefined && item.antiguedad_estimada !== null 
          ? item.antiguedad_estimada 
          : equipoExistente.antiguedad_estimada;

        const nuevoPuntaje = this.calculateConfidence({
          modalidad: item.modalidad,
          cantidad: nuevaCantidad,
          marca: nuevaMarca,
          modelo: nuevoModelo,
          antiguedad_estimada: nuevaAntiguedad
        }, 2, 0);

        this.db.prepare(`
          UPDATE equipos 
          SET cantidad = ?, marca = ?, modelo = ?, antiguedad_estimada = ?, 
              estado_confirmacion = 'Reportado', nivel_confianza = ?
          WHERE id = ?
        `).run(nuevaCantidad, nuevaMarca, nuevoModelo, nuevaAntiguedad, nuevoPuntaje, equipoExistente.id);

        equipoId = equipoExistente.id;
      } else {
        const puntaje = this.calculateConfidence(item, 1, 0);
        const insertEquipo = this.db.prepare(`
          INSERT INTO equipos (cliente_id, modalidad, marca, modelo, cantidad, antiguedad_estimada, estado_confirmacion, nivel_confianza)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const res = insertEquipo.run(
          clienteId,
          item.modalidad,
          item.marca || 'Desconocido',
          item.modelo || 'Desconocido',
          item.cantidad || 1,
          item.antiguedad_estimada || null,
          item.estado_confirmacion || 'Estimado',
          puntaje
        );
        equipoId = res.lastInsertRowid;
      }

      this.generateFollowUpQuestions(equipoId, item);
    }

    return { status: 'success', clienteId };
  }

  generateFollowUpQuestions(equipoId, item) {
    if (!item.marca || item.marca === 'Desconocido') {
      this.db.prepare(`
        INSERT INTO preguntas_seguimiento (equipo_id, dato_faltante, pregunta_generada)
        VALUES (?, 'marca', '¿Conoces el fabricante o marca del equipo observado?')
      `).run(equipoId);
    }

    if (item.antiguedad_estimada && item.antiguedad_estimada >= 7 && (!item.modelo || item.modelo === 'Desconocido')) {
      this.db.prepare(`
        INSERT INTO preguntas_seguimiento (equipo_id, dato_faltante, pregunta_generada)
        VALUES (?, 'modelo', 'Al ser un equipo de más de 7 años, ¿cuál es el modelo exacto para evaluar su renovación?')
      `).run(equipoId);
    }
  }

  getDashboardData() {
    const clientes = this.db.prepare(`SELECT * FROM clientes`).all();
    const equipos = this.db.prepare(`
      SELECT e.*, c.nombre as cliente_nombre, c.ciudad, c.pais 
      FROM equipos e 
      JOIN clientes c ON e.cliente_id = c.id
    `).all();
    const oportunidades = equipos.filter(e => e.antiguedad_estimada >= 7);

    return { clientes, equipos, oportunidades };
  }
}
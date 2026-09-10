PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  pais TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(nombre, pais, ciudad)
);

CREATE TABLE IF NOT EXISTS equipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  modalidad TEXT NOT NULL,
  marca TEXT NOT NULL DEFAULT 'Desconocido',
  modelo TEXT NOT NULL DEFAULT 'Desconocido',
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK(cantidad > 0),
  antiguedad_estimada INTEGER CHECK(antiguedad_estimada IS NULL OR antiguedad_estimada >= 0),
  estado_confirmacion TEXT NOT NULL DEFAULT 'Estimado',
  nivel_confianza REAL NOT NULL DEFAULT 0,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, modalidad)
);

CREATE TABLE IF NOT EXISTS observaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_reporta TEXT NOT NULL,
  transcriptor_raw TEXT NOT NULL,
  fecha_observacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  nivel_confianza_observacion REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS preguntas_seguimiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  dato_faltante TEXT NOT NULL,
  pregunta_generada TEXT NOT NULL,
  respondida INTEGER NOT NULL DEFAULT 0
);
